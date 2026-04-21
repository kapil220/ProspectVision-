import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { sendPostcard } from '@/lib/lob'
import { buildFrontHTML, buildBackHTML } from '@/lib/postcardTemplates'
import { getNicheOrThrow } from '@/lib/niches'
import { normalizeAddress } from '@/lib/utils'
import type { Profile, Property } from '@/types'

const MAX_PER_REQUEST = 100

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

  const property_ids = (body.property_ids ?? []).filter(
    (x): x is string => typeof x === 'string',
  )
  if (!property_ids.length) {
    return NextResponse.json({ error: 'property_ids required' }, { status: 400 })
  }
  if (property_ids.length > MAX_PER_REQUEST) {
    return NextResponse.json(
      { error: `Max ${MAX_PER_REQUEST} per request` },
      { status: 400 },
    )
  }

  const { data: profileData } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()
  const profile = profileData as Profile | null
  if (!profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  }

  if (
    !profile.return_address ||
    !profile.return_city ||
    !profile.return_state ||
    !profile.return_zip
  ) {
    return NextResponse.json(
      { error: 'Return address required — update in Settings' },
      { status: 400 },
    )
  }

  if (profile.credit_balance < property_ids.length) {
    return NextResponse.json(
      {
        error: `Need ${property_ids.length} credits, have ${profile.credit_balance}`,
      },
      { status: 402 },
    )
  }

  const service = createServiceClient()
  const { data: propsData, error: pErr } = await service
    .from('properties')
    .select('*, scan_batches!inner(niche)')
    .in('id', property_ids)
    .eq('profile_id', user.id)
    .eq('approved', true)
    .eq('suppressed', false)
  if (pErr) {
    return NextResponse.json({ error: pErr.message }, { status: 500 })
  }

  type PropertyWithBatch = Property & { scan_batches: { niche: string } }
  const properties = (propsData ?? []) as PropertyWithBatch[]

  let mailed = 0
  let balance = profile.credit_balance
  const failures: string[] = []
  const mailedBatchIds = new Set<string>()

  for (const property of properties) {
    try {
      // Iron Rule #7: suppression check BEFORE every Lob call — no exceptions.
      const norm = normalizeAddress(
        `${property.address} ${property.city} ${property.state} ${property.zip}`,
      )
      const { data: sup } = await service
        .from('suppressed_addresses')
        .select('id')
        .eq('address_normalized', norm)
        .maybeSingle()
      if (sup) {
        await service
          .from('properties')
          .update({ suppressed: true })
          .eq('id', property.id)
        continue
      }

      const niche = getNicheOrThrow(property.scan_batches.niche)
      const front = buildFrontHTML(property, profile, niche)
      const back = buildBackHTML(property, profile, niche)

      const ownerName =
        [property.owner_first, property.owner_last].filter(Boolean).join(' ') ||
        'Current Resident'

      const lob = await sendPostcard({
        toName: ownerName,
        toAddress: property.address,
        toCity: property.city,
        toState: property.state,
        toZip: property.zip,
        fromCompany: profile.company_name,
        fromAddress: profile.return_address,
        fromCity: profile.return_city,
        fromState: profile.return_state,
        fromZip: profile.return_zip,
        htmlFront: front,
        htmlBack: back,
        idempotencyKey: `pv-${property.id}`,
      })

      // Iron Rule #8: credits deducted AFTER successful Lob — never before.
      await service
        .from('properties')
        .update({
          lob_postcard_id: lob.id,
          lob_status: 'created',
          lob_expected_delivery: lob.expectedDeliveryDate,
        })
        .eq('id', property.id)

      balance -= 1
      await service
        .from('profiles')
        .update({ credit_balance: balance })
        .eq('id', user.id)

      const { data: lead, error: lErr } = await service
        .from('leads')
        .insert({
          property_id: property.id,
          profile_id: user.id,
          current_stage: 'postcard_sent',
        })
        .select('id')
        .single()
      if (lErr || !lead) throw new Error(`lead insert: ${lErr?.message}`)

      await service.from('lead_activities').insert({
        lead_id: lead.id,
        created_by: user.id,
        activity_type: 'stage_change',
        description: 'Postcard submitted for printing and mailing',
        metadata: { to_stage: 'postcard_sent', lob_id: lob.id },
      })

      await service.from('conversion_events').insert({
        property_id: property.id,
        profile_id: user.id,
        niche: niche.id,
        from_stage: null,
        to_stage: 'postcard_sent',
        metadata: {
          upgrade_score: property.upgrade_score,
          zip: property.zip,
          build_year: property.build_year,
          estimated_value: property.estimated_value,
        },
      })

      mailedBatchIds.add(property.batch_id)
      mailed += 1
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      failures.push(`${property.address}: ${msg}`)
      console.error('[mail] failure for', property.id, err)
    }
  }

  for (const bid of mailedBatchIds) {
    const { count } = await service
      .from('properties')
      .select('*', { count: 'exact', head: true })
      .eq('batch_id', bid)
      .eq('lob_status', 'created')
    await service
      .from('scan_batches')
      .update({ total_mailed: count ?? mailed, status: 'mailed' })
      .eq('id', bid)
  }

  return NextResponse.json({ mailed, failures, credits_remaining: balance })
}
