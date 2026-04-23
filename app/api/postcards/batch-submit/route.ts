import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { generatePostcard, PostcardGenerationError } from '@/lib/postcards/generate'
import { submitPostcardToLob } from '@/lib/postcards/submit'
import { chunkArray } from '@/lib/utils'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

const MAX_PER_REQUEST = 100
const CONCURRENCY = 5

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { property_ids?: string[] }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const propertyIds = (body.property_ids ?? []).filter(
    (x): x is string => typeof x === 'string',
  )
  if (!propertyIds.length) {
    return NextResponse.json({ error: 'property_ids required' }, { status: 400 })
  }
  if (propertyIds.length > MAX_PER_REQUEST) {
    return NextResponse.json(
      { error: `Max ${MAX_PER_REQUEST} per request` },
      { status: 400 },
    )
  }

  // Credit preflight
  const { data: profile } = await supabase
    .from('profiles')
    .select('credit_balance')
    .eq('id', user.id)
    .single()

  if (!profile || (profile.credit_balance ?? 0) < propertyIds.length) {
    return NextResponse.json(
      {
        error: 'Insufficient credits',
        required: propertyIds.length,
        available: profile?.credit_balance ?? 0,
      },
      { status: 402 },
    )
  }

  const service = createServiceClient()
  const successes: Array<{ property_id: string; postcard_id: string; lob_id: string }> = []
  const failures: Array<{ property_id: string; error: string; code?: string }> = []

  const chunks = chunkArray(propertyIds, CONCURRENCY)
  for (const chunk of chunks) {
    const results = await Promise.allSettled(
      chunk.map(async (propertyId) => {
        const postcardId = await generatePostcard(service, propertyId)
        const result = await submitPostcardToLob(service, postcardId)
        return { property_id: propertyId, postcard_id: postcardId, lob_id: result.lob_postcard_id }
      }),
    )

    results.forEach((r, i) => {
      if (r.status === 'fulfilled') {
        successes.push(r.value)
      } else {
        const err = r.reason
        const code =
          err instanceof PostcardGenerationError
            ? err.code
            : err instanceof Error && err.name === 'ComplianceError'
              ? 'compliance'
              : 'lob_or_other'
        failures.push({
          property_id: chunk[i],
          error: err instanceof Error ? err.message : String(err),
          code,
        })
      }
    })
  }

  // Mark batch(es) as mailed
  if (successes.length) {
    const { data: batchIds } = await service
      .from('properties')
      .select('batch_id')
      .in(
        'id',
        successes.map((s) => s.property_id),
      )
    const unique = Array.from(
      new Set((batchIds ?? []).map((b: { batch_id: string }) => b.batch_id)),
    )
    for (const bid of unique) {
      const { count } = await service
        .from('postcards')
        .select('*', { count: 'exact', head: true })
        .eq('batch_id', bid)
        .in('status', ['submitted', 'mailed', 'delivered'])
      await service
        .from('scan_batches')
        .update({ total_mailed: count ?? successes.length, status: 'mailed' })
        .eq('id', bid)
    }
  }

  return NextResponse.json({
    submitted: successes.length,
    failed: failures.length,
    successes,
    failures,
    credits_remaining: (profile.credit_balance ?? 0) - successes.length,
  })
}
