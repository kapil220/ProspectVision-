import { NextResponse, type NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { scoreProperty, type ScoreInput } from '@/lib/scoring'
import { chunkArray, sleep } from '@/lib/utils'
import type { NicheId } from '@/types'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

interface PropertyRow {
  id: string
  address: string
  zip: string | null
  upgrade_score: number | null
  final_score: number | null
  visual_score: number | null
  attom_score: number | null
  geo_score: number | null
  score_confidence: number | null
  scoring_model_version: string | null
  satellite_url: string | null
  streetview_url: string | null
  owner_occupied: boolean | null
  estimated_value: number | null
  build_year: number | null
  lot_size_sqft: number | null
  imagery_captured_at: string | null
}

interface ComparisonEntry {
  property_id: string
  address: string
  v1_score: number | null
  v2_final: number
  v2_visual: number
  v2_attom: number
  v2_geo: number
  v2_confidence: number
  v2_advance: boolean
  disqualifier: string | null
  delta: number | null
}

export async function POST(req: NextRequest) {
  const token = req.headers.get('x-seed-token')
  if (!process.env.DEMO_SEED_TOKEN || token !== process.env.DEMO_SEED_TOKEN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { batch_id?: string; property_ids?: string[] }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!body.batch_id && !body.property_ids?.length) {
    return NextResponse.json(
      { error: 'batch_id or property_ids required' },
      { status: 400 },
    )
  }

  const service = createServiceClient()

  let niche: NicheId
  let props: PropertyRow[]

  if (body.batch_id) {
    const { data: batch } = await service
      .from('scan_batches')
      .select('niche')
      .eq('id', body.batch_id)
      .single()
    if (!batch) return NextResponse.json({ error: 'Batch not found' }, { status: 404 })
    niche = batch.niche as NicheId

    const { data: rows } = await service
      .from('properties')
      .select(
        'id,address,zip,upgrade_score,final_score,visual_score,attom_score,geo_score,score_confidence,scoring_model_version,satellite_url,streetview_url,owner_occupied,estimated_value,build_year,lot_size_sqft,imagery_captured_at',
      )
      .eq('batch_id', body.batch_id)
    props = (rows ?? []) as PropertyRow[]
  } else {
    const { data: rows } = await service
      .from('properties')
      .select(
        'id,address,zip,upgrade_score,final_score,visual_score,attom_score,geo_score,score_confidence,scoring_model_version,satellite_url,streetview_url,owner_occupied,estimated_value,build_year,lot_size_sqft,imagery_captured_at,scan_batches!inner(niche)',
      )
      .in('id', body.property_ids!)
    props = (rows ?? []) as unknown as PropertyRow[]
    const first = rows?.[0] as unknown as { scan_batches?: { niche?: string } } | undefined
    niche = (first?.scan_batches?.niche as NicheId) ?? 'landscaping'
  }

  if (!props.length) {
    return NextResponse.json({ error: 'No properties found' }, { status: 404 })
  }

  const comparisons: ComparisonEntry[] = []
  const failures: { property_id: string; error: string }[] = []

  // Process 3 at a time to stay under rate limits during a full rescore.
  const chunks = chunkArray(props, 3)
  for (const chunk of chunks) {
    await Promise.all(
      chunk.map(async (p) => {
        if (!p.satellite_url) {
          failures.push({ property_id: p.id, error: 'no_satellite_url' })
          return
        }
        const v1Score = p.upgrade_score
        const input: ScoreInput = {
          property_id: p.id,
          niche,
          satellite_url: p.satellite_url,
          street_view_url: p.streetview_url,
          zip: p.zip ?? '',
          imagery_captured_at: p.imagery_captured_at,
          attom: {
            owner_occupied: p.owner_occupied,
            estimated_value: p.estimated_value,
            build_year: p.build_year,
            lot_size_sqft: p.lot_size_sqft,
          },
        }

        try {
          const r = await scoreProperty(service, input)
          comparisons.push({
            property_id: p.id,
            address: p.address,
            v1_score: v1Score,
            v2_final: r.final_score,
            v2_visual: r.visual_score,
            v2_attom: r.attom_score,
            v2_geo: r.geo_score,
            v2_confidence: r.confidence,
            v2_advance: r.advance,
            disqualifier: r.disqualifier_reason,
            delta: v1Score !== null ? r.final_score - v1Score : null,
          })
        } catch (err) {
          failures.push({
            property_id: p.id,
            error: err instanceof Error ? err.message : String(err),
          })
        }
      }),
    )
    if (chunk !== chunks[chunks.length - 1]) await sleep(800)
  }

  const summary = buildSummary(comparisons)
  return NextResponse.json({
    ok: true,
    niche,
    total: props.length,
    rescored: comparisons.length,
    failed: failures.length,
    summary,
    comparisons: comparisons.sort((a, b) => b.v2_final - a.v2_final),
    failures,
  })
}

function buildSummary(c: ComparisonEntry[]): Record<string, unknown> {
  if (!c.length) return { note: 'no data' }
  const withV1 = c.filter((e) => e.v1_score !== null)
  const deltas = withV1.map((e) => e.delta ?? 0)
  const advanced = c.filter((e) => e.v2_advance).length
  const avgConfidence = c.reduce((s, e) => s + e.v2_confidence, 0) / c.length
  const disqualified = c.filter((e) => e.disqualifier).length
  return {
    advanced_v2: advanced,
    suppressed_v2: c.length - advanced,
    disqualified_v2: disqualified,
    avg_confidence_v2: Number(avgConfidence.toFixed(2)),
    avg_delta_v2_vs_v1: deltas.length
      ? Number((deltas.reduce((s, d) => s + d, 0) / deltas.length).toFixed(1))
      : null,
    max_delta: deltas.length ? Math.max(...deltas.map(Math.abs)) : null,
    avg_v2_final: Number(
      (c.reduce((s, e) => s + e.v2_final, 0) / c.length).toFixed(1),
    ),
  }
}
