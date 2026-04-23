-- Structured scoring v2 — see docs/scoring-rebuild.md
-- Adds hybrid (visual + attom + geo) scoring columns, golden dataset, config table, audit log.

alter table properties
  add column if not exists visual_analysis jsonb,
  add column if not exists visual_score integer,
  add column if not exists attom_score integer,
  add column if not exists geo_score integer,
  add column if not exists final_score integer,
  add column if not exists score_confidence numeric(3, 2),
  add column if not exists scoring_model_version text default 'v1',
  add column if not exists scored_at timestamptz,
  add column if not exists imagery_captured_at date,
  add column if not exists imagery_freshness_warning boolean default false,
  add column if not exists manual_review_flagged boolean default false,
  add column if not exists disqualifier_reason text;

create index if not exists idx_properties_final_score on properties(final_score desc);
create index if not exists idx_properties_scored_at on properties(scored_at);

-- Golden calibration dataset (hand-labeled reference properties).
create table if not exists scoring_golden_set (
  id uuid primary key default gen_random_uuid(),
  niche text not null,
  satellite_image_url text not null,
  street_view_image_url text,
  attom_snapshot jsonb,
  expected_visual_score integer not null,
  expected_final_score integer not null,
  expected_should_advance boolean not null,
  labeler_notes text,
  created_at timestamptz default now()
);
alter table scoring_golden_set enable row level security;
create policy "service_role_golden_set" on scoring_golden_set
  for all to service_role using (true) with check (true);

-- Hot-swappable per-niche thresholds + weights.
create table if not exists niche_scoring_config (
  niche text primary key,
  advance_threshold integer not null,
  visual_weight numeric(3, 2) default 0.50,
  attom_weight numeric(3, 2) default 0.30,
  geo_weight numeric(3, 2) default 0.20,
  manual_review_sample_rate numeric(4, 3) default 0.02,
  min_confidence numeric(3, 2) default 0.60,
  updated_at timestamptz default now()
);
alter table niche_scoring_config enable row level security;
create policy "auth_read_niche_config" on niche_scoring_config
  for select to authenticated using (true);
create policy "service_write_niche_config" on niche_scoring_config
  for all to service_role using (true) with check (true);

insert into niche_scoring_config
  (niche, advance_threshold, visual_weight, attom_weight, geo_weight) values
  ('landscaping',       70, 0.60, 0.25, 0.15),
  ('roofing',           75, 0.40, 0.45, 0.15),
  ('solar',             75, 0.45, 0.40, 0.15),
  ('exterior_painting', 75, 0.55, 0.30, 0.15),
  ('fencing',           70, 0.60, 0.25, 0.15),
  ('pool_installation', 80, 0.50, 0.40, 0.10),
  ('driveway_paving',   75, 0.55, 0.30, 0.15),
  ('pressure_washing',  65, 0.70, 0.15, 0.15),
  ('hvac',              80, 0.25, 0.60, 0.15)
on conflict (niche) do nothing;

-- Scoring run audit log (every v2 scoring call).
create table if not exists scoring_runs (
  id uuid primary key default gen_random_uuid(),
  property_id uuid references properties(id) on delete cascade,
  model_version text not null,
  prompt_version text not null,
  visual_score integer,
  attom_score integer,
  geo_score integer,
  final_score integer,
  confidence numeric(3, 2),
  vision_api_ms integer,
  vision_api_cost_usd numeric(6, 4),
  raw_vision_response jsonb,
  error text,
  created_at timestamptz default now()
);
alter table scoring_runs enable row level security;
create policy "users_see_own_runs" on scoring_runs
  for select using (
    exists (select 1 from properties where properties.id = property_id and properties.profile_id = auth.uid())
  );
create policy "service_write_runs" on scoring_runs
  for all to service_role using (true) with check (true);

create index if not exists idx_scoring_runs_property on scoring_runs(property_id);
create index if not exists idx_scoring_runs_created_at on scoring_runs(created_at desc);
