-- Allow the handle_new_user() trigger to insert into profiles.
-- Without this, the trigger fails because RLS WITH CHECK evaluates
-- auth.uid() as NULL inside the auth.signup transaction, rolling
-- the signup back with "Database error saving new user".
--
-- Permits trigger context (auth.uid() is null) and self-inserts only,
-- so authenticated PostgREST clients cannot create profile rows for
-- other users.

create policy "allow_trigger_profile_insert" on profiles
  for insert
  with check (auth.uid() is null or auth.uid() = id);
