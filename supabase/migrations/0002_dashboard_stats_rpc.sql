-- Dashboard aggregate stats — one round trip instead of five.
create or replace function get_dashboard_stats(p_user_id uuid)
returns json
language plpgsql
security definer
as $$
begin
  return json_build_object(
    'total_sent', (
      select count(*) from properties
      where profile_id = p_user_id and lob_status != 'not_mailed'
    ),
    'pipeline_value', (
      select coalesce(sum(quote_amount), 0) from leads
      where profile_id = p_user_id
        and current_stage not in ('closed_won', 'closed_lost')
    ),
    'closed_revenue', (
      select coalesce(sum(deal_value), 0) from leads
      where profile_id = p_user_id and current_stage = 'closed_won'
    ),
    'total_won', (
      select count(*) from leads
      where profile_id = p_user_id and current_stage = 'closed_won'
    ),
    'total_quoted', (
      select count(*) from leads
      where profile_id = p_user_id
        and current_stage in ('quoted', 'closed_won', 'closed_lost')
    )
  );
end;
$$;

grant execute on function get_dashboard_stats(uuid) to authenticated;
