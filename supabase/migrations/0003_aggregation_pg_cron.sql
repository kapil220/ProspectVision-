-- ═══════════════════════════════════════════════════════════════════
-- 0003_aggregation_pg_cron.sql
-- Nightly aggregation of conversion_events → geo_performance and
-- geo_performance → niche_benchmarks, scheduled via pg_cron.
--
-- Prereq: Supabase Dashboard → Database → Extensions → pg_cron → Enable
-- (or `CREATE EXTENSION IF NOT EXISTS pg_cron;` with superuser role)
-- ═══════════════════════════════════════════════════════════════════

create extension if not exists pg_cron;

-- ═══ aggregate_geo_performance ═══════════════════════════════════════
-- Rolls conversion_events up to (zip_code, niche). Upserts so re-runs
-- are idempotent. Averages deal_value only for leads that closed won.
create or replace function aggregate_geo_performance()
returns void
language plpgsql
security definer
as $$
begin
  insert into geo_performance(
    zip_code, niche, total_sent, total_delivered,
    total_responded, total_closed, avg_deal_value,
    response_rate, close_rate, updated_at
  )
  select
    p.zip,
    ce.niche,
    count(distinct case when ce.to_stage = 'postcard_sent' then ce.property_id end)::int,
    count(distinct case when ce.to_stage = 'delivered'     then ce.property_id end)::int,
    count(distinct case when ce.to_stage = 'responded'     then ce.property_id end)::int,
    count(distinct case when ce.to_stage = 'closed_won'    then ce.property_id end)::int,
    avg(case when l.current_stage = 'closed_won' then l.deal_value end),
    case
      when count(case when ce.to_stage = 'delivered' then 1 end) > 0
        then count(case when ce.to_stage = 'responded' then 1 end)::float4
           / count(case when ce.to_stage = 'delivered' then 1 end)::float4
      else 0
    end,
    case
      when count(case when ce.to_stage = 'responded' then 1 end) > 0
        then count(case when ce.to_stage = 'closed_won' then 1 end)::float4
           / count(case when ce.to_stage = 'responded' then 1 end)::float4
      else 0
    end,
    now()
  from conversion_events ce
  join properties p on ce.property_id = p.id
  left join leads l on l.property_id = p.id
  where ce.niche is not null
    and p.zip is not null
  group by p.zip, ce.niche
  on conflict (zip_code, niche) do update set
    total_sent      = excluded.total_sent,
    total_delivered = excluded.total_delivered,
    total_responded = excluded.total_responded,
    total_closed    = excluded.total_closed,
    avg_deal_value  = excluded.avg_deal_value,
    response_rate   = excluded.response_rate,
    close_rate      = excluded.close_rate,
    updated_at      = excluded.updated_at;
end;
$$;

-- ═══ aggregate_niche_benchmarks ══════════════════════════════════════
-- Rolls geo_performance up to (niche). Drives the platform benchmark
-- widget on the dashboard. sample_size = total postcards mailed.
create or replace function aggregate_niche_benchmarks()
returns void
language plpgsql
security definer
as $$
begin
  insert into niche_benchmarks(
    niche, avg_response_rate, avg_close_rate,
    avg_deal_value, sample_size, updated_at
  )
  select
    niche,
    avg(response_rate),
    avg(close_rate),
    avg(avg_deal_value),
    coalesce(sum(total_sent), 0)::int,
    now()
  from geo_performance
  where niche is not null
  group by niche
  on conflict (niche) do update set
    avg_response_rate = excluded.avg_response_rate,
    avg_close_rate    = excluded.avg_close_rate,
    avg_deal_value    = excluded.avg_deal_value,
    sample_size       = excluded.sample_size,
    updated_at        = excluded.updated_at;
end;
$$;

-- ═══ Schedules ═══════════════════════════════════════════════════════
-- Drop prior schedules so this migration is re-runnable.
do $$
begin
  perform cron.unschedule(jobid)
  from cron.job
  where jobname in ('geo-agg', 'benchmarks');
exception
  when undefined_table then
    -- pg_cron not installed in local/test env; skip silently.
    null;
end;
$$;

select cron.schedule('geo-agg',    '0 2 * * *',  $$select aggregate_geo_performance()$$);
select cron.schedule('benchmarks', '30 2 * * *', $$select aggregate_niche_benchmarks()$$);
