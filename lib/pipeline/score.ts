import type { SupabaseClient } from '@supabase/supabase-js'
import { getNicheOrThrow } from '@/lib/niches'
import { scoreProperty } from '@/lib/openai'
import { chunkArray, sleep } from '@/lib/utils'
import type { NicheId } from '@/types'

interface PropertyRow {
  id: string
  satellite_url: string | null
  streetview_url: string | null
}

export async function scoreAllInBatch(
  batchId: string,
  niche: NicheId,
  db: SupabaseClient
): Promise<void> {
  const nicheCfg = getNicheOrThrow(niche)

  const { data: props } = await db
    .from('properties')
    .select('id,satellite_url,streetview_url')
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
          if (!prop.satellite_url || !prop.streetview_url) {
            await db.from('properties').update({ suppressed: true }).eq('id', prop.id)
            return
          }

          const result = await scoreProperty(
            prop.satellite_url,
            prop.streetview_url,
            nicheCfg.score_prompt
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
              { onConflict: 'property_id' }
            )
        } catch (err) {
          console.error(`Score failed ${prop.id}:`, err)
          await db.from('properties').update({ suppressed: true }).eq('id', prop.id)
        } finally {
          scored++
        }
      })
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
