import type { SupabaseClient } from '@supabase/supabase-js'
import QRCode from 'qrcode'
import { nanoid } from 'nanoid'
import {
  AI_RENDER_DISCLAIMER,
  DISCLAIMERS_VERSION,
  GOOGLE_ATTRIBUTION,
  ROI_DISCLAIMER,
  renderTemplate,
  type PostcardPlaceholders,
} from '@/lib/postcards/templates/base'
import { getNicheOrThrow, calculateROI } from '@/lib/niches'
import { normalizeAddress } from '@/lib/utils'
import type { NicheId } from '@/types'

export class PostcardGenerationError extends Error {
  constructor(
    public code: string,
    message: string,
  ) {
    super(message)
    this.name = 'PostcardGenerationError'
  }
}

interface PropertyForRender {
  id: string
  address: string
  city: string
  state: string
  zip: string
  owner_first: string | null
  owner_last: string | null
  estimated_value: number | null
  satellite_url: string | null
  streetview_url: string | null
  render_url: string | null
}

interface ProfileForRender {
  company_name: string
  phone: string | null
  email: string | null
  website: string | null
  license_number?: string | null
  logo_url?: string | null
  return_address: string
  return_city: string
  return_state: string
  return_zip: string
}

// Build postcard HTML without touching the DB — for preview + rescore.
export async function buildPostcardHtml(
  db: SupabaseClient,
  property: PropertyForRender,
  profile: ProfileForRender,
  niche: NicheId,
  options: { slug?: string } = {},
): Promise<{ frontHtml: string; backHtml: string; placeholders: PostcardPlaceholders }> {
  const nicheCfg = getNicheOrThrow(niche)

  const { data: template } = await db
    .from('postcard_templates')
    .select('*')
    .eq('niche', niche)
    .eq('is_active', true)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (!template) {
    throw new PostcardGenerationError(
      'template_missing',
      `No active template for niche: ${niche}. Run /api/admin/seed-templates.`,
    )
  }

  const slug = options.slug ?? nanoid(12)
  const landingUrl = `${process.env.NEXT_PUBLIC_APP_URL}/p/${slug}`
  const qrCodeSvg = await QRCode.toString(landingUrl, {
    type: 'svg',
    margin: 0,
    width: 150,
    color: { dark: '#222222', light: '#00000000' },
  })

  const roi = calculateROI(nicheCfg, property.estimated_value ?? 250000)
  const firstName = property.owner_first || 'Homeowner'
  const returnAddr = `${profile.return_address}, ${profile.return_city}, ${profile.return_state} ${profile.return_zip}`

  const beforeUrl = property.streetview_url ?? property.satellite_url ?? ''
  const afterUrl = property.render_url ?? ''
  const beforePaneHtml = beforeUrl
    ? `<div class="img-pane"><img src="${beforeUrl}" alt="Your home today" /><div class="label">BEFORE</div></div>`
    : `<div class="img-pane after-empty"><div>Imagery loading…</div></div>`
  const afterPaneHtml = afterUrl
    ? `<div class="img-pane"><img src="${afterUrl}" alt="Your home transformed" /><div class="label after-label">AFTER</div><div class="ai-disclaimer">AI-generated visualization</div></div>`
    : `<div class="img-pane after-empty"><div>AI rendering<br/>in progress</div></div>`

  const placeholders: PostcardPlaceholders = {
    owner_first_name: firstName,
    owner_last_name: property.owner_last || '',
    property_street: property.address,
    property_city: property.city,
    property_state: property.state,
    property_zip: property.zip,
    before_image_url: beforeUrl,
    after_image_url: afterUrl,
    before_pane_html: beforePaneHtml,
    after_pane_html: afterPaneHtml,
    cost_range_low: formatUsd(nicheCfg.avg_job_low),
    cost_range_high: formatUsd(nicheCfg.avg_job_high),
    value_lift_pct: `${Math.round((nicheCfg.value_lift - 1) * 100)}%`,
    value_add_low: formatUsd(roi.low),
    value_add_high: formatUsd(roi.high),
    headline: renderString(template.headline, {
      owner_first_name: firstName,
      property_street: property.address,
    }),
    subheadline: template.subheadline ?? '',
    body_copy: renderString(template.body_copy, {
      owner_first_name: firstName,
      property_street: property.address,
    }),
    cta_text: template.cta_text,
    stats_line: template.stats_line ?? '',
    contractor_company_name: profile.company_name,
    contractor_phone: profile.phone ?? '',
    contractor_email: profile.email ?? '',
    contractor_website: profile.website ?? '',
    contractor_license: profile.license_number ?? '',
    contractor_logo_url: profile.logo_url ?? '',
    contractor_return_address: returnAddr,
    qr_code_svg: qrCodeSvg,
    landing_page_url: landingUrl,
    landing_page_slug: slug,
    ai_render_disclaimer: AI_RENDER_DISCLAIMER,
    roi_disclaimer: ROI_DISCLAIMER,
    opt_out_text: `To stop receiving mail, visit ${landingUrl} and click "Stop Mailings."`,
    google_attribution: GOOGLE_ATTRIBUTION,
  }

  const frontHtml = renderTemplate(template.front_html_template, placeholders)
  const backHtml = renderTemplate(template.back_html_template, placeholders)
  return { frontHtml, backHtml, placeholders }
}

export async function generatePostcard(
  db: SupabaseClient,
  propertyId: string,
): Promise<string> {
  // 1. Load property + batch niche + profile
  const { data: property } = await db
    .from('properties')
    .select('*, scan_batches!inner(niche)')
    .eq('id', propertyId)
    .maybeSingle()

  if (!property) {
    throw new PostcardGenerationError('property_not_found', `Property ${propertyId} not found`)
  }

  const niche = (property as { scan_batches: { niche: string } }).scan_batches.niche as NicheId

  const { data: profile } = await db
    .from('profiles')
    .select('*')
    .eq('id', property.profile_id)
    .single()
  if (!profile) {
    throw new PostcardGenerationError('profile_not_found', 'Profile not found')
  }

  // 2. Hard compliance check — return address + company required
  if (
    !profile.return_address ||
    !profile.return_city ||
    !profile.return_state ||
    !profile.return_zip ||
    !profile.company_name
  ) {
    throw new PostcardGenerationError(
      'missing_return_address',
      'User must set return address and company name before mailing.',
    )
  }

  // 3. Suppression list check
  const normalized = normalizeAddress(
    `${property.address} ${property.city} ${property.state} ${property.zip}`,
  )
  const { data: suppressed } = await db
    .from('suppressed_addresses')
    .select('id')
    .eq('address_normalized', normalized)
    .maybeSingle()

  if (suppressed) {
    throw new PostcardGenerationError(
      'suppressed',
      'Address is on suppression list. Cannot mail.',
    )
  }

  // 4+5+6+7. Build HTML via shared helper (fresh slug per call).
  const slug = nanoid(12)
  const { frontHtml, backHtml, placeholders } = await buildPostcardHtml(
    db,
    property as PropertyForRender,
    profile as ProfileForRender,
    niche,
    { slug },
  )

  // Load template id for the FK reference.
  const { data: template } = await db
    .from('postcard_templates')
    .select('id')
    .eq('niche', niche)
    .eq('is_active', true)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  // 8. Insert postcard record (status: pending)
  const landingUrl = `${process.env.NEXT_PUBLIC_APP_URL}/p/${slug}`
  const { data: postcard, error } = await db
    .from('postcards')
    .insert({
      property_id: propertyId,
      user_id: property.profile_id,
      batch_id: property.batch_id,
      template_id: template?.id,
      front_html_rendered: frontHtml,
      back_html_rendered: backHtml,
      personalization_snapshot: placeholders,
      landing_page_slug: slug,
      qr_code_url: landingUrl,
      status: 'pending',
      suppression_checked_at: new Date().toISOString(),
      disclaimers_version: DISCLAIMERS_VERSION,
    })
    .select('id')
    .single()

  if (error || !postcard) {
    throw new PostcardGenerationError('insert_failed', error?.message ?? 'insert failed')
  }

  return postcard.id
}

function formatUsd(n: number): string {
  return `$${Math.round(n).toLocaleString('en-US')}`
}

function renderString(template: string, data: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_m, k: string) => data[k] ?? '')
}
