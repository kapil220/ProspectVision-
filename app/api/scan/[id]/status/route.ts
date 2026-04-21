import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { generateSlug } from '@/lib/utils'
import { getNiche } from '@/lib/niches'
import type { BatchStatus, NicheId } from '@/types'

const SIM_STREETS = [
  'Maple Ave', 'Oak St', 'Pine Rd', 'Elm Dr', 'Cedar Ln',
  'Birch Ct', 'Willow Way', 'Chestnut Blvd', 'Spruce Pl', 'Magnolia Dr',
]
const SIM_FIRSTS = ['James', 'Mary', 'Robert', 'Patricia', 'John', 'Jennifer', 'Michael', 'Linda', 'David', 'Barbara', 'William', 'Susan', 'Thomas', 'Karen', 'Daniel']
const SIM_LASTS = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson']

function pick<T>(arr: T[], seed: number): T {
  return arr[seed % arr.length]
}

async function seedFakeProperties(
  service: ReturnType<typeof createServiceClient>,
  batchId: string,
  profileId: string,
  niche: NicheId,
  zip: string,
) {
  const nicheCfg = getNiche(niche)
  const rows = Array.from({ length: 15 }).map((_, i) => {
    const seed = Date.now() + i
    const street = pick(SIM_STREETS, seed + i * 3)
    const num = 100 + ((seed * (i + 7)) % 8000)
    const score = 65 + Math.floor(Math.random() * 35)
    const owner_first = pick(SIM_FIRSTS, seed + i)
    const owner_last = pick(SIM_LASTS, seed + i * 2)
    const lot = 4000 + Math.floor(Math.random() * 14000)
    const value = 250000 + Math.floor(Math.random() * 550000)
    const buildYr = 1950 + Math.floor(Math.random() * 65)
    const roiLow = nicheCfg?.avg_job_low ?? 6000
    const roiHigh = nicheCfg?.avg_job_high ?? 15000
    return {
      batch_id: batchId,
      profile_id: profileId,
      address: `${num} ${street}`,
      city: 'Demo City',
      state: 'CA',
      zip,
      lat: 34 + Math.random(),
      lng: -118 - Math.random(),
      owner_first,
      owner_last,
      owner_occupied: Math.random() > 0.3,
      build_year: buildYr,
      lot_size_sqft: lot,
      estimated_value: value,
      upgrade_score: score,
      score_reasons: [
        'Bare dirt covering most of front yard',
        'No foundation plantings visible',
        'Aging exterior suggests deferred maintenance',
      ].slice(0, 2 + (i % 2)),
      satellite_url: `https://picsum.photos/seed/${batchId}-${i}-sat/800/450`,
      streetview_url: `https://picsum.photos/seed/${batchId}-${i}-sv/800/450`,
      render_url: i % 3 === 0 ? null : `https://picsum.photos/seed/${batchId}-${i}-render/800/450`,
      landing_slug: generateSlug(),
      roi_estimate_low: Math.round((roiLow * (score / 100)) * 4),
      roi_estimate_high: Math.round((roiHigh * (score / 100)) * 4),
      lob_status: 'not_mailed',
      approved: false,
      suppressed: false,
      data_fetched_at: new Date().toISOString(),
    }
  })
  await service.from('properties').insert(rows)
}

type Stage = {
  status: BatchStatus
  startSec: number
  endSec: number
  startPct: number
  endPct: number
}

const STAGES: Stage[] = [
  { status: 'queued',    startSec: 0,  endSec: 3,  startPct: 0,   endPct: 5 },
  { status: 'scanning',  startSec: 3,  endSec: 8,  startPct: 5,   endPct: 30 },
  { status: 'scoring',   startSec: 8,  endSec: 18, startPct: 30,  endPct: 60 },
  { status: 'rendering', startSec: 18, endSec: 25, startPct: 60,  endPct: 85 },
  { status: 'enriching', startSec: 25, endSec: 30, startPct: 85,  endPct: 95 },
  { status: 'ready',     startSec: 30, endSec: 999, startPct: 100, endPct: 100 },
]

function simulate(elapsed: number, zipCount: number) {
  const stage = STAGES.find((s) => elapsed >= s.startSec && elapsed < s.endSec) ?? STAGES[STAGES.length - 1]
  const span = Math.max(1, stage.endSec - stage.startSec)
  const t = Math.min(1, (elapsed - stage.startSec) / span)
  const progress_pct =
    stage.status === 'ready' ? 100 : Math.round(stage.startPct + (stage.endPct - stage.startPct) * t)

  const target = zipCount * 30
  const scannedT = Math.min(1, Math.max(0, (elapsed - 3) / 5))
  const scoredT = Math.min(1, Math.max(0, (elapsed - 8) / 10))
  const approvedT = Math.min(1, Math.max(0, (elapsed - 25) / 5))

  return {
    status: stage.status,
    progress_pct,
    total_scanned: Math.round(target * scannedT),
    total_scored: Math.round(target * scoredT),
    total_approved: Math.round(Math.max(3, target * 0.18) * approvedT),
  }
}

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: batch, error } = await supabase
    .from('scan_batches')
    .select('*')
    .eq('id', params.id)
    .eq('profile_id', user.id)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!batch) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const simMode = process.env.SCAN_SIMULATE === '1'
  const terminal = batch.status === 'ready' || batch.status === 'error' || batch.status === 'mailed'

  if (!simMode || terminal) {
    return NextResponse.json(batch)
  }

  const elapsed = (Date.now() - new Date(batch.created_at).getTime()) / 1000
  const zips = Array.isArray(batch.zip_codes) ? (batch.zip_codes as string[]) : []
  const sim = simulate(elapsed, Math.max(1, zips.length))

  const updates: Record<string, unknown> = {
    status: sim.status,
    progress_pct: sim.progress_pct,
    total_scanned: sim.total_scanned,
    total_scored: sim.total_scored,
    total_approved: sim.total_approved,
  }
  if (sim.status === 'ready') updates.completed_at = new Date().toISOString()

  const service = createServiceClient()

  if (sim.status === 'ready' && batch.status !== 'ready') {
    const zip = zips[0] ?? '00000'
    await seedFakeProperties(service, batch.id, user.id, batch.niche as NicheId, zip)
  }

  const { data: updated } = await service
    .from('scan_batches')
    .update(updates)
    .eq('id', batch.id)
    .select('*')
    .single()

  return NextResponse.json(updated ?? { ...batch, ...updates })
}
