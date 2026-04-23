import type { VisualAnalysisBase, VisualModule } from '@/lib/scoring/types'

export const PROMPT_VERSION = 'solar-v2.0'

export const VISION_PROMPT = `Analyze this residential property for solar panel installation opportunity.

From satellite imagery, analyze the PRIMARY ROOF. Return JSON:

{
  "existing_panels": <boolean>,
  "primary_roof_orientation": "south" | "southeast" | "southwest" | "east" | "west" | "north" | "mixed" | "unknown",
  "usable_south_facing_sqft_estimate": <integer>,
  "shade_coverage": {
    "trees_nearby": <boolean>,
    "significant_shade_pct": <integer 0-100>,
    "tall_buildings_nearby": <boolean>
  },
  "roof_condition_suitable": <boolean>,
  "roof_complexity": "simple" | "moderate" | "complex",
  "obstructions": {
    "chimneys_count": <integer>,
    "skylights_count": <integer>,
    "hvac_on_roof": <boolean>,
    "dormers_count": <integer>
  },
  "image_quality": {
    "satellite_clear": <boolean>,
    "street_view_available": <boolean>,
    "shadows_interfere_with_analysis": <boolean>
  },
  "disqualifiers": {
    "panels_already_installed": <boolean>,
    "roof_not_suitable": <boolean>,
    "heavy_shade": <boolean>,
    "north_facing_only": <boolean>
  },
  "confidence": <float 0.0-1.0>,
  "reasoning": <string>
}

Return ONLY the JSON.`

export function checkDisqualifiers(a: VisualAnalysisBase): string | null {
  if (a.disqualifiers?.panels_already_installed) return 'panels_exist'
  if (a.disqualifiers?.heavy_shade) return 'heavy_shade'
  if (a.disqualifiers?.north_facing_only) return 'north_facing'
  if (a.disqualifiers?.roof_not_suitable) return 'roof_unsuitable'
  return null
}

export function calculateVisualScore(a: VisualAnalysisBase): number {
  let score = 0
  const orientBonus: Record<string, number> = {
    south: 40,
    southeast: 30,
    southwest: 30,
    east: 15,
    west: 15,
    mixed: 20,
    north: 0,
    unknown: 10,
  }
  score += orientBonus[a.primary_roof_orientation] ?? 10

  const sqft = a.usable_south_facing_sqft_estimate ?? 0
  if (sqft >= 800) score += 40
  else if (sqft >= 500) score += 30
  else if (sqft >= 300) score += 20
  else if (sqft >= 150) score += 10

  score -= Math.round((a.shade_coverage?.significant_shade_pct ?? 0) * 0.5)

  const o = a.obstructions ?? {}
  const obstructionCount =
    (o.chimneys_count ?? 0) +
    (o.skylights_count ?? 0) +
    (o.dormers_count ?? 0) +
    (o.hvac_on_roof ? 2 : 0)
  score -= Math.min(15, obstructionCount * 3)

  const complexityMod: Record<string, number> = { simple: 10, moderate: 0, complex: -10 }
  score += complexityMod[a.roof_complexity] ?? 0

  return Math.max(0, Math.min(100, Math.round(score)))
}

const mod: VisualModule = { PROMPT_VERSION, VISION_PROMPT, checkDisqualifiers, calculateVisualScore }
export default mod
