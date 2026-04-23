import type { VisualAnalysisBase, VisualModule } from '@/lib/scoring/types'

export const PROMPT_VERSION = 'exterior_painting-v2.0'

export const VISION_PROMPT = `Analyze this residential property for exterior painting opportunity. Return JSON:

{
  "paint_condition": "fresh" | "good" | "worn" | "poor" | "failing",
  "fade_severity": "none" | "mild" | "moderate" | "severe",
  "peeling_areas": "none" | "minor" | "significant" | "widespread",
  "color_scheme_dated": <boolean>,
  "surface_condition": {
    "wood_rot_visible": <boolean>,
    "chalking_visible": <boolean>,
    "stains_or_mildew": <boolean>
  },
  "siding_material": "wood" | "vinyl" | "stucco" | "brick" | "fiber_cement" | "mixed" | "unknown",
  "image_quality": { "satellite_clear": <boolean>, "street_view_available": <boolean>, "notes": <string> },
  "disqualifiers": { "recently_painted": <boolean>, "not_residential": <boolean>, "brick_only_no_paint": <boolean> },
  "confidence": <float 0.0-1.0>,
  "reasoning": <string>
}

Return ONLY the JSON.`

export function checkDisqualifiers(a: VisualAnalysisBase): string | null {
  if (a.disqualifiers?.recently_painted) return 'recently_painted'
  if (a.disqualifiers?.brick_only_no_paint) return 'all_brick'
  if (a.disqualifiers?.not_residential) return 'not_residential'
  if (a.paint_condition === 'fresh') return 'fresh_paint'
  return null
}

export function calculateVisualScore(a: VisualAnalysisBase): number {
  let score = 0
  const condMod: Record<string, number> = { fresh: -40, good: -10, worn: 20, poor: 40, failing: 55 }
  score += condMod[a.paint_condition] ?? 0

  const fadeMod: Record<string, number> = { none: 0, mild: 5, moderate: 15, severe: 25 }
  score += fadeMod[a.fade_severity] ?? 0

  const peelMod: Record<string, number> = { none: 0, minor: 8, significant: 18, widespread: 30 }
  score += peelMod[a.peeling_areas] ?? 0

  if (a.color_scheme_dated) score += 10
  const s = a.surface_condition ?? {}
  if (s.wood_rot_visible) score += 15
  if (s.chalking_visible) score += 8
  if (s.stains_or_mildew) score += 5

  return Math.max(0, Math.min(100, Math.round(score)))
}

const mod: VisualModule = { PROMPT_VERSION, VISION_PROMPT, checkDisqualifiers, calculateVisualScore }
export default mod
