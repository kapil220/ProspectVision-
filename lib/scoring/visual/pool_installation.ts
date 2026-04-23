import type { VisualAnalysisBase, VisualModule } from '@/lib/scoring/types'

export const PROMPT_VERSION = 'pool_installation-v2.0'

export const VISION_PROMPT = `Analyze this residential property for in-ground pool installation opportunity. Return JSON:

{
  "existing_pool": <boolean>,
  "flat_backyard_area_sqft": <integer, usable flat backyard area for pool>,
  "clear_area_min_dimensions_ft": { "length": <integer>, "width": <integer> },
  "tree_coverage": "open" | "partial" | "heavy",
  "grade_suitable": <boolean>,
  "yard_accessibility_for_equipment": "easy" | "moderate" | "difficult",
  "image_quality": { "satellite_clear": <boolean>, "street_view_available": <boolean>, "notes": <string> },
  "disqualifiers": {
    "pool_exists": <boolean>,
    "insufficient_space": <boolean>,
    "heavy_slope": <boolean>,
    "not_residential": <boolean>
  },
  "confidence": <float 0.0-1.0>,
  "reasoning": <string>
}

Return ONLY the JSON.`

export function checkDisqualifiers(a: VisualAnalysisBase): string | null {
  if (a.disqualifiers?.pool_exists) return 'pool_exists'
  if (a.disqualifiers?.insufficient_space) return 'insufficient_space'
  if (a.disqualifiers?.heavy_slope) return 'heavy_slope'
  if (a.disqualifiers?.not_residential) return 'not_residential'
  if (a.existing_pool) return 'pool_exists'
  return null
}

export function calculateVisualScore(a: VisualAnalysisBase): number {
  let score = 0
  const sqft = a.flat_backyard_area_sqft ?? 0
  if (sqft >= 1500) score += 50
  else if (sqft >= 1000) score += 35
  else if (sqft >= 600) score += 20
  else score -= 15

  const dims = a.clear_area_min_dimensions_ft ?? { length: 0, width: 0 }
  if ((dims.length ?? 0) >= 30 && (dims.width ?? 0) >= 15) score += 15

  const shadeMod: Record<string, number> = { open: 10, partial: 0, heavy: -15 }
  score += shadeMod[a.tree_coverage] ?? 0

  if (a.grade_suitable) score += 10
  else score -= 15

  const accessMod: Record<string, number> = { easy: 10, moderate: 0, difficult: -15 }
  score += accessMod[a.yard_accessibility_for_equipment] ?? 0

  return Math.max(0, Math.min(100, Math.round(score)))
}

const mod: VisualModule = { PROMPT_VERSION, VISION_PROMPT, checkDisqualifiers, calculateVisualScore }
export default mod
