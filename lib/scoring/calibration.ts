import type { SupabaseClient } from '@supabase/supabase-js'
import { scoreProperty, type ScoreInput } from '@/lib/scoring'
import type { ScoringNiche } from '@/lib/scoring/types'

const PASS_TOLERANCE = 10 // final_score within ±10 of expected is a pass

export interface CalibrationResult {
  id: string
  expected_final_score: number
  actual_final_score: number
  delta: number
  passed: boolean
  disqualifier_reason: string | null
}

export interface CalibrationReport {
  niche: ScoringNiche
  total: number
  passed: number
  pass_rate: number
  results: CalibrationResult[]
}

export async function runGoldenSetCalibration(
  db: SupabaseClient,
  niche: ScoringNiche,
): Promise<CalibrationReport> {
  const { data: rows } = await db
    .from('scoring_golden_set')
    .select('*')
    .eq('niche', niche)

  const results: CalibrationResult[] = []

  for (const row of rows ?? []) {
    const attom = (row.attom_snapshot ?? {}) as Record<string, unknown>
    const input: ScoreInput = {
      property_id: row.id,
      niche,
      satellite_url: row.satellite_image_url,
      street_view_url: row.street_view_image_url ?? null,
      attom: {
        owner_occupied: (attom.owner_occupied as boolean | null) ?? null,
        estimated_value: (attom.estimated_value as number | null) ?? null,
        build_year: (attom.build_year as number | null) ?? null,
        lot_size_sqft: (attom.lot_size_sqft as number | null) ?? null,
        ownership_years: (attom.ownership_years as number | null) ?? null,
        living_area_sqft: (attom.living_area_sqft as number | null) ?? null,
      },
      zip: (attom.zip as string | undefined) ?? '',
    }

    const result = await scoreProperty(db, input)
    const delta = Math.abs(result.final_score - row.expected_final_score)
    results.push({
      id: row.id,
      expected_final_score: row.expected_final_score,
      actual_final_score: result.final_score,
      delta,
      passed: delta <= PASS_TOLERANCE,
      disqualifier_reason: result.disqualifier_reason,
    })
  }

  const passed = results.filter((r) => r.passed).length
  return {
    niche,
    total: results.length,
    passed,
    pass_rate: results.length ? passed / results.length : 0,
    results,
  }
}
