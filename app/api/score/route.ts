import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { scoreProperty, type ScoreInput } from '@/lib/scoring'
import type { NicheId } from '@/types'

export const dynamic = 'force-dynamic'

// Single-property scoring endpoint for manual re-scoring / debugging / calibration.
// The batch pipeline still scores inline via lib/pipeline/score.ts on scan.
export async function POST(req: NextRequest) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { property_id?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  if (!body.property_id) {
    return NextResponse.json({ error: 'property_id required' }, { status: 400 })
  }

  const service = createServiceClient()
  const { data: prop } = await service
    .from('properties')
    .select(
      'id,zip,satellite_url,streetview_url,owner_occupied,estimated_value,build_year,lot_size_sqft,imagery_captured_at, scan_batches!inner(niche, profile_id)',
    )
    .eq('id', body.property_id)
    .eq('profile_id', user.id)
    .maybeSingle()

  if (!prop) return NextResponse.json({ error: 'Property not found' }, { status: 404 })
  if (!prop.satellite_url) {
    return NextResponse.json({ error: 'Property has no satellite image' }, { status: 400 })
  }

  const batchInfo = (prop as unknown as { scan_batches: { niche: string } }).scan_batches
  const input: ScoreInput = {
    property_id: prop.id,
    niche: batchInfo.niche as NicheId,
    satellite_url: prop.satellite_url,
    street_view_url: prop.streetview_url,
    zip: prop.zip ?? '',
    imagery_captured_at: prop.imagery_captured_at,
    attom: {
      owner_occupied: prop.owner_occupied,
      estimated_value: prop.estimated_value,
      build_year: prop.build_year,
      lot_size_sqft: prop.lot_size_sqft,
    },
  }

  try {
    const result = await scoreProperty(service, input)
    return NextResponse.json({ success: true, ...result })
  } catch (err) {
    console.error('[score] error:', err)
    const message = err instanceof Error ? err.message : 'Scoring failed'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
