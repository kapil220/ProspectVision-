import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { fetchBase64, satelliteUrl } from '@/lib/googlemaps'
import { getNicheOrThrow } from '@/lib/niches'
import { generateRender } from '@/lib/openai'
import type { NicheId } from '@/types'

export const maxDuration = 60

export async function POST(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: prop, error: propErr } = await supabase
    .from('properties')
    .select('id,lat,lng,address,city,state,batch_id,scan_batches!inner(niche,profile_id)')
    .eq('id', params.id)
    .single()

  if (propErr || !prop) {
    return NextResponse.json({ error: 'Property not found' }, { status: 404 })
  }

  const batch = Array.isArray(prop.scan_batches) ? prop.scan_batches[0] : prop.scan_batches
  if (!batch || batch.profile_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (prop.lat == null || prop.lng == null) {
    return NextResponse.json({ error: 'Property missing coordinates' }, { status: 422 })
  }

  const nicheCfg = getNicheOrThrow(batch.niche as NicheId)
  const db = createServiceClient()

  try {
    const b64 = await fetchBase64(satelliteUrl(prop.lat, prop.lng))
    const renderB64 = await generateRender(
      b64,
      nicheCfg.render_prompt,
      `${prop.address}, ${prop.city}, ${prop.state}`,
    )

    const fn = `${prop.id}.png`
    const bytes = Buffer.from(renderB64, 'base64')

    const { error: upErr } = await db.storage
      .from('renders')
      .upload(fn, bytes, { contentType: 'image/png', upsert: true })
    if (upErr) throw new Error(`Storage upload failed: ${upErr.message}`)

    const { data: url } = await db.storage
      .from('renders')
      .createSignedUrl(fn, 60 * 60 * 24 * 365)

    if (!url?.signedUrl) throw new Error('Signed URL missing')

    const { error: updErr } = await db
      .from('properties')
      .update({ render_url: url.signedUrl })
      .eq('id', prop.id)
    if (updErr) throw new Error(`Property update failed: ${updErr.message}`)

    return NextResponse.json({ success: true, render_url: url.signedUrl })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Render failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
