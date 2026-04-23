import { NextResponse, type NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { calculateROI, getNicheOrThrow } from '@/lib/niches'
import { generateSlug } from '@/lib/utils'
import type { NicheId } from '@/types'

export const dynamic = 'force-dynamic'

const DEMO_PROPERTIES = [
  {
    address: '4215 N 38th St',
    city: 'Phoenix',
    state: 'AZ',
    zip: '85018',
    lat: 33.4942,
    lng: -111.998,
    owner_first: 'Michael',
    owner_last: 'Rodriguez',
    build_year: 1998,
    lot_size_sqft: 8712,
    estimated_value: 685000,
    upgrade_score: 92,
    score_reasons: ['Bare dirt front yard', 'No visible landscaping', 'Large lot size'],
    render_url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80',
  },
  {
    address: '7108 E Sheridan St',
    city: 'Scottsdale',
    state: 'AZ',
    zip: '85257',
    lat: 33.4748,
    lng: -111.9254,
    owner_first: 'Jennifer',
    owner_last: 'Chen',
    build_year: 2001,
    lot_size_sqft: 7405,
    estimated_value: 542000,
    upgrade_score: 87,
    score_reasons: ['Dead brown grass', 'Faded exterior', 'Outdated curb appeal'],
    render_url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80',
  },
  {
    address: '2844 E Indianola Ave',
    city: 'Phoenix',
    state: 'AZ',
    zip: '85016',
    lat: 33.4918,
    lng: -112.0143,
    owner_first: 'David',
    owner_last: 'Thompson',
    build_year: 1987,
    lot_size_sqft: 9148,
    estimated_value: 725000,
    upgrade_score: 95,
    score_reasons: ['Empty front yard', 'Gravel with no plants', 'High-value neighborhood'],
    render_url: 'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800&q=80',
  },
  {
    address: '5620 N 10th Pl',
    city: 'Phoenix',
    state: 'AZ',
    zip: '85014',
    lat: 33.5214,
    lng: -112.0586,
    owner_first: 'Sarah',
    owner_last: 'Williams',
    build_year: 1995,
    lot_size_sqft: 6970,
    estimated_value: 478000,
    upgrade_score: 78,
    score_reasons: ['Overgrown weeds', 'No flower beds', 'Aging driveway'],
    render_url: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&q=80',
  },
  {
    address: '3902 E Campbell Ave',
    city: 'Phoenix',
    state: 'AZ',
    zip: '85018',
    lat: 33.5089,
    lng: -112.0012,
    owner_first: 'Robert',
    owner_last: 'Martinez',
    build_year: 2004,
    lot_size_sqft: 7841,
    estimated_value: 612000,
    upgrade_score: 84,
    score_reasons: ['Dirt yard, no grass', 'Minimal landscaping', 'Upscale area'],
    render_url: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80',
  },
  {
    address: '6324 E Virginia Ave',
    city: 'Scottsdale',
    state: 'AZ',
    zip: '85257',
    lat: 33.4795,
    lng: -111.9418,
    owner_first: 'Lisa',
    owner_last: 'Anderson',
    build_year: 1992,
    lot_size_sqft: 8276,
    estimated_value: 558000,
    upgrade_score: 90,
    score_reasons: ['Dead front lawn', 'Sun-damaged plants', 'Empty flower beds'],
    render_url: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&q=80',
  },
  {
    address: '1438 W Vermont Ave',
    city: 'Phoenix',
    state: 'AZ',
    zip: '85015',
    lat: 33.5119,
    lng: -112.0904,
    owner_first: 'James',
    owner_last: 'Garcia',
    build_year: 1984,
    lot_size_sqft: 7622,
    estimated_value: 398000,
    upgrade_score: 75,
    score_reasons: ['Overgrown shrubs', 'Cracked walkway', 'Faded paint'],
    render_url: 'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=800&q=80',
  },
  {
    address: '8510 E Jackrabbit Rd',
    city: 'Scottsdale',
    state: 'AZ',
    zip: '85250',
    lat: 33.5426,
    lng: -111.8982,
    owner_first: 'Emily',
    owner_last: 'Brown',
    build_year: 2006,
    lot_size_sqft: 10454,
    estimated_value: 845000,
    upgrade_score: 89,
    score_reasons: ['Bare dirt yard', 'No trees', 'Premium neighborhood'],
    render_url: 'https://images.unsplash.com/photo-1605146769289-440113cc3d00?w=800&q=80',
  },
] as const

const STAGE_DISTRIBUTION = [
  'postcard_sent',
  'delivered',
  'delivered',
  'page_viewed',
  'responded',
  'appointment_set',
  'quoted',
  'closed_won',
] as const

export async function POST(req: NextRequest) {
  const token = req.headers.get('x-seed-token')
  if (!process.env.DEMO_SEED_TOKEN || token !== process.env.DEMO_SEED_TOKEN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { email?: string; niche?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const email = body.email
  const nicheId = (body.niche ?? 'landscaping') as NicheId
  if (!email) return NextResponse.json({ error: 'email required' }, { status: 400 })

  const niche = getNicheOrThrow(nicheId)
  const service = createServiceClient()

  const { data: profile } = await service
    .from('profiles')
    .select('id, email, company_name')
    .eq('email', email)
    .maybeSingle()
  if (!profile) {
    return NextResponse.json({ error: `No profile for ${email}` }, { status: 404 })
  }

  const { data: batch, error: bErr } = await service
    .from('scan_batches')
    .insert({
      profile_id: profile.id,
      niche: niche.id,
      zip_codes: ['85018', '85257', '85016', '85014', '85015', '85250'],
      status: 'ready',
      total_scanned: DEMO_PROPERTIES.length,
      total_approved: DEMO_PROPERTIES.length,
      progress_pct: 100,
      completed_at: new Date().toISOString(),
    })
    .select('id')
    .single()
  if (bErr || !batch) {
    return NextResponse.json({ error: `batch: ${bErr?.message}` }, { status: 500 })
  }

  const inserted: string[] = []
  for (let i = 0; i < DEMO_PROPERTIES.length; i++) {
    const p = DEMO_PROPERTIES[i]
    const slug = generateSlug()
    const satUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${p.lat},${p.lng}&zoom=19&size=600x400&maptype=satellite&key=${process.env.GOOGLE_MAPS_API_KEY}`
    const svUrl = `https://maps.googleapis.com/maps/api/streetview?size=600x400&location=${p.lat},${p.lng}&fov=80&pitch=5&key=${process.env.GOOGLE_MAPS_API_KEY}`

    const roi = calculateROI(niche, p.estimated_value)
    const low = roi.low
    const high = roi.high

    const { data: prop, error: pErr } = await service
      .from('properties')
      .insert({
        batch_id: batch.id,
        profile_id: profile.id,
        address: p.address,
        city: p.city,
        state: p.state,
        zip: p.zip,
        lat: p.lat,
        lng: p.lng,
        owner_first: p.owner_first,
        owner_last: p.owner_last,
        owner_occupied: true,
        build_year: p.build_year,
        lot_size_sqft: p.lot_size_sqft,
        estimated_value: p.estimated_value,
        upgrade_score: p.upgrade_score,
        score_reasons: p.score_reasons,
        satellite_url: satUrl,
        streetview_url: svUrl,
        render_url: p.render_url,
        landing_slug: slug,
        roi_estimate_low: low,
        roi_estimate_high: high,
        lob_postcard_id: `psc_demo_${Date.now()}_${i}`,
        lob_status: 'in_transit',
        approved: true,
        suppressed: false,
        data_fetched_at: new Date().toISOString(),
        page_views: Math.floor(Math.random() * 5),
      })
      .select('id')
      .single()
    if (pErr || !prop) {
      return NextResponse.json(
        { error: `property ${i}: ${pErr?.message}` },
        { status: 500 },
      )
    }

    const stage = STAGE_DISTRIBUTION[i]
    const leadPayload: Record<string, unknown> = {
      property_id: prop.id,
      profile_id: profile.id,
      current_stage: stage,
    }
    if (stage === 'responded') leadPayload.response_channel = 'phone'
    if (stage === 'quoted') {
      leadPayload.response_channel = 'phone'
      leadPayload.quote_amount = Math.round((low + high) / 2)
    }
    if (stage === 'closed_won') {
      leadPayload.response_channel = 'phone'
      leadPayload.quote_amount = Math.round((low + high) / 2)
      leadPayload.deal_value = Math.round((low + high) / 2)
    }

    const { data: lead } = await service
      .from('leads')
      .insert(leadPayload)
      .select('id')
      .single()

    if (lead) {
      await service.from('lead_activities').insert({
        lead_id: lead.id,
        created_by: profile.id,
        activity_type: 'stage_change',
        description: `Demo seeded at ${stage}`,
        metadata: { to_stage: stage, seeded: true },
      })
      await service.from('conversion_events').insert({
        property_id: prop.id,
        profile_id: profile.id,
        niche: niche.id,
        from_stage: null,
        to_stage: stage,
        metadata: { seeded: true, upgrade_score: p.upgrade_score, zip: p.zip },
      })
    }

    inserted.push(prop.id)
  }

  await service
    .from('scan_batches')
    .update({
      total_mailed: DEMO_PROPERTIES.length,
      status: 'mailed',
    })
    .eq('id', batch.id)

  return NextResponse.json({
    ok: true,
    batch_id: batch.id,
    properties_created: inserted.length,
    stages_seeded: STAGE_DISTRIBUTION,
    message: `Demo batch seeded for ${email} (${niche.label}). View at /batches/${batch.id}`,
  })
}
