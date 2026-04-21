import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import type { CRMStage, LossReason } from '@/types'

const STAGES: CRMStage[] = [
  'postcard_sent',
  'delivered',
  'page_viewed',
  'responded',
  'appointment_set',
  'quoted',
  'closed_won',
  'closed_lost',
]
const LOSS: LossReason[] = ['price', 'timing', 'competitor', 'no_response', 'not_interested', 'other']

const patchSchema = z.object({
  lead_id: z.string().uuid(),
  new_stage: z.enum(STAGES as [CRMStage, ...CRMStage[]]).optional(),
  note: z.string().min(1).optional(),
  call_log: z
    .object({
      duration: z.number().int().nonnegative(),
      outcome: z.string().min(1),
      notes: z.string().optional(),
    })
    .optional(),
  follow_up_date: z.string().nullable().optional(),
  quote_amount: z.number().nonnegative().optional(),
  deal_value: z.number().nonnegative().optional(),
  loss_reason: z.enum(LOSS as [LossReason, ...LossReason[]]).optional(),
  expected_close_date: z.string().nullable().optional(),
})

export async function PATCH(req: NextRequest) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 400 })
  }
  const {
    lead_id,
    new_stage,
    note,
    call_log,
    follow_up_date,
    quote_amount,
    deal_value,
    loss_reason,
    expected_close_date,
  } = parsed.data

  const { data: lead } = await supabase
    .from('leads')
    .select('*, properties(id, upgrade_score, zip, build_year, estimated_value)')
    .eq('id', lead_id)
    .eq('profile_id', user.id)
    .single()
  if (!lead) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const service = createServiceClient()
  const prev = lead.current_stage as CRMStage
  const upd: Record<string, unknown> = {}

  if (new_stage && new_stage !== prev) {
    upd.current_stage = new_stage
    const now = new Date().toISOString()
    if (new_stage === 'responded') upd.responded_at = now
    if (new_stage === 'appointment_set') upd.appointment_at = now
    if (new_stage === 'quoted') upd.quoted_at = now
    if (new_stage === 'closed_won' || new_stage === 'closed_lost') upd.closed_at = now

    await service.from('lead_activities').insert({
      lead_id,
      created_by: user.id,
      activity_type: 'stage_change',
      description: `Moved to ${new_stage.replace(/_/g, ' ')}`,
      metadata: { from_stage: prev, to_stage: new_stage },
    })

    await service.from('conversion_events').insert({
      property_id: lead.properties.id,
      profile_id: user.id,
      from_stage: prev,
      to_stage: new_stage,
      metadata: {
        upgrade_score: lead.properties.upgrade_score,
        zip: lead.properties.zip,
        build_year: lead.properties.build_year,
        estimated_value: lead.properties.estimated_value,
      },
    })

    if (new_stage === 'closed_won') {
      await service
        .from('scoring_feedback')
        .update({
          final_outcome: 'won',
          deal_value: deal_value ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq('property_id', lead.properties.id)
    }
    if (new_stage === 'closed_lost') {
      await service
        .from('scoring_feedback')
        .update({
          final_outcome: 'lost',
          loss_reason: loss_reason ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq('property_id', lead.properties.id)
    }
  }

  if (deal_value !== undefined) upd.deal_value = deal_value
  if (quote_amount !== undefined) upd.quote_amount = quote_amount
  if (loss_reason !== undefined) upd.loss_reason = loss_reason
  if (follow_up_date !== undefined) upd.follow_up_date = follow_up_date
  if (expected_close_date !== undefined) upd.expected_close_date = expected_close_date

  if (Object.keys(upd).length) {
    await service.from('leads').update(upd).eq('id', lead_id)
  }

  if (note) {
    await service.from('lead_activities').insert({
      lead_id,
      created_by: user.id,
      activity_type: 'note',
      description: note,
      metadata: {},
    })
  }

  if (call_log) {
    await service.from('lead_activities').insert({
      lead_id,
      created_by: user.id,
      activity_type: 'call_logged',
      description: `Call: ${call_log.outcome}`,
      metadata: {
        duration_min: call_log.duration,
        outcome: call_log.outcome,
        notes: call_log.notes ?? null,
      },
    })
  }

  if (follow_up_date) {
    await service.from('lead_activities').insert({
      lead_id,
      created_by: user.id,
      activity_type: 'follow_up_set',
      description: `Follow-up set for ${follow_up_date}`,
      metadata: { follow_up_date },
    })
  }

  return NextResponse.json({ success: true })
}
