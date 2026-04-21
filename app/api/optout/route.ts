import { NextResponse, type NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { normalizeAddress } from '@/lib/utils'

export async function POST(req: NextRequest) {
  let body: { slug?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  if (!body.slug) {
    return NextResponse.json({ error: 'slug required' }, { status: 400 })
  }

  const service = createServiceClient()
  const { data: property } = await service
    .from('properties')
    .select('id, address, city, state, zip')
    .eq('landing_slug', body.slug)
    .maybeSingle()

  if (!property) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    null

  const addrNormalized = normalizeAddress(
    `${property.address} ${property.city} ${property.state} ${property.zip}`,
  )

  await service
    .from('suppressed_addresses')
    .upsert(
      {
        address_normalized: addrNormalized,
        suppression_source: 'homeowner_optout',
        opt_out_ip: ip,
      },
      { onConflict: 'address_normalized' },
    )

  await service.from('opt_out_requests').insert({
    address: `${property.address}, ${property.city}, ${property.state} ${property.zip}`,
    landing_slug: body.slug,
    processed_at: new Date().toISOString(),
  })

  await service.from('properties').update({ suppressed: true }).eq('id', property.id)

  return NextResponse.json({ success: true, message: 'Removed from mailing list.' })
}
