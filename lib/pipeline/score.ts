import type { SupabaseClient } from '@supabase/supabase-js'
import { getNicheOrThrow } from '@/lib/niches'
import { scoreProperty as scoreV1 } from '@/lib/openai'
import { scoreProperty as scoreV2 } from '@/lib/scoring'
import type { ScoreInput } from '@/lib/scoring'
import { chunkArray, sleep } from '@/lib/utils'
import type { NicheId } from '@/types'

interface PropertyRow {
  id: string
  zip: string | null
  satellite_url: string | null
  streetview_url: string | null
  owner_occupied: boolean | null
  estimated_value: number | null
  build_year: number | null
  lot_size_sqft: number | null
  imagery_captured_at: string | null
}

export async function scoreAllInBatch(
  batchId: string,
  niche: NicheId,
  db: SupabaseClient,
): Promise<void> {
  const nicheCfg = getNicheOrThrow(niche)
  const useV2 = process.env.SCORING_ENGINE_VERSION === 'v2'

  const { data: props } = await db
    .from('properties')
    .select(
      'id,zip,satellite_url,streetview_url,owner_occupied,estimated_value,build_year,lot_size_sqft,imagery_captured_at',
    )
    .eq('batch_id', batchId)
    .eq('suppressed', false)
    .is('upgrade_score', null)

  const list = (props ?? []) as PropertyRow[]

  if (!list.length) {
    await db
      .from('scan_batches')
      .update({ status: 'rendering', progress_pct: 60 })
      .eq('id', batchId)
    return
  }

  const total = list.length
  let scored = 0
  const chunks = chunkArray(list, 5)

  for (const chunk of chunks) {
    await Promise.all(
      chunk.map(async (prop) => {
        try {
          if (!prop.satellite_url) {
            await db.from('properties').update({ suppressed: true }).eq('id', prop.id)
            return
          }

          if (useV2) {
            const input: ScoreInput = {
              property_id: prop.id,
              niche,
              satellite_url: prop.satellite_url,
              street_view_url: prop.streetview_url,
              zip: prop.zip ?? '',
              imagery_captured_at: prop.imagery_captured_at,
              attom: {
                owner_occupied: prop.owner_occupied,
                estimated_value: prop.estimated_value,
                build_year: prop.build_year,
                lot_size_sqft: prop.lot_size_sqft,
              },
            }
            // v2 engine handles all persistence + scoring_runs + suppression.
            await scoreV2(db, input)
            await db
              .from('scoring_feedback')
              .upsert(
                { property_id: prop.id, original_score: null },
                { onConflict: 'property_id' },
              )
          } else {
            if (!prop.streetview_url) {
              await db.from('properties').update({ suppressed: true }).eq('id', prop.id)
              return
            }
            const result = await scoreV1(
              prop.satellite_url,
              prop.streetview_url,
              nicheCfg.score_prompt,
            )
            const ok = result.score >= 70
            await db
              .from('properties')
              .update({
                upgrade_score: result.score,
                score_reasons: result.reasons,
                suppressed: !ok,
              })
              .eq('id', prop.id)
            await db
              .from('scoring_feedback')
              .upsert(
                { property_id: prop.id, original_score: result.score },
                { onConflict: 'property_id' },
              )
          }
        } catch (err) {
          console.error(`Score failed ${prop.id}:`, err)
          await db.from('properties').update({ suppressed: true }).eq('id', prop.id)
        } finally {
          scored++
        }
      }),
    )

    const pct = 20 + Math.round((scored / total) * 40)
    await db
      .from('scan_batches')
      .update({ total_scored: scored, progress_pct: Math.min(59, pct) })
      .eq('id', batchId)

    if (chunk !== chunks[chunks.length - 1]) await sleep(600)
  }

  await db
    .from('scan_batches')
    .update({ status: 'rendering', total_scored: total, progress_pct: 60 })
    .eq('id', batchId)
}

// After scoring_feedback outcome data exists, update scoring_feedback.original_score
// from properties.final_score for v2-scored rows. This is a maintenance step run nightly.
export async function backfillV2ScoringFeedback(db: SupabaseClient): Promise<void> {
  await db.rpc('backfill_v2_scoring_feedback').throwOnError()
}
