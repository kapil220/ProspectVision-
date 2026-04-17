import type { SupabaseClient } from '@supabase/supabase-js'
import { getOwner } from '@/lib/attom'
import { calculateROI, getNicheOrThrow } from '@/lib/niches'
import { makeQR } from '@/lib/qrcode'
import { generateSlug } from '@/lib/utils'
import type { NicheId } from '@/types'

interface PropertyRow {
  id: string
  address: string | null
  city: string | null
  state: string | null
  zip: string | null
  estimated_value: number | null
}

export async function enrichAllInBatch(batchId: string, db: SupabaseClient): Promise<void> {
  const { data: batch } = await db
    .from('scan_batches')
    .select('niche')
    .eq('id', batchId)
    .single()

  if (!batch?.niche) throw new Error(`Batch ${batchId} missing niche`)
  const nicheCfg = getNicheOrThrow(batch.niche as NicheId)

  const { data: props } = await db
    .from('properties')
    .select('id,address,city,state,zip,estimated_value')
    .eq('batch_id', batchId)
    .eq('suppressed', false)
    .is('landing_slug', null)

  const list = (props ?? []) as PropertyRow[]
  const total = list.length
  let enriched = 0

  for (const prop of list) {
    try {
      if (!prop.address || !prop.city || !prop.state || !prop.zip) {
        throw new Error('Missing address components')
      }

      const owner = await getOwner(prop.address, `${prop.city} ${prop.state} ${prop.zip}`)

      let slug = ''
      let attempts = 0
      while (true) {
        slug = generateSlug()
        const { data: ex } = await db
          .from('properties')
          .select('id')
          .eq('landing_slug', slug)
          .maybeSingle()
        if (!ex) break
        if (++attempts > 10) throw new Error('Slug collision')
      }

      const landingUrl = `${process.env.NEXT_PUBLIC_APP_URL}/p/${slug}`
      const qrBuf = await makeQR(landingUrl)
      const qrFn = `${prop.id}-qr.png`

      const { error: qrErr } = await db.storage
        .from('qrcodes')
        .upload(qrFn, qrBuf, { contentType: 'image/png', upsert: true })
      if (qrErr) throw new Error(`QR upload failed: ${qrErr.message}`)

      const { data: qrUrl } = db.storage.from('qrcodes').getPublicUrl(qrFn)
      const roi = calculateROI(nicheCfg, owner?.estimatedValue ?? 250000)

      const { error: updErr } = await db
        .from('properties')
        .update({
          owner_first: owner?.firstName ?? null,
          owner_last: owner?.lastName ?? null,
          owner_occupied: owner?.ownerOccupied ?? null,
          estimated_value: owner?.estimatedValue ?? null,
          build_year: owner?.buildYear ?? null,
          lot_size_sqft: owner?.lotSizeSqft ?? null,
          data_fetched_at: new Date().toISOString(),
          landing_slug: slug,
          qr_code_url: qrUrl.publicUrl,
          roi_estimate_low: roi.low,
          roi_estimate_high: roi.high,
        })
        .eq('id', prop.id)
      if (updErr) throw new Error(`Property update failed: ${updErr.message}`)

      enriched++
    } catch (err) {
      console.error(`Enrich failed ${prop.id}:`, err)
    }

    const pct = 85 + Math.round((enriched / Math.max(total, 1)) * 15)
    await db
      .from('scan_batches')
      .update({ progress_pct: Math.min(99, pct) })
      .eq('id', batchId)
  }

  await db
    .from('scan_batches')
    .update({
      status: 'ready',
      total_approved: enriched,
      progress_pct: 100,
      completed_at: new Date().toISOString(),
    })
    .eq('id', batchId)
}
