import { NextResponse, type NextRequest } from 'next/server'
import crypto from 'node:crypto'
import { createServiceClient } from '@/lib/supabase/service'
import { normalizeAddress } from '@/lib/utils'

export const dynamic = 'force-dynamic'

function hashIp(ip: string | null): string | null {
  if (!ip) return null
  const salt = process.env.LANDING_IP_SALT ?? 'prospectvision'
  return crypto.createHash('sha256').update(`${salt}:${ip}`).digest('hex').slice(0, 32)
}

async function processOptOut(slug: string, ip: string | null): Promise<NextResponse> {
  const service = createServiceClient()

  const { data: postcard } = await service
    .from('postcards')
    .select('id, property_id')
    .eq('landing_page_slug', slug)
    .maybeSingle()

  let property:
    | { id: string; address: string; city: string; state: string; zip: string }
    | null = null

  if (postcard?.property_id) {
    const { data } = await service
      .from('properties')
      .select('id, address, city, state, zip')
      .eq('id', postcard.property_id)
      .maybeSingle()
    property = data
  } else {
    const { data } = await service
      .from('properties')
      .select('id, address, city, state, zip')
      .eq('landing_slug', slug)
      .maybeSingle()
    property = data
  }

  if (!property) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }

  const fullAddress = `${property.address} ${property.city} ${property.state} ${property.zip}`
  const normalized = normalizeAddress(fullAddress)

  await service
    .from('suppressed_addresses')
    .upsert(
      {
        address: fullAddress,
        address_normalized: normalized,
        suppression_source: 'homeowner_optout',
        opt_out_ip: hashIp(ip),
      },
      { onConflict: 'address_normalized', ignoreDuplicates: true },
    )

  await service.from('opt_out_requests').insert({
    postcard_id: postcard?.id ?? null,
    landing_page_slug: slug,
    address: fullAddress,
    processed_at: new Date().toISOString(),
    ip_hash: hashIp(ip),
  })

  await service.from('properties').update({ suppressed: true }).eq('id', property.id)

  return NextResponse.json({ success: true })
}

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } },
) {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    null
  return processOptOut(params.slug, ip)
}

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } },
) {
  // Support plain link clicks from the landing page.
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    null
  const res = await processOptOut(params.slug, ip)
  if (res.status === 200) {
    return NextResponse.redirect(new URL(`/p/${params.slug}?optout=1`, req.url))
  }
  return res
}
