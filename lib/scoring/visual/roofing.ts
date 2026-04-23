import type { VisualAnalysisBase, VisualModule } from '@/lib/scoring/types'

export const PROMPT_VERSION = 'roofing-v2.0'

export const VISION_PROMPT = `You are analyzing a residential property for roof replacement service opportunity.

You are shown satellite and street view images. Analyze the PRIMARY ROOF (main house, not garage or outbuildings). Return JSON:

{
  "material": "asphalt_shingle" | "metal" | "tile" | "slate" | "wood_shake" | "flat" | "unknown",
  "estimated_age_category": "new_0_5yr" | "moderate_5_15yr" | "aging_15_25yr" | "very_old_25plus" | "unable_to_estimate",
  "visual_issues": {
    "missing_shingles_visible": <boolean>,
    "moss_or_algae_coverage_pct": <integer 0-100>,
    "discoloration_severity": "none" | "light" | "moderate" | "severe",
    "sagging_or_uneven": <boolean>,
    "dark_streaking": <boolean>,
    "visible_patches_or_repairs": <boolean>
  },
  "condition_rating": "excellent" | "good" | "fair" | "poor" | "needs_replacement",
  "roof_complexity": "simple" | "moderate" | "complex",
  "approximate_area": "small" | "medium" | "large" | "very_large",
  "image_quality": {
    "satellite_clear": <boolean>,
    "street_view_available": <boolean>,
    "obstruction_notes": <string>
  },
  "disqualifiers": {
    "recently_replaced": <boolean>,
    "not_residential": <boolean>,
    "commercial_flat_roof": <boolean>
  },
  "confidence": <float 0.0-1.0>,
  "reasoning": <string>
}

Return ONLY the JSON.`

export function checkDisqualifiers(a: VisualAnalysisBase): string | null {
  if (a.disqualifiers?.recently_replaced) return 'recently_replaced'
  if (a.disqualifiers?.not_residential) return 'not_residential'
  if (a.condition_rating === 'excellent') return 'excellent_condition'
  return null
}

export function calculateVisualScore(a: VisualAnalysisBase): number {
  let score = 0
  const ageBonus: Record<string, number> = {
    new_0_5yr: 0,
    moderate_5_15yr: 15,
    aging_15_25yr: 40,
    very_old_25plus: 55,
    unable_to_estimate: 20,
  }
  score += ageBonus[a.estimated_age_category] ?? 20

  const v = a.visual_issues ?? {}
  if (v.missing_shingles_visible) score += 20
  if (v.sagging_or_uneven) score += 15
  if (v.visible_patches_or_repairs) score += 10
  if (v.dark_streaking) score += 8
  score += Math.round((v.moss_or_algae_coverage_pct ?? 0) * 0.2)

  const discolorMod: Record<string, number> = { none: 0, light: 3, moderate: 8, severe: 15 }
  score += discolorMod[v.discoloration_severity] ?? 0

  const condMod: Record<string, number> = {
    excellent: -50,
    good: -25,
    fair: 0,
    poor: 15,
    needs_replacement: 25,
  }
  score += condMod[a.condition_rating] ?? 0

  return Math.max(0, Math.min(100, Math.round(score)))
}

const mod: VisualModule = { PROMPT_VERSION, VISION_PROMPT, checkDisqualifiers, calculateVisualScore }
export default mod
