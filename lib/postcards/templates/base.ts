export type PostcardPlaceholders = {
  owner_first_name: string
  owner_last_name: string
  property_street: string
  property_city: string
  property_state: string
  property_zip: string

  before_image_url: string
  after_image_url: string

  cost_range_low: string
  cost_range_high: string
  value_lift_pct: string
  value_add_low: string
  value_add_high: string

  headline: string
  subheadline: string
  body_copy: string
  cta_text: string
  stats_line: string

  contractor_company_name: string
  contractor_phone: string
  contractor_email: string
  contractor_website: string
  contractor_license: string
  contractor_logo_url: string
  contractor_return_address: string

  qr_code_svg: string
  landing_page_url: string
  landing_page_slug: string

  ai_render_disclaimer: string
  roi_disclaimer: string
  opt_out_text: string
  google_attribution: string
}

export function renderTemplate(template: string, data: PostcardPlaceholders): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_match, key: string) => {
    const value = data[key as keyof PostcardPlaceholders]
    return value !== undefined ? String(value) : ''
  })
}

export const AI_RENDER_DISCLAIMER =
  'The "after" image is an AI-generated visualization for illustrative purposes, not a photograph of completed work.'

export const ROI_DISCLAIMER =
  'Estimated values based on national averages. Actual results vary by property and market.'

export const GOOGLE_ATTRIBUTION = 'Imagery © Google'

export const DISCLAIMERS_VERSION = 'v1.0'
