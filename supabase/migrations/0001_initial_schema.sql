-- ProspectVision initial schema — run top to bottom in Supabase SQL Editor.
-- 12 tables + RLS on every table + auto-profile trigger + credit helper.

-- ═══ 001: PROFILES ════════════════════════════════════════════════
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  company_name text not null default '',
  phone text,
  website text,
  niche text not null default '',
  return_address text not null default '',
  return_city text not null default '',
  return_state text not null default '',
  return_zip text not null default '',
  credit_balance integer not null default 0,
  stripe_customer_id text,
  service_area_zips jsonb default '[]'::jsonb,
  onboarded_at timestamptz,
  created_at timestamptz default now()
);
alter table profiles enable row level security;
create policy "users_own_profile" on profiles
  using (auth.uid() = id) with check (auth.uid() = id);

create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles(id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

create or replace function increment_credits(user_id uuid, amount integer)
returns void language sql security definer as $$
  update profiles set credit_balance = credit_balance + amount where id = user_id;
$$;

-- ═══ 002: CREDIT_PURCHASES ════════════════════════════════════════
create table credit_purchases (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  stripe_payment_intent text unique not null,
  credits_purchased integer not null,
  amount_cents integer not null,
  status text not null default 'pending'
    check (status in ('pending', 'completed', 'refunded')),
  created_at timestamptz default now()
);
alter table credit_purchases enable row level security;
create policy "users_own_purchases" on credit_purchases
  using (profile_id = auth.uid());

-- ═══ 003: SCAN_BATCHES ════════════════════════════════════════════
create table scan_batches (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  niche text not null,
  zip_codes jsonb not null default '[]'::jsonb,
  status text not null default 'queued'
    check (status in ('queued', 'scanning', 'scoring', 'rendering', 'enriching', 'ready', 'mailed', 'error')),
  total_scanned integer default 0,
  total_scored integer default 0,
  total_approved integer default 0,
  total_mailed integer default 0,
  progress_pct integer default 0,
  error_message text,
  created_at timestamptz default now(),
  completed_at timestamptz
);
alter table scan_batches enable row level security;
create policy "users_own_batches" on scan_batches
  using (profile_id = auth.uid());
create index idx_batches_profile on scan_batches(profile_id, created_at desc);

-- ═══ 004: PROPERTIES ══════════════════════════════════════════════
create table properties (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references scan_batches(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  address text not null,
  city text not null,
  state text not null,
  zip text not null,
  lat float8,
  lng float8,
  owner_first text,
  owner_last text,
  owner_occupied boolean,
  build_year integer,
  lot_size_sqft integer,
  estimated_value integer,
  upgrade_score integer,
  score_reasons jsonb default '[]'::jsonb,
  satellite_url text,
  streetview_url text,
  render_url text,
  landing_slug text unique,
  qr_code_url text,
  roi_estimate_low integer,
  roi_estimate_high integer,
  lob_postcard_id text,
  lob_status text default 'not_mailed',
  lob_expected_delivery date,
  approved boolean default false,
  suppressed boolean default false,
  data_fetched_at timestamptz,
  page_views integer default 0,
  created_at timestamptz default now()
);
alter table properties enable row level security;
create policy "users_own_properties" on properties
  using (profile_id = auth.uid());
create index idx_props_batch on properties(batch_id);
create index idx_props_slug  on properties(landing_slug) where landing_slug is not null;
create index idx_props_score on properties(batch_id, upgrade_score desc) where suppressed = false;

-- ═══ 005: LEADS ═══════════════════════════════════════════════════
create table leads (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null unique references properties(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  current_stage text not null default 'postcard_sent'
    check (current_stage in ('postcard_sent', 'delivered', 'page_viewed', 'responded',
      'appointment_set', 'quoted', 'closed_won', 'closed_lost')),
  response_channel text check (response_channel in ('phone', 'email', 'form', 'walk_in')),
  quote_amount numeric(12, 2),
  deal_value numeric(12, 2),
  loss_reason text check (loss_reason in ('price', 'timing', 'competitor', 'no_response', 'not_interested', 'other')),
  expected_close_date date,
  follow_up_date date,
  responded_at timestamptz,
  appointment_at timestamptz,
  quoted_at timestamptz,
  closed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table leads enable row level security;
create policy "users_own_leads" on leads
  using (profile_id = auth.uid());
create index idx_leads_profile_stage on leads(profile_id, current_stage);
create index idx_leads_followup on leads(follow_up_date) where follow_up_date is not null;

create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger leads_updated_at
  before update on leads
  for each row execute function update_updated_at();

-- ═══ 006: LEAD_ACTIVITIES ═════════════════════════════════════════
create table lead_activities (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references leads(id) on delete cascade,
  activity_type text not null
    check (activity_type in ('stage_change', 'note', 'call_logged', 'follow_up_set', 'email_sent')),
  description text,
  metadata jsonb default '{}'::jsonb,
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);
alter table lead_activities enable row level security;
create policy "users_see_own_activities" on lead_activities
  using (exists (select 1 from leads where leads.id = lead_id and leads.profile_id = auth.uid()));
create index idx_activities_lead on lead_activities(lead_id, created_at desc);

-- ═══ 007: CONVERSION_EVENTS ═══════════════════════════════════════
create table conversion_events (
  id uuid primary key default gen_random_uuid(),
  property_id uuid references properties(id) on delete cascade,
  profile_id uuid references profiles(id) on delete cascade,
  niche text,
  from_stage text,
  to_stage text not null,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);
alter table conversion_events enable row level security;
create policy "users_own_events" on conversion_events
  using (profile_id = auth.uid());
create index idx_conv_niche on conversion_events(niche, to_stage);

-- ═══ 008: SCORING_FEEDBACK ════════════════════════════════════════
create table scoring_feedback (
  id uuid primary key default gen_random_uuid(),
  property_id uuid unique references properties(id) on delete cascade,
  original_score integer,
  final_outcome text check (final_outcome in ('won', 'lost', 'no_response')),
  deal_value numeric(12, 2),
  loss_reason text,
  updated_at timestamptz default now()
);
alter table scoring_feedback enable row level security;
create policy "users_see_own_feedback" on scoring_feedback
  using (exists (select 1 from properties where properties.id = property_id and properties.profile_id = auth.uid()));

-- ═══ 009: GEO_PERFORMANCE ═════════════════════════════════════════
create table geo_performance (
  zip_code text not null,
  niche text not null,
  total_sent int default 0,
  total_delivered int default 0,
  total_responded int default 0,
  total_closed int default 0,
  avg_deal_value numeric(12, 2) default 0,
  response_rate float4 default 0,
  close_rate float4 default 0,
  updated_at timestamptz default now(),
  primary key (zip_code, niche)
);
alter table geo_performance enable row level security;
create policy "auth_read_geo" on geo_performance
  for select to authenticated using (true);

-- ═══ 010: NICHE_BENCHMARKS ════════════════════════════════════════
create table niche_benchmarks (
  niche text primary key,
  avg_response_rate float4 default 0,
  avg_close_rate float4 default 0,
  avg_deal_value numeric(12, 2) default 0,
  avg_cost_per_acquisition numeric(12, 2) default 0,
  sample_size integer default 0,
  updated_at timestamptz default now()
);
alter table niche_benchmarks enable row level security;
create policy "auth_read_benchmarks" on niche_benchmarks
  for select to authenticated using (true);

-- ═══ 011: SUPPRESSED_ADDRESSES ════════════════════════════════════
create table suppressed_addresses (
  id uuid primary key default gen_random_uuid(),
  address_normalized text unique not null,
  suppression_source text not null default 'homeowner_optout'
    check (suppression_source in ('homeowner_optout', 'dma_list', 'bounce', 'manual')),
  suppressed_at timestamptz default now(),
  opt_out_ip text
);
alter table suppressed_addresses enable row level security;
create policy "no_direct_access" on suppressed_addresses using (false);
create index idx_suppressed on suppressed_addresses(address_normalized);

-- ═══ 012: OPT_OUT_REQUESTS ════════════════════════════════════════
create table opt_out_requests (
  id uuid primary key default gen_random_uuid(),
  address text not null,
  landing_slug text,
  requested_at timestamptz default now(),
  processed_at timestamptz
);
alter table opt_out_requests enable row level security;
create policy "no_direct_access" on opt_out_requests using (false);
