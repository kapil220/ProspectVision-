import type { VisualAnalysisBase, VisualModule } from '@/lib/scoring/types'

export const PROMPT_VERSION = 'pressure_washing-v2.0'

export const VISION_PROMPT = `Analyze this residential property for pressure washing opportunity. Return JSON:

{
  "algae_coverage_pct": <integer 0-100, percent of driveway/walkways with algae>,
  "dirt_severity": "none" | "light" | "moderate" | "heavy",
  "surfaces_affected": {
    "driveway": <boolean>,
    "walkway": <boolean>,
    "siding": <boolean>,
    "fence": <boolean>,
    "patio": <boolean>,
    "deck": <boolean>
  },
  "siding_discoloration": "none" | "mild" | "moderate" | "severe",
  "hardscape_presence": "minimal" | "moderate" | "extensive",
  "image_quality": { "satellite_clear": <boolean>, "street_view_available": <boolean>, "notes": <string> },
  "disqualifiers": { "recently_cleaned": <boolean>, "not_residential": <boolean> },
  "confidence": <float 0.0-1.0>,
  "reasoning": <string>
}

Return ONLY the JSON.`

export function checkDisqualifiers(a: VisualAnalysisBase): string | null {
  if (a.disqualifiers?.recently_cleaned) return 'recently_cleaned'
  if (a.disqualifiers?.not_residential) return 'not_residential'
  return null
}

export function calculateVisualScore(a: VisualAnalysisBase): number {
  let score = 0
  score += Math.round((a.algae_coverage_pct ?? 0) * 0.5)

  const dirtMod: Record<string, number> = { none: -10, light: 5, moderate: 20, heavy: 35 }
  score += dirtMod[a.dirt_severity] ?? 0

  const s = a.surfaces_affected ?? {}
  const affected =
    (s.driveway ? 1 : 0) +
    (s.walkway ? 1 : 0) +
    (s.siding ? 1 : 0) +
    (s.fence ? 1 : 0) +
    (s.patio ? 1 : 0) +
    (s.deck ? 1 : 0)
  score += affected * 6

  const sidingMod: Record<string, number> = { none: 0, mild: 5, moderate: 12, severe: 20 }
  score += sidingMod[a.siding_discoloration] ?? 0

  const hardscapeMod: Record<string, number> = { minimal: -5, moderate: 5, extensive: 10 }
  score += hardscapeMod[a.hardscape_presence] ?? 0

  return Math.max(0, Math.min(100, Math.round(score)))
}

const mod: VisualModule = { PROMPT_VERSION, VISION_PROMPT, checkDisqualifiers, calculateVisualScore }
export default mod
