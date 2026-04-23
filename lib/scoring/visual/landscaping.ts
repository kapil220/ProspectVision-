import type { VisualAnalysisBase, VisualModule } from '@/lib/scoring/types'

export const PROMPT_VERSION = 'landscaping-v2.0'

export const VISION_PROMPT = `You are analyzing a residential property for landscaping service opportunity.

You are shown:
- Image 1: Satellite view (top-down) of the property
- Image 2: Street view of the front of the house (if available)

Analyze the FRONT YARD only (not backyard unless front is obscured). Return a JSON object with these EXACT fields:

{
  "grass_coverage_pct": <integer 0-100, percentage of front yard with any grass, dead or alive>,
  "healthy_grass_pct": <integer 0-100, percentage that is green and healthy>,
  "dead_brown_pct": <integer 0-100, percentage that is dead, brown, or patchy>,
  "bare_dirt_pct": <integer 0-100, percentage that is bare dirt, gravel, or exposed earth>,
  "weed_overgrowth": "none" | "light" | "moderate" | "heavy",
  "landscape_features": {
    "flower_beds_count": <integer>,
    "shrubs_hedges_count": <integer>,
    "trees_count": <integer>,
    "has_hardscape_paths": <boolean>,
    "has_decorative_elements": <boolean>
  },
  "maintenance_level": "pristine" | "well_maintained" | "adequate" | "neglected" | "abandoned",
  "front_yard_size_estimate": "small" | "medium" | "large" | "very_large",
  "image_quality": {
    "satellite_clear": <boolean>,
    "street_view_available": <boolean>,
    "season_bias_risk": "none" | "low" | "medium" | "high",
    "notes": <string, under 100 chars>
  },
  "disqualifiers": {
    "already_professionally_landscaped": <boolean>,
    "mature_healthy_lawn": <boolean>,
    "recent_work_visible": <boolean>,
    "not_residential": <boolean>
  },
  "confidence": <float 0.0-1.0>,
  "reasoning": <string, 1-2 sentences>
}

IMPORTANT:
- If the yard is in winter dormancy (brown but clearly maintained), set season_bias_risk to "high"
- If satellite is blurry or outdated, note in image_quality.notes
- Return ONLY the JSON. No markdown, no preamble.`

export function checkDisqualifiers(a: VisualAnalysisBase): string | null {
  if (a.disqualifiers?.not_residential) return 'not_residential'
  if (a.disqualifiers?.already_professionally_landscaped) return 'already_landscaped'
  if (a.disqualifiers?.mature_healthy_lawn && a.maintenance_level === 'pristine') {
    return 'pristine_lawn'
  }
  if (a.disqualifiers?.recent_work_visible) return 'recent_work'
  if (a.image_quality?.season_bias_risk === 'high') return 'season_bias_too_high'
  return null
}

export function calculateVisualScore(a: VisualAnalysisBase): number {
  let score = 0
  score += (a.dead_brown_pct ?? 0) * 0.4
  score += (a.bare_dirt_pct ?? 0) * 0.6

  const weedPoints: Record<string, number> = { none: 0, light: 5, moderate: 15, heavy: 25 }
  score += weedPoints[a.weed_overgrowth] ?? 0

  const f = a.landscape_features ?? {}
  const totalFeatures =
    (f.flower_beds_count ?? 0) + (f.shrubs_hedges_count ?? 0) + (f.trees_count ?? 0)
  if (totalFeatures === 0) score += 20
  else if (totalFeatures <= 2) score += 10

  const maintMod: Record<string, number> = {
    pristine: -40,
    well_maintained: -20,
    adequate: 0,
    neglected: 10,
    abandoned: 15,
  }
  score += maintMod[a.maintenance_level] ?? 0

  const sizeBonus: Record<string, number> = { small: 0, medium: 5, large: 10, very_large: 15 }
  score += sizeBonus[a.front_yard_size_estimate] ?? 0

  return Math.max(0, Math.min(100, Math.round(score)))
}

const mod: VisualModule = { PROMPT_VERSION, VISION_PROMPT, checkDisqualifiers, calculateVisualScore }
export default mod
