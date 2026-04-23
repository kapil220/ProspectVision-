import type { AttomInput, ScoringNiche } from '@/lib/scoring/types'

const CURRENT_YEAR = new Date().getFullYear()

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)))
}

function standardAttomScore(d: AttomInput): number {
  let score = 50

  if (d.owner_occupied === true) score += 10
  else if (d.owner_occupied === false) score -= 15

  const tenure = d.ownership_years ?? 0
  if (tenure >= 3 && tenure <= 10) score += 15
  else if (tenure > 10) score += 5
  else if (tenure > 0 && tenure < 1) score -= 10

  const value = d.estimated_value ?? 0
  if (value >= 500000) score += 15
  else if (value >= 300000) score += 10
  else if (value >= 200000) score += 5
  else if (value > 0 && value < 150000) score -= 10

  return clamp(score)
}

function roofingAttomScore(d: AttomInput): number {
  let score = standardAttomScore(d)
  const buildYear = d.build_year ?? CURRENT_YEAR
  const roofAge = CURRENT_YEAR - buildYear
  if (roofAge >= 25) score += 25
  else if (roofAge >= 18) score += 18
  else if (roofAge >= 12) score += 8
  else if (roofAge < 8) score -= 20
  return clamp(score)
}

function hvacAttomScore(d: AttomInput): number {
  let score = standardAttomScore(d)
  const buildYear = d.build_year ?? CURRENT_YEAR
  if (buildYear < 2005) score += 30
  else if (buildYear < 2015) score += 15
  else if (buildYear >= 2020) score -= 20
  return clamp(score)
}

function solarAttomScore(d: AttomInput): number {
  let score = standardAttomScore(d)
  const value = d.estimated_value ?? 0
  if (value >= 400000) score += 10
  const sqft = d.living_area_sqft ?? 0
  if (sqft >= 2500) score += 10
  else if (sqft >= 1800) score += 5
  return clamp(score)
}

function landscapingAttomScore(d: AttomInput): number {
  let score = standardAttomScore(d)
  const lotSize = d.lot_size_sqft ?? 0
  if (lotSize >= 10000) score += 10
  else if (lotSize >= 6000) score += 5
  return clamp(score)
}

function paintingAttomScore(d: AttomInput): number {
  let score = standardAttomScore(d)
  const buildYear = d.build_year ?? CURRENT_YEAR
  const yearsSinceBuild = CURRENT_YEAR - buildYear
  if (yearsSinceBuild >= 10) score += 15
  else if (yearsSinceBuild >= 7) score += 8
  return clamp(score)
}

function poolAttomScore(d: AttomInput): number {
  let score = standardAttomScore(d)
  const value = d.estimated_value ?? 0
  if (value > 0 && value < 300000) score -= 25
  else if (value >= 600000) score += 20
  const lotSize = d.lot_size_sqft ?? 0
  if (lotSize >= 10000) score += 15
  else if (lotSize > 0 && lotSize < 6000) score -= 15
  return clamp(score)
}

const STRATEGIES: Record<ScoringNiche, (d: AttomInput) => number> = {
  landscaping: landscapingAttomScore,
  roofing: roofingAttomScore,
  solar: solarAttomScore,
  exterior_painting: paintingAttomScore,
  fencing: standardAttomScore,
  pool_installation: poolAttomScore,
  driveway_paving: standardAttomScore,
  pressure_washing: standardAttomScore,
  hvac: hvacAttomScore,
}

export function calculateAttomScore(attom: AttomInput, niche: ScoringNiche): number {
  const fn = STRATEGIES[niche] ?? standardAttomScore
  return fn(attom)
}
