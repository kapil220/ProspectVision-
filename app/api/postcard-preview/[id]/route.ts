import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { buildPostcardHtml } from '@/lib/postcards/generate'
import type { NicheId } from '@/types'

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

  // Always render fresh from the current template so design tweaks (and updated
  // render_url after pipeline completes) show up in preview. Reuse the existing
  // postcard's slug if one was already issued.
  const { data: postcard } = await service
    .from('postcards')
    .select('landing_page_slug')
    .eq('property_id', params.id)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

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

  const niche = (property as unknown as { scan_batches: { niche: string } }).scan_batches
    .niche as NicheId

  try {
    const { frontHtml, backHtml } = await buildPostcardHtml(
      service,
      property as Parameters<typeof buildPostcardHtml>[1],
      profile as Parameters<typeof buildPostcardHtml>[2],
      niche,
      { slug: postcard?.landing_page_slug ?? 'preview' },
    )
    return htmlResponse(side === 'front' ? frontHtml : backHtml)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Render failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

function htmlResponse(html: string): NextResponse {
  return new NextResponse(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Frame-Options': 'SAMEORIGIN',
    },
  })
}
