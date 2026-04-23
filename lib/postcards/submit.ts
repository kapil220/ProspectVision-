import type { SupabaseClient } from '@supabase/supabase-js'
import { sendPostcard } from '@/lib/lob'
import { runComplianceChecks, ComplianceError } from '@/lib/postcards/compliance'

const PER_POSTCARD_COST_USD = 1.25

export interface SubmitResult {
  success: boolean
  lob_postcard_id: string
  expected_delivery_date: string | null
}

export async function submitPostcardToLob(
  db: SupabaseClient,
  postcardId: string,
): Promise<SubmitResult> {
  const { data: postcard } = await db
    .from('postcards')
    .select('*, properties(*), profiles!postcards_user_id_fkey(*)')
    .eq('id', postcardId)
    .single()

  if (!postcard) throw new Error(`Postcard ${postcardId} not found`)
  if (postcard.status !== 'pending') {
    throw new Error(`Postcard ${postcardId} is not in pending status (is: ${postcard.status})`)
  }

  // Hard compliance gate — blocks submission on any failure.
  const compliance = await runComplianceChecks(db, postcardId)
  if (!compliance.passed) {
    throw new ComplianceError(
      compliance.failed,
      `Compliance check failed: ${compliance.failed.join(', ')}`,
    )
  }

  const property = postcard.properties as {
    id: string
    address: string
    city: string
    state: string
    zip: string
    owner_first: string | null
    owner_last: string | null
  }
  const profile = postcard.profiles as {
    id: string
    company_name: string
    return_address: string
    return_city: string
    return_state: string
    return_zip: string
    niche: string
    credit_balance: number
  }

  const recipientName =
    [property.owner_first, property.owner_last].filter(Boolean).join(' ') ||
    'Current Resident'

  try {
    const lob = await sendPostcard({
      toName: recipientName,
      toAddress: property.address,
      toCity: property.city,
      toState: property.state,
      toZip: property.zip,
      fromCompany: profile.company_name,
      fromAddress: profile.return_address,
      fromCity: profile.return_city,
      fromState: profile.return_state,
      fromZip: profile.return_zip,
      htmlFront: postcard.front_html_rendered ?? '',
      htmlBack: postcard.back_html_rendered ?? '',
      idempotencyKey: `pv-${postcardId}`,
    })

    await db
      .from('postcards')
      .update({
        lob_postcard_id: lob.id,
        lob_expected_delivery_date: lob.expectedDeliveryDate,
        status: 'submitted',
        submitted_at: new Date().toISOString(),
        cost_usd: PER_POSTCARD_COST_USD,
      })
      .eq('id', postcardId)

    // Keep properties table in sync so existing Kanban UI continues working.
    await db
      .from('properties')
      .update({
        lob_postcard_id: lob.id,
        lob_status: 'created',
        lob_expected_delivery: lob.expectedDeliveryDate,
        landing_slug: postcard.landing_page_slug,
        qr_code_url: postcard.qr_code_url,
      })
      .eq('id', property.id)

    // Deduct credit AFTER successful Lob submit (Iron Rule #8).
    const newBalance = Math.max(0, (profile.credit_balance ?? 0) - 1)
    await db.from('profiles').update({ credit_balance: newBalance }).eq('id', profile.id)

    // Auto-create CRM lead at 'postcard_sent' stage.
    const { data: lead } = await db
      .from('leads')
      .insert({
        property_id: property.id,
        profile_id: profile.id,
        postcard_id: postcardId,
        current_stage: 'postcard_sent',
      })
      .select('id')
      .single()

    if (lead) {
      await db.from('lead_activities').insert({
        lead_id: lead.id,
        created_by: profile.id,
        activity_type: 'stage_change',
        description: 'Postcard submitted for printing and mailing',
        metadata: { to_stage: 'postcard_sent', lob_id: lob.id, postcard_id: postcardId },
      })
    }

    await db.from('conversion_events').insert({
      property_id: property.id,
      profile_id: profile.id,
      niche: profile.niche,
      from_stage: null,
      to_stage: 'postcard_sent',
      metadata: { lob_postcard_id: lob.id, postcard_id: postcardId },
    })

    return {
      success: true,
      lob_postcard_id: lob.id,
      expected_delivery_date: lob.expectedDeliveryDate,
    }
  } catch (err) {
    await db
      .from('postcards')
      .update({ status: 'failed', updated_at: new Date().toISOString() })
      .eq('id', postcardId)
    throw err
  }
}
