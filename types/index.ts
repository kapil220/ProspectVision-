export type NicheId =
  | 'landscaping'
  | 'roofing'
  | 'solar'
  | 'exterior_painting'
  | 'fencing'
  | 'pool_installation'
  | 'driveway_paving'
  | 'pressure_washing'
  | 'hvac'

export type BatchStatus =
  | 'queued'
  | 'scanning'
  | 'scoring'
  | 'rendering'
  | 'enriching'
  | 'ready'
  | 'mailed'
  | 'error'

export type CRMStage =
  | 'postcard_sent'
  | 'delivered'
  | 'page_viewed'
  | 'responded'
  | 'appointment_set'
  | 'quoted'
  | 'closed_won'
  | 'closed_lost'

export type LobStatus =
  | 'not_mailed'
  | 'created'
  | 'mailed'
  | 'in_transit'
  | 'delivered'
  | 'failed'

export type LossReason =
  | 'price'
  | 'timing'
  | 'competitor'
  | 'no_response'
  | 'not_interested'
  | 'other'

export type ResponseChannel = 'phone' | 'email' | 'form' | 'walk_in'

export type ActivityType =
  | 'stage_change'
  | 'note'
  | 'call_logged'
  | 'follow_up_set'
  | 'email_sent'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  company_name: string
  phone: string | null
  website: string | null
  niche: NicheId | ''
  return_address: string
  return_city: string
  return_state: string
  return_zip: string
  credit_balance: number
  stripe_customer_id: string | null
  service_area_zips: string[]
  onboarded_at: string | null
  created_at: string
}

export interface ScanBatch {
  id: string
  profile_id: string
  niche: NicheId
  zip_codes: string[]
  status: BatchStatus
  total_scanned: number
  total_scored: number
  total_approved: number
  total_mailed: number
  progress_pct: number
  error_message: string | null
  created_at: string
  completed_at: string | null
}

export interface Property {
  id: string
  batch_id: string
  profile_id: string
  address: string
  city: string
  state: string
  zip: string
  lat: number | null
  lng: number | null
  owner_first: string | null
  owner_last: string | null
  owner_occupied: boolean | null
  build_year: number | null
  lot_size_sqft: number | null
  estimated_value: number | null
  upgrade_score: number | null
  score_reasons: string[]
  satellite_url: string | null
  streetview_url: string | null
  render_url: string | null
  landing_slug: string | null
  qr_code_url: string | null
  roi_estimate_low: number | null
  roi_estimate_high: number | null
  lob_postcard_id: string | null
  lob_status: LobStatus
  lob_expected_delivery: string | null
  approved: boolean
  suppressed: boolean
  data_fetched_at: string | null
  page_views: number
  created_at: string
}

export interface Lead {
  id: string
  property_id: string
  profile_id: string
  current_stage: CRMStage
  response_channel: ResponseChannel | null
  quote_amount: number | null
  deal_value: number | null
  loss_reason: LossReason | null
  expected_close_date: string | null
  follow_up_date: string | null
  responded_at: string | null
  appointment_at: string | null
  quoted_at: string | null
  closed_at: string | null
  created_at: string
  updated_at: string
}

export interface LeadActivity {
  id: string
  lead_id: string
  activity_type: ActivityType
  description: string | null
  metadata: Record<string, unknown>
  created_by: string | null
  created_at: string
}

export interface LeadWithProperty extends Lead {
  property: Property
}

export type ApiResponse<T> = { data: T; error: null } | { data: null; error: string }
