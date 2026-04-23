import { NextResponse, type NextRequest } from 'next/server'
import crypto from 'node:crypto'
import { createServiceClient } from '@/lib/supabase/service'

export async function POST(req: NextRequest) {
  const raw = await req.text()
  const sig = req.headers.get('lob-signature') ?? ''

  const secret = process.env.LOB_API_SECRET
  if (!secret) {
    console.error('[lob webhook] LOB_API_SECRET missing')
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 })
  }

  const expected = crypto.createHmac('sha256', secret).update(raw).digest('hex')
  const expectedV1 = `v1=${expected}`
  const ok =
    sig.length === expectedV1.length &&
    crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedV1))
  if (!ok) {
    return NextResponse.json({ error: 'Bad signature' }, { status: 401 })
  }

  let event: {
    event_type?: { id?: string }
    body?: { id?: string }
  }
  try {
    event = JSON.parse(raw)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const lobId = event.body?.id
  if (!lobId) return NextResponse.json({ received: true })

  const service = createServiceClient()
  const { data: postcard } = await service
    .from('postcards')
    .select('id, property_id, user_id, status, lob_tracking_events, profiles!postcards_user_id_fkey(niche)')
    .eq('lob_postcard_id', lobId)
    .maybeSingle()

  if (!postcard) return NextResponse.json({ received: true })

  const eventType = event.event_type?.id ?? ''
  const profilesJoin = (postcard as unknown as {
    profiles: { niche: string } | { niche: string }[] | null
  }).profiles
  const niche =
    (Array.isArray(profilesJoin) ? profilesJoin[0]?.niche : profilesJoin?.niche) ?? null

  // Append to tracking events array (read-modify-write — low volume, safe).
  const existingEvents =
    ((postcard.lob_tracking_events as unknown[] | null) ?? []).slice()
  existingEvents.push({ event_type: eventType, received_at: new Date().toISOString(), body: event.body })

  let newStatus: 'submitted' | 'mailed' | 'delivered' | 'returned' | 'failed' | null = null
  let legacyStatus: string | null = null

  switch (eventType) {
    case 'postcard.created':
    case 'postcard.rendered_pdf':
      newStatus = 'submitted'
      legacyStatus = 'created'
      break
    case 'postcard.mailed':
    case 'postcard.in_transit':
    case 'postcard.in_local_area':
    case 'postcard.processed_for_delivery':
    case 'postcard.re-routed':
    case 'letter.mailed':
    case 'letter.in_transit':
      newStatus = 'mailed'
      legacyStatus = 'in_transit'
      break
    case 'postcard.delivered':
    case 'letter.delivered':
      newStatus = 'delivered'
      legacyStatus = 'delivered'
      break
    case 'postcard.returned_to_sender':
      newStatus = 'returned'
      legacyStatus = 'returned_to_sender'
      break
    case 'postcard.failed':
    case 'letter.failed':
      newStatus = 'failed'
      legacyStatus = 'failed'
      break
  }

  const updatePayload: Record<string, unknown> = {
    lob_tracking_events: existingEvents,
    updated_at: new Date().toISOString(),
  }
  if (newStatus) {
    updatePayload.status = newStatus
    if (newStatus === 'mailed') updatePayload.mailed_at = new Date().toISOString()
    if (newStatus === 'delivered') updatePayload.delivered_at = new Date().toISOString()
  }

  await service.from('postcards').update(updatePayload).eq('id', postcard.id)

  // Keep legacy properties column in sync for existing UI.
  if (legacyStatus) {
    await service
      .from('properties')
      .update({ lob_status: legacyStatus })
      .eq('id', postcard.property_id)
  }

  // Auto-advance CRM lead on delivered.
  if (newStatus === 'delivered') {
    const { data: lead } = await service
      .from('leads')
      .select('id, current_stage, profile_id')
      .eq('property_id', postcard.property_id)
      .maybeSingle()

    if (lead && lead.current_stage === 'postcard_sent') {
      await service.from('leads').update({ current_stage: 'delivered' }).eq('id', lead.id)
      await service.from('lead_activities').insert({
        lead_id: lead.id,
        activity_type: 'stage_change',
        description: 'Postcard confirmed delivered by USPS',
        metadata: { from_stage: 'postcard_sent', to_stage: 'delivered' },
      })
      await service.from('conversion_events').insert({
        property_id: postcard.property_id,
        profile_id: lead.profile_id,
        niche,
        from_stage: 'postcard_sent',
        to_stage: 'delivered',
        metadata: { delivered_at: new Date().toISOString() },
      })
    }
  }

  return NextResponse.json({ received: true })
}
