import type { VisualAnalysisBase, VisualModule } from '@/lib/scoring/types'

export const PROMPT_VERSION = 'driveway_paving-v2.0'

export const VISION_PROMPT = `Analyze this residential property for driveway repaving/paver installation opportunity. Return JSON:

{
  "driveway_present": <boolean>,
  "driveway_material": "concrete" | "asphalt" | "gravel" | "dirt" | "pavers" | "stamped_concrete" | "unknown",
  "cracks_severity": "none" | "minor" | "moderate" | "severe",
  "stains_visible": <boolean>,
  "oil_stains_heavy": <boolean>,
  "surface_age_estimate": "new" | "mid_life" | "aging" | "very_old",
  "driveway_size_estimate": "small" | "medium" | "large",
  "image_quality": { "satellite_clear": <boolean>, "street_view_available": <boolean>, "notes": <string> },
  "disqualifiers": {
    "recently_paved": <boolean>,
    "no_driveway": <boolean>,
    "not_residential": <boolean>,
    "already_pavers_new": <boolean>
  },
  "confidence": <float 0.0-1.0>,
  "reasoning": <string>
}

Return ONLY the JSON.`

export function checkDisqualifiers(a: VisualAnalysisBase): string | null {
  if (a.disqualifiers?.recently_paved) return 'recently_paved'
  if (a.disqualifiers?.no_driveway) return 'no_driveway'
  if (a.disqualifiers?.already_pavers_new) return 'already_pavers'
  if (a.disqualifiers?.not_residential) return 'not_residential'
  return null
}

export function calculateVisualScore(a: VisualAnalysisBase): number {
  let score = 0
  const matMod: Record<string, number> = {
    concrete: 10,
    asphalt: 15,
    gravel: 30,
    dirt: 40,
    pavers: -20,
    stamped_concrete: -10,
    unknown: 10,
  }
  score += matMod[a.driveway_material] ?? 0

  const crackMod: Record<string, number> = { none: -10, minor: 10, moderate: 25, severe: 40 }
  score += crackMod[a.cracks_severity] ?? 0

  const ageMod: Record<string, number> = { new: -20, mid_life: 5, aging: 20, very_old: 35 }
  score += ageMod[a.surface_age_estimate] ?? 0

  if (a.stains_visible) score += 5
  if (a.oil_stains_heavy) score += 10

  const sizeBonus: Record<string, number> = { small: 0, medium: 5, large: 10 }
  score += sizeBonus[a.driveway_size_estimate] ?? 0

  return Math.max(0, Math.min(100, Math.round(score)))
}

const mod: VisualModule = { PROMPT_VERSION, VISION_PROMPT, checkDisqualifiers, calculateVisualScore }
export default mod
