import { NextResponse, type NextRequest } from 'next/server'
import { runPipeline } from '@/lib/pipeline/scan'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import type { NicheId } from '@/types'

const MAX_ZIPS = 10
const RATE_LIMIT_PER_HOUR = 3

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { zip_codes?: string[]; niche?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const validZips = (body.zip_codes ?? [])
    .filter((z): z is string => typeof z === 'string' && /^\d{5}$/.test(z))
    .slice(0, MAX_ZIPS)

  if (!validZips.length) {
    return NextResponse.json({ error: 'Valid ZIP codes required' }, { status: 400 })
  }
  if (!body.niche) {
    return NextResponse.json({ error: 'niche required' }, { status: 400 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('credit_balance')
    .eq('id', user.id)
    .single()

  if (!profile || profile.credit_balance < 1) {
    return NextResponse.json({ error: 'Insufficient credits' }, { status: 402 })
  }

  const hourAgo = new Date(Date.now() - 3600000).toISOString()
  const { count } = await supabase
    .from('scan_batches')
    .select('*', { count: 'exact', head: true })
    .eq('profile_id', user.id)
    .gte('created_at', hourAgo)

  if ((count ?? 0) >= RATE_LIMIT_PER_HOUR) {
    return NextResponse.json({ error: 'Max 3 scans per hour' }, { status: 429 })
  }

  const simulate = process.env.SCAN_SIMULATE === '1'
  const service = createServiceClient()
  const { data: batch, error: bErr } = await service
    .from('scan_batches')
    .insert({
      profile_id: user.id,
      niche: body.niche,
      zip_codes: validZips,
      status: simulate ? 'queued' : 'scanning',
    })
    .select()
    .single()

  if (bErr || !batch) {
    return NextResponse.json({ error: 'Failed to create batch' }, { status: 500 })
  }

  if (!simulate) {
    // Fire-and-forget. On Vercel serverless the process may be killed at response time;
    // wire to a queue (Inngest / Trigger.dev / Supabase edge functions) for production.
    runPipeline(batch.id, user.id, validZips, body.niche as NicheId, service).catch(async (err) => {
      console.error('Pipeline failed:', err)
      await service
        .from('scan_batches')
        .update({ status: 'error', error_message: String(err) })
        .eq('id', batch.id)
    })
  }

  return NextResponse.json({ batch_id: batch.id, status: batch.status })
}
