import type { VisualAnalysisBase, VisualModule } from '@/lib/scoring/types'

export const PROMPT_VERSION = 'fencing-v2.0'

export const VISION_PROMPT = `Analyze this residential property for fencing installation opportunity. Return JSON:

{
  "existing_fence_present": <boolean>,
  "fence_condition": "none" | "excellent" | "good" | "fair" | "poor" | "broken",
  "fence_material": "wood" | "chain_link" | "vinyl" | "wrought_iron" | "composite" | "none" | "unknown",
  "backyard_exposed": <boolean>,
  "backyard_size_estimate": "small" | "medium" | "large" | "very_large",
  "upgrade_opportunity": "none" | "replace" | "extend" | "new_install",
  "image_quality": { "satellite_clear": <boolean>, "street_view_available": <boolean>, "notes": <string> },
  "disqualifiers": { "new_fence": <boolean>, "no_backyard_access": <boolean>, "not_residential": <boolean> },
  "confidence": <float 0.0-1.0>,
  "reasoning": <string>
}

Return ONLY the JSON.`

export function checkDisqualifiers(a: VisualAnalysisBase): string | null {
  if (a.disqualifiers?.new_fence) return 'new_fence'
  if (a.disqualifiers?.no_backyard_access) return 'no_backyard'
  if (a.disqualifiers?.not_residential) return 'not_residential'
  if (a.fence_condition === 'excellent') return 'excellent_fence'
  return null
}

export function calculateVisualScore(a: VisualAnalysisBase): number {
  let score = 0
  const oppMod: Record<string, number> = { none: -20, replace: 30, extend: 20, new_install: 45 }
  score += oppMod[a.upgrade_opportunity] ?? 0

  const condMod: Record<string, number> = {
    none: 20,
    excellent: -40,
    good: -15,
    fair: 10,
    poor: 30,
    broken: 40,
  }
  score += condMod[a.fence_condition] ?? 0

  if (a.backyard_exposed && !a.existing_fence_present) score += 20
  if (a.fence_material === 'chain_link') score += 10

  const sizeBonus: Record<string, number> = { small: 0, medium: 5, large: 10, very_large: 15 }
  score += sizeBonus[a.backyard_size_estimate] ?? 0

  return Math.max(0, Math.min(100, Math.round(score)))
}

const mod: VisualModule = { PROMPT_VERSION, VISION_PROMPT, checkDisqualifiers, calculateVisualScore }
export default mod
