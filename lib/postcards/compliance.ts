import type { SupabaseClient } from '@supabase/supabase-js'

export class ComplianceError extends Error {
  constructor(
    public failed: string[],
    message: string,
  ) {
    super(message)
    this.name = 'ComplianceError'
  }
}

export interface ComplianceResult {
  passed: boolean
  checks: Record<string, boolean>
  failed: string[]
}

export async function runComplianceChecks(
  db: SupabaseClient,
  postcardId: string,
): Promise<ComplianceResult> {
  const { data: postcard } = await db
    .from('postcards')
    .select('*, profiles!postcards_user_id_fkey(*)')
    .eq('id', postcardId)
    .single()

  if (!postcard) {
    throw new ComplianceError(['postcard_exists'], 'Postcard not found')
  }

  const profile = (postcard as { profiles: Record<string, unknown> }).profiles
  const back = (postcard.back_html_rendered ?? '') as string
  const front = (postcard.front_html_rendered ?? '') as string

  const checks = {
    return_address_present:
      Boolean(profile?.return_address) &&
      Boolean(profile?.return_city) &&
      Boolean(profile?.return_state) &&
      Boolean(profile?.return_zip),
    company_name_present: Boolean(profile?.company_name),
    ai_disclaimer_present: back.includes('AI-generated') || front.includes('AI-generated'),
    roi_disclaimer_present: back.includes('Estimated values'),
    opt_out_link_present: back.includes(postcard.landing_page_slug),
    suppression_checked: Boolean(postcard.suppression_checked_at),
    google_attribution_present: back.includes('Google'),
    disclosures_version_current: postcard.disclaimers_version === 'v1.0',
    has_rendered_html: Boolean(front) && Boolean(back),
    has_landing_slug: Boolean(postcard.landing_page_slug),
  }

  const failed = Object.entries(checks)
    .filter(([, v]) => !v)
    .map(([k]) => k)

  return { passed: failed.length === 0, checks, failed }
}
