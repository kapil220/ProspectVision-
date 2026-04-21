-- ─────────────────────────────────────────────────────────────────────
-- 0005_profile_trigger_repair.sql
-- Full repair of the signup → profile flow. Idempotent — safe to run
-- multiple times. Run the whole file in the Supabase SQL Editor.
-- ─────────────────────────────────────────────────────────────────────

-- 1. Drop and recreate the trigger + function from scratch, with an
--    explicit search_path (required by Supabase for SECURITY DEFINER).
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user() cascade;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles(id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', ''));
  return new;
exception
  when others then
    -- Log but do not block signup. auth.users will still be created.
    raise warning 'handle_new_user failed for %: %', new.id, sqlerrm;
    return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 2. Ensure the RLS INSERT policy exists so the trigger (and the
--    authenticated user themselves) can insert their own row.
drop policy if exists "allow_trigger_profile_insert" on public.profiles;
create policy "allow_trigger_profile_insert" on public.profiles
  for insert
  with check (auth.uid() is null or auth.uid() = id);

-- 3. Grant execute so Supabase auth can call the function.
grant execute on function public.handle_new_user() to postgres, anon, authenticated, service_role;

-- 4. Backfill any auth.users that are missing a profile row.
insert into public.profiles(id, email, full_name)
select u.id, u.email, coalesce(u.raw_user_meta_data->>'full_name', '')
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null;

-- 5. Diagnostic — should return a row if everything is in place.
select
  (select count(*) from auth.users) as auth_users,
  (select count(*) from public.profiles) as profile_rows,
  (select exists(
     select 1 from pg_trigger where tgname = 'on_auth_user_created'
   )) as trigger_exists,
  (select exists(
     select 1 from pg_policies
     where schemaname = 'public'
       and tablename = 'profiles'
       and policyname = 'allow_trigger_profile_insert'
   )) as insert_policy_exists;
