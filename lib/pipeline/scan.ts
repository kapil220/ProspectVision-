import type { SupabaseClient } from '@supabase/supabase-js'
import { searchByZip } from '@/lib/attom'
import { satelliteUrl, streetviewUrl } from '@/lib/googlemaps'
import { enrichAllInBatch } from '@/lib/pipeline/enrich'
import { renderAllInBatch } from '@/lib/pipeline/render'
import { scoreAllInBatch } from '@/lib/pipeline/score'
import { normalizeAddress } from '@/lib/utils'
import type { NicheId } from '@/types'

export async function runPipeline(
  batchId: string,
  profileId: string,
  zips: string[],
  niche: NicheId,
  db: SupabaseClient
): Promise<void> {
  // STEP A: SCAN — discover SFR properties via ATTOM, skip suppressed addresses.
  let totalScanned = 0

  for (const zip of zips) {
    const props = await searchByZip(zip)

    for (const p of props) {
      if (!p.address?.line1 || !p.location?.latitude || !p.location?.longitude) continue

      const fullAddress = `${p.address.line1} ${p.address.locality} ${p.address.countrySubd} ${p.address.postal1}`
      const normalized = normalizeAddress(fullAddress)

      const { data: suppressed } = await db
        .from('suppressed_addresses')
        .select('id')
        .eq('address_normalized', normalized)
        .maybeSingle()
      if (suppressed) continue

      const lat = parseFloat(p.location.latitude)
      const lng = parseFloat(p.location.longitude)
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue

      const { error } = await db.from('properties').insert({
        batch_id: batchId,
        profile_id: profileId,
        address: p.address.line1,
        city: p.address.locality,
        state: p.address.countrySubd,
        zip: p.address.postal1,
        lat,
        lng,
        build_year: p.summary?.yearBuilt ?? null,
        lot_size_sqft: p.summary?.lotSizeAcres
          ? Math.round(p.summary.lotSizeAcres * 43560)
          : null,
        satellite_url: satelliteUrl(lat, lng),
        streetview_url: streetviewUrl(lat, lng),
        data_fetched_at: new Date().toISOString(),
      })

      if (error) {
        console.error('Property insert failed:', error.message)
        continue
      }

      totalScanned++
    }

    await db
      .from('scan_batches')
      .update({ total_scanned: totalScanned, progress_pct: 10, status: 'scoring' })
      .eq('id', batchId)
  }

  // STEP B: SCORE — GPT-4o Vision (stubbed)
  await scoreAllInBatch(batchId, niche, db)

  // STEP C: RENDER — DALL-E 3 (stubbed)
  await renderAllInBatch(batchId, niche, db)

  // STEP D: ENRICH — owner + QR + slug (stubbed)
  await enrichAllInBatch(batchId, db)
}
