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
  // Constant-time compare to avoid timing attacks.
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
  const { data: prop } = await service
    .from('properties')
    .select('id, profile_id')
    .eq('lob_postcard_id', lobId)
    .maybeSingle()
  if (!prop) return NextResponse.json({ received: true })

  switch (event.event_type?.id) {
    case 'letter.mailed':
    case 'postcard.mailed':
      await service.from('properties').update({ lob_status: 'mailed' }).eq('id', prop.id)
      break

    case 'letter.in_transit':
    case 'postcard.in_transit':
      await service
        .from('properties')
        .update({ lob_status: 'in_transit' })
        .eq('id', prop.id)
      break

    case 'letter.delivered':
    case 'postcard.delivered': {
      await service
        .from('properties')
        .update({ lob_status: 'delivered' })
        .eq('id', prop.id)

      const { data: lead } = await service
        .from('leads')
        .select('id, current_stage, profile_id')
        .eq('property_id', prop.id)
        .maybeSingle()

      if (lead && lead.current_stage === 'postcard_sent') {
        await service
          .from('leads')
          .update({ current_stage: 'delivered' })
          .eq('id', lead.id)

        await service.from('lead_activities').insert({
          lead_id: lead.id,
          activity_type: 'stage_change',
          description: 'Postcard confirmed delivered by USPS',
          metadata: { from_stage: 'postcard_sent', to_stage: 'delivered' },
        })

        await service.from('conversion_events').insert({
          property_id: prop.id,
          profile_id: lead.profile_id,
          from_stage: 'postcard_sent',
          to_stage: 'delivered',
          metadata: { delivered_at: new Date().toISOString() },
        })
      }
      break
    }

    case 'letter.failed':
    case 'postcard.failed':
      await service.from('properties').update({ lob_status: 'failed' }).eq('id', prop.id)
      console.error(`[lob webhook] failed for ${lobId}`)
      break
  }

  return NextResponse.json({ received: true })
}
