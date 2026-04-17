import type { SupabaseClient } from '@supabase/supabase-js'
import { fetchBase64, satelliteUrl } from '@/lib/googlemaps'
import { getNicheOrThrow } from '@/lib/niches'
import { generateRender } from '@/lib/openai'
import { chunkArray, sleep } from '@/lib/utils'
import type { NicheId } from '@/types'

interface PropertyRow {
  id: string
  lat: number | null
  lng: number | null
  address: string | null
  city: string | null
  state: string | null
}

export async function renderAllInBatch(
  batchId: string,
  niche: NicheId,
  db: SupabaseClient
): Promise<void> {
  const nicheCfg = getNicheOrThrow(niche)

  const { data: props } = await db
    .from('properties')
    .select('id,lat,lng,address,city,state')
    .eq('batch_id', batchId)
    .eq('suppressed', false)
    .is('render_url', null)
    .gte('upgrade_score', 70)

  const list = (props ?? []) as PropertyRow[]

  if (!list.length) {
    await db
      .from('scan_batches')
      .update({ status: 'enriching', progress_pct: 85 })
      .eq('id', batchId)
    return
  }

  const total = list.length
  let rendered = 0

  const chunks = chunkArray(list, 3)

  for (const chunk of chunks) {
    await Promise.all(
      chunk.map(async (prop) => {
        try {
          if (prop.lat == null || prop.lng == null) return

          const b64 = await fetchBase64(satelliteUrl(prop.lat, prop.lng))
          const renderB64 = await generateRender(
            b64,
            nicheCfg.render_prompt,
            `${prop.address}, ${prop.city}, ${prop.state}`
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

          if (url?.signedUrl) {
            await db
              .from('properties')
              .update({ render_url: url.signedUrl })
              .eq('id', prop.id)
          }

          rendered++
        } catch (err) {
          console.error(`Render failed ${prop.id}:`, err)
        }
      })
    )

    const pct = 60 + Math.round((rendered / total) * 25)
    await db
      .from('scan_batches')
      .update({ progress_pct: Math.min(84, pct) })
      .eq('id', batchId)

    if (chunk !== chunks[chunks.length - 1]) await sleep(1500)
  }

  await db
    .from('scan_batches')
    .update({ status: 'enriching', progress_pct: 85 })
    .eq('id', batchId)
}
