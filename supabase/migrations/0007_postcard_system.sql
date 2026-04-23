-- Postcard system rebuild — see docs/postcard-rebuild.md
-- Separates postcard entity from properties, adds DB-stored templates,
-- granular landing_page_views, hot-swappable variants.

-- ═══ postcard_templates ══════════════════════════════════════════════
create table if not exists postcard_templates (
  id uuid primary key default gen_random_uuid(),
  niche text not null,
  variant_name text not null default 'default',
  front_html_template text not null,
  back_html_template text not null,
  headline text not null,
  subheadline text,
  body_copy text not null,
  cta_text text not null,
  stats_line text,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(niche, variant_name)
);
create index if not exists idx_postcard_templates_niche on postcard_templates(niche, is_active);
alter table postcard_templates enable row level security;
create policy "auth_read_templates" on postcard_templates for select to authenticated using (true);
create policy "service_write_templates" on postcard_templates for all to service_role using (true) with check (true);

-- ═══ postcards ═══════════════════════════════════════════════════════
create table if not exists postcards (
  id uuid primary key default gen_random_uuid(),
  property_id uuid references properties(id) on delete cascade,
  user_id uuid references profiles(id),
  batch_id uuid references scan_batches(id),
  template_id uuid references postcard_templates(id),
  front_html_rendered text,
  back_html_rendered text,
  personalization_snapshot jsonb,
  lob_postcard_id text,
  lob_expected_delivery_date date,
  lob_tracking_events jsonb default '[]'::jsonb,
  landing_page_slug text unique not null,
  qr_code_url text,
  landing_page_views integer default 0,
  first_viewed_at timestamptz,
  last_viewed_at timestamptz,
  status text not null default 'pending'
    check (status in ('pending','submitted','printed','mailed','delivered','returned','failed')),
  submitted_at timestamptz,
  mailed_at timestamptz,
  delivered_at timestamptz,
  cost_usd numeric(5, 3),
  credits_used integer default 1,
  suppression_checked_at timestamptz,
  disclaimers_version text default 'v1.0',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create unique index if not exists idx_postcards_lob_id on postcards(lob_postcard_id) where lob_postcard_id is not null;
create index if not exists idx_postcards_landing_slug on postcards(landing_page_slug);
create index if not exists idx_postcards_user_batch on postcards(user_id, batch_id);
create index if not exists idx_postcards_status on postcards(status);
create index if not exists idx_postcards_property on postcards(property_id);
alter table postcards enable row level security;
create policy "users_own_postcards" on postcards for all using (user_id = auth.uid());
create policy "service_postcards" on postcards for all to service_role using (true) with check (true);

-- ═══ landing_page_views ══════════════════════════════════════════════
create table if not exists landing_page_views (
  id uuid primary key default gen_random_uuid(),
  postcard_id uuid references postcards(id) on delete cascade,
  viewed_at timestamptz default now(),
  ip_hash text,
  user_agent text,
  referrer text,
  time_on_page_seconds integer,
  scroll_depth_pct integer,
  clicked_cta boolean default false
);
create index if not exists idx_landing_views_postcard on landing_page_views(postcard_id);
alter table landing_page_views enable row level security;
create policy "users_own_views" on landing_page_views for select using (
  postcard_id in (select id from postcards where user_id = auth.uid())
);
create policy "service_views" on landing_page_views for all to service_role using (true) with check (true);

-- ═══ leads: add postcard_id FK ═══════════════════════════════════════
alter table leads
  add column if not exists postcard_id uuid references postcards(id) on delete cascade;
create index if not exists idx_leads_postcard on leads(postcard_id);

-- ═══ Data migration: backfill postcards from properties ══════════════
-- For every existing property that was already mailed (has lob_postcard_id OR landing_slug),
-- create a corresponding postcards row and link its lead.
insert into postcards (
  id, property_id, user_id, batch_id,
  lob_postcard_id, lob_expected_delivery_date,
  landing_page_slug, qr_code_url, landing_page_views,
  status, submitted_at, mailed_at, delivered_at,
  suppression_checked_at, created_at
)
select
  gen_random_uuid(),
  p.id, p.profile_id, p.batch_id,
  p.lob_postcard_id,
  p.lob_expected_delivery,
  coalesce(p.landing_slug, substr(encode(gen_random_bytes(6), 'hex'), 1, 12)),
  p.qr_code_url,
  coalesce(p.page_views, 0),
  case
    when p.lob_status = 'delivered' then 'delivered'
    when p.lob_status in ('in_transit', 'processed_for_delivery') then 'mailed'
    when p.lob_status = 'returned_to_sender' then 'returned'
    when p.lob_status = 'created' then 'submitted'
    else 'pending'
  end,
  p.created_at, p.created_at,
  case when p.lob_status = 'delivered' then p.created_at else null end,
  p.created_at, p.created_at
from properties p
where p.landing_slug is not null
  and not exists (select 1 from postcards pc where pc.property_id = p.id);

-- Backfill leads.postcard_id
update leads l
set postcard_id = pc.id
from postcards pc
where pc.property_id = l.property_id
  and l.postcard_id is null;
