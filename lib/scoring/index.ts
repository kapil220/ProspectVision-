import type { SupabaseClient } from '@supabase/supabase-js'
import { openai } from '@/lib/openai'
import { calculateAttomScore } from '@/lib/scoring/attom'
import { calculateGeoScore } from '@/lib/scoring/geo'
import {
  DEFAULT_NICHE_CONFIG,
  SCORING_MODEL_VERSION,
  type AttomInput,
  type NicheScoringConfig,
  type ScoringNiche,
  type ScoringResult,
  type VisualAnalysisBase,
  type VisualModule,
} from '@/lib/scoring/types'

import landscaping from '@/lib/scoring/visual/landscaping'
import roofing from '@/lib/scoring/visual/roofing'
import solar from '@/lib/scoring/visual/solar'
import exterior_painting from '@/lib/scoring/visual/exterior_painting'
import fencing from '@/lib/scoring/visual/fencing'
import pool_installation from '@/lib/scoring/visual/pool_installation'
import driveway_paving from '@/lib/scoring/visual/driveway_paving'
import pressure_washing from '@/lib/scoring/visual/pressure_washing'
import hvac from '@/lib/scoring/visual/hvac'

const VISUAL_MODULES: Record<ScoringNiche, VisualModule> = {
  landscaping,
  roofing,
  solar,
  exterior_painting,
  fencing,
  pool_installation,
  driveway_paving,
  pressure_washing,
  hvac,
}

// GPT-4o pricing (approx): $2.50/1M input, $10/1M output. Two high-detail images ≈ 1700 tokens, ~200 output.
const VISION_COST_PER_CALL_USD = 1700 * (2.5 / 1_000_000) + 200 * (10 / 1_000_000)

// 18 months — satellite imagery is often stale, warn user.
const IMAGERY_STALE_MONTHS = 18

export interface ScoreInput {
  property_id: string
  niche: ScoringNiche
  satellite_url: string
  street_view_url: string | null
  attom: AttomInput
  zip: string
  imagery_captured_at?: Date | string | null
}

export async function scoreProperty(
  db: SupabaseClient,
  input: ScoreInput,
): Promise<ScoringResult> {
  const startMs = Date.now()
  const visualModule = VISUAL_MODULES[input.niche]
  if (!visualModule) throw new Error(`No visual module for niche: ${input.niche}`)

  const freshnessWarning = isImageryStale(input.imagery_captured_at)
  const config = await loadNicheConfig(db, input.niche)

  let rawVisionResponse: unknown = null
  let visualAnalysis: VisualAnalysisBase | null = null
  let error: string | null = null

  try {
    const result = await runVisionAnalysis({
      satelliteUrl: input.satellite_url,
      streetViewUrl: input.street_view_url,
      prompt: visualModule.VISION_PROMPT,
    })
    rawVisionResponse = result.raw
    visualAnalysis = result.parsed
  } catch (e) {
    error = e instanceof Error ? e.message : String(e)
  }

  const disqualifier = visualAnalysis ? visualModule.checkDisqualifiers(visualAnalysis) : null
  const visualScore = visualAnalysis ? visualModule.calculateVisualScore(visualAnalysis) : 0
  const attomScore = calculateAttomScore(input.attom, input.niche)
  const geoScore = await calculateGeoScore(db, input.zip, input.niche)

  const rawConfidence = visualAnalysis?.confidence ?? 0
  const confidence = Number((rawConfidence * (freshnessWarning ? 0.75 : 1.0)).toFixed(2))

  const finalScore = disqualifier
    ? 0
    : Math.round(
        visualScore * config.visual_weight +
          attomScore * config.attom_weight +
          geoScore * config.geo_weight,
      )

  const manualReviewFlagged = Math.random() < config.manual_review_sample_rate

  const advance =
    !disqualifier &&
    !error &&
    finalScore >= config.advance_threshold &&
    confidence >= config.min_confidence

  const visionMs = Date.now() - startMs

  await persistResult(db, input.property_id, {
    visual_analysis: visualAnalysis,
    visual_score: visualScore,
    attom_score: attomScore,
    geo_score: geoScore,
    final_score: finalScore,
    score_confidence: confidence,
    imagery_freshness_warning: freshnessWarning,
    manual_review_flagged: manualReviewFlagged,
    disqualifier_reason: disqualifier,
    advance,
  })

  await db.from('scoring_runs').insert({
    property_id: input.property_id,
    model_version: SCORING_MODEL_VERSION,
    prompt_version: visualModule.PROMPT_VERSION,
    visual_score: visualScore,
    attom_score: attomScore,
    geo_score: geoScore,
    final_score: finalScore,
    confidence,
    vision_api_ms: visionMs,
    vision_api_cost_usd: VISION_COST_PER_CALL_USD,
    raw_vision_response: rawVisionResponse,
    error,
  })

  return {
    advance,
    final_score: finalScore,
    visual_score: visualScore,
    attom_score: attomScore,
    geo_score: geoScore,
    confidence,
    disqualifier_reason: disqualifier,
    visual_analysis: visualAnalysis,
    imagery_freshness_warning: freshnessWarning,
    manual_review_flagged: manualReviewFlagged,
    model_version: SCORING_MODEL_VERSION,
    prompt_version: visualModule.PROMPT_VERSION,
    vision_api_ms: visionMs,
    vision_api_cost_usd: VISION_COST_PER_CALL_USD,
  }
}

async function runVisionAnalysis(args: {
  satelliteUrl: string
  streetViewUrl: string | null
  prompt: string
}): Promise<{ parsed: VisualAnalysisBase; raw: string }> {
  type ImagePart = {
    type: 'image_url'
    image_url: { url: string; detail: 'high' | 'low' | 'auto' }
  }
  const imageParts: ImagePart[] = [
    { type: 'image_url', image_url: { url: args.satelliteUrl, detail: 'high' } },
  ]
  if (args.streetViewUrl) {
    imageParts.push({
      type: 'image_url',
      image_url: { url: args.streetViewUrl, detail: 'high' },
    })
  }

  const res = await openai.chat.completions.create({
    model: 'gpt-4o',
    temperature: 0,
    max_tokens: 500,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'user',
        content: [{ type: 'text', text: args.prompt }, ...imageParts],
      },
    ],
  })

  const raw = res.choices[0]?.message?.content ?? '{}'
  let parsed: VisualAnalysisBase
  try {
    parsed = JSON.parse(raw) as VisualAnalysisBase
  } catch {
    throw new Error(`Non-JSON response from vision model: ${raw.slice(0, 200)}`)
  }

  // Normalize confidence to 0-1 range if model returned 0-100.
  if (typeof parsed.confidence === 'number' && parsed.confidence > 1) {
    parsed.confidence = Math.min(1, parsed.confidence / 100)
  }

  return { parsed, raw }
}

function isImageryStale(captured: Date | string | null | undefined): boolean {
  if (!captured) return false
  const d = typeof captured === 'string' ? new Date(captured) : captured
  if (Number.isNaN(d.getTime())) return false
  const ageMs = Date.now() - d.getTime()
  const ageMonths = ageMs / (1000 * 60 * 60 * 24 * 30)
  return ageMonths > IMAGERY_STALE_MONTHS
}

async function loadNicheConfig(
  db: SupabaseClient,
  niche: ScoringNiche,
): Promise<NicheScoringConfig> {
  const { data } = await db
    .from('niche_scoring_config')
    .select('*')
    .eq('niche', niche)
    .maybeSingle()

  if (!data) return { ...DEFAULT_NICHE_CONFIG, niche }
  return {
    niche: data.niche,
    advance_threshold: data.advance_threshold ?? DEFAULT_NICHE_CONFIG.advance_threshold,
    visual_weight: Number(data.visual_weight ?? DEFAULT_NICHE_CONFIG.visual_weight),
    attom_weight: Number(data.attom_weight ?? DEFAULT_NICHE_CONFIG.attom_weight),
    geo_weight: Number(data.geo_weight ?? DEFAULT_NICHE_CONFIG.geo_weight),
    manual_review_sample_rate: Number(
      data.manual_review_sample_rate ?? DEFAULT_NICHE_CONFIG.manual_review_sample_rate,
    ),
    min_confidence: Number(data.min_confidence ?? DEFAULT_NICHE_CONFIG.min_confidence),
  }
}

interface PersistPayload {
  visual_analysis: VisualAnalysisBase | null
  visual_score: number
  attom_score: number
  geo_score: number
  final_score: number
  score_confidence: number
  imagery_freshness_warning: boolean
  manual_review_flagged: boolean
  disqualifier_reason: string | null
  advance: boolean
}

async function persistResult(
  db: SupabaseClient,
  propertyId: string,
  p: PersistPayload,
): Promise<void> {
  await db
    .from('properties')
    .update({
      visual_analysis: p.visual_analysis,
      visual_score: p.visual_score,
      attom_score: p.attom_score,
      geo_score: p.geo_score,
      final_score: p.final_score,
      score_confidence: p.score_confidence,
      imagery_freshness_warning: p.imagery_freshness_warning,
      manual_review_flagged: p.manual_review_flagged,
      disqualifier_reason: p.disqualifier_reason,
      scoring_model_version: SCORING_MODEL_VERSION,
      scored_at: new Date().toISOString(),
      // Keep v1 column in sync so downstream UI + rendering pipeline work unchanged.
      upgrade_score: p.final_score,
      score_reasons: p.visual_analysis?.reasoning ? [p.visual_analysis.reasoning] : [],
      suppressed: !p.advance,
    })
    .eq('id', propertyId)
}
