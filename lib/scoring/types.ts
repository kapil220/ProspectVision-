import type { NicheId } from '@/types'

export const SCORING_MODEL_VERSION = 'v2.0'

export interface ImageQuality {
  satellite_clear: boolean
  street_view_available: boolean
  season_bias_risk?: 'none' | 'low' | 'medium' | 'high'
  notes?: string
  obstruction_notes?: string
  shadows_interfere_with_analysis?: boolean
}

export interface VisualAnalysisBase {
  image_quality: ImageQuality
  confidence: number
  reasoning: string
  disqualifiers: Record<string, any>
  [key: string]: any
}

export interface AttomInput {
  owner_occupied: boolean | null
  estimated_value: number | null
  build_year: number | null
  lot_size_sqft: number | null
  ownership_years?: number | null
  living_area_sqft?: number | null
}

export interface NicheScoringConfig {
  niche: string
  advance_threshold: number
  visual_weight: number
  attom_weight: number
  geo_weight: number
  manual_review_sample_rate: number
  min_confidence: number
}

export const DEFAULT_NICHE_CONFIG: NicheScoringConfig = {
  niche: 'default',
  advance_threshold: 70,
  visual_weight: 0.5,
  attom_weight: 0.3,
  geo_weight: 0.2,
  manual_review_sample_rate: 0.02,
  min_confidence: 0.6,
}

export interface VisualModule {
  PROMPT_VERSION: string
  VISION_PROMPT: string
  checkDisqualifiers: (a: VisualAnalysisBase) => string | null
  calculateVisualScore: (a: VisualAnalysisBase) => number
}

export interface ScoringResult {
  advance: boolean
  final_score: number
  visual_score: number
  attom_score: number
  geo_score: number
  confidence: number
  disqualifier_reason: string | null
  visual_analysis: VisualAnalysisBase | null
  imagery_freshness_warning: boolean
  manual_review_flagged: boolean
  model_version: string
  prompt_version: string
  vision_api_ms: number
  vision_api_cost_usd: number
}

export type ScoringNiche = NicheId
