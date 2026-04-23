import type { SupabaseClient } from '@supabase/supabase-js'
import type { ScoringNiche } from '@/lib/scoring/types'

const NEUTRAL_SCORE = 50
const MIN_SAMPLE_SIZE = 20

export async function calculateGeoScore(
  db: SupabaseClient,
  zipCode: string,
  niche: ScoringNiche,
): Promise<number> {
  if (!zipCode) return NEUTRAL_SCORE

  const { data } = await db
    .from('geo_performance')
    .select('total_delivered, response_rate, close_rate')
    .eq('zip_code', zipCode)
    .eq('niche', niche)
    .maybeSingle()

  if (!data || (data.total_delivered ?? 0) < MIN_SAMPLE_SIZE) return NEUTRAL_SCORE

  let score = NEUTRAL_SCORE

  const responseRate = data.response_rate ?? 0
  if (responseRate >= 0.05) score += 20
  else if (responseRate >= 0.03) score += 12
  else if (responseRate >= 0.02) score += 5
  else if (responseRate < 0.01) score -= 15

  const closeRate = data.close_rate ?? 0
  if (closeRate >= 0.15) score += 20
  else if (closeRate >= 0.08) score += 12
  else if (closeRate >= 0.04) score += 5

  return Math.max(0, Math.min(100, Math.round(score)))
}
