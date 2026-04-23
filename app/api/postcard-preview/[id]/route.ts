import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { buildBackHTML, buildFrontHTML } from '@/lib/postcardTemplates'
import { getNicheOrThrow } from '@/lib/niches'
import type { Profile, Property } from '@/types'

export const dynamic = 'force-dynamic'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const side = req.nextUrl.searchParams.get('side') === 'back' ? 'back' : 'front'
  const service = createServiceClient()

  // Prefer a stored postcards row (has exact HTML submitted to Lob).
  const { data: postcard } = await service
    .from('postcards')
    .select('front_html_rendered, back_html_rendered, user_id')
    .eq('property_id', params.id)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (postcard && (side === 'front' ? postcard.front_html_rendered : postcard.back_html_rendered)) {
    const html =
      side === 'front' ? postcard.front_html_rendered : postcard.back_html_rendered
    return new NextResponse(html as string, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
        'X-Frame-Options': 'SAMEORIGIN',
      },
    })
  }

  // Fallback: build HTML live from the current niche template + property.
  const { data: property } = await service
    .from('properties')
    .select('*, scan_batches!inner(niche)')
    .eq('id', params.id)
    .eq('profile_id', user.id)
    .maybeSingle()
  if (!property) {
    return NextResponse.json({ error: 'Property not found' }, { status: 404 })
  }

  const { data: profile } = await service
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()
  if (!profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  }

  const batchNiche = (property as { scan_batches: { niche: string } }).scan_batches.niche
  const niche = getNicheOrThrow(batchNiche)
  const html =
    side === 'front'
      ? buildFrontHTML(property as Property, profile as Profile, niche)
      : buildBackHTML(property as Property, profile as Profile, niche)

  return new NextResponse(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Frame-Options': 'SAMEORIGIN',
    },
  })
}
