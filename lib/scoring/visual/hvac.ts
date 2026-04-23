import type { VisualAnalysisBase, VisualModule } from '@/lib/scoring/types'

export const PROMPT_VERSION = 'hvac-v2.0'

// HVAC leans heavily on ATTOM build_year — visual is only a 0.25 weight.
export const VISION_PROMPT = `Analyze this residential property for HVAC replacement opportunity. Return JSON:

{
  "condenser_visible": <boolean>,
  "condenser_condition": "new" | "good" | "aging" | "rusty_old" | "not_visible",
  "window_units_visible": <boolean>,
  "multiple_units_visible": <boolean>,
  "enclosure_present": <boolean>,
  "approximate_system_age_guess": "new" | "mid_life" | "old" | "unknown",
  "image_quality": { "satellite_clear": <boolean>, "street_view_available": <boolean>, "notes": <string> },
  "disqualifiers": { "new_unit_visible": <boolean>, "not_residential": <boolean> },
  "confidence": <float 0.0-1.0>,
  "reasoning": <string>
}

Return ONLY the JSON.`

export function checkDisqualifiers(a: VisualAnalysisBase): string | null {
  if (a.disqualifiers?.new_unit_visible) return 'new_unit'
  if (a.disqualifiers?.not_residential) return 'not_residential'
  return null
}

export function calculateVisualScore(a: VisualAnalysisBase): number {
  let score = 30 // visual is weak signal for HVAC — start at neutral
  const condMod: Record<string, number> = {
    new: -30,
    good: -10,
    aging: 20,
    rusty_old: 40,
    not_visible: 5,
  }
  score += condMod[a.condenser_condition] ?? 0

  if (a.window_units_visible) score += 25
  if (a.multiple_units_visible) score += 10

  const ageMod: Record<string, number> = { new: -25, mid_life: 5, old: 25, unknown: 5 }
  score += ageMod[a.approximate_system_age_guess] ?? 0

  return Math.max(0, Math.min(100, Math.round(score)))
}

const mod: VisualModule = { PROMPT_VERSION, VISION_PROMPT, checkDisqualifiers, calculateVisualScore }
export default mod
