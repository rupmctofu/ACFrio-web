-- AC FRÍO · storage for the scanned actas
--
-- Run this AFTER supabase/schema.sql, in the same SQL Editor.
--
-- It is separate on purpose. Everything in schema.sql belongs to your own
-- `public` schema; this file touches `storage.objects`, a table owned by
-- Supabase's internal roles. Some projects reject those statements from the SQL
-- Editor ("must be owner of table objects" / "permission denied for schema
-- storage"), and when that happens the rest of the setup must not be held
-- hostage by it.
--
-- If this file fails, do the same thing from the interface instead:
--   Storage → New bucket → name: actas, Public: OFF
--   Storage → actas → Policies → New policy → For full customization
--   Paste the USING / WITH CHECK expression of each policy below.
--
-- All four need the owner check from schema.sql (public.is_owner()), so run
-- schema.sql first either way.

-- The bucket must be private, always. `do nothing` would leave a bucket that
-- someone created earlier with Public ON exactly as it was — every scan
-- readable by anyone who guesses the URL — so the conflict branch pins the
-- invariant instead of skipping it.
insert into storage.buckets (id, name, public)
values ('actas', 'actas', false)
on conflict (id) do update set public = false;

-- Read: only the owner, so a scan is never public.
drop policy if exists actas_object_owner_read on storage.objects;
create policy actas_object_owner_read on storage.objects
  for select to authenticated
  using (bucket_id = 'actas' and public.is_owner());

-- File a scan.
drop policy if exists actas_object_owner_write on storage.objects;
create policy actas_object_owner_write on storage.objects
  for insert to authenticated
  with check (bucket_id = 'actas' and public.is_owner());

-- Replace a scan that was the wrong sheet.
drop policy if exists actas_object_owner_update on storage.objects;
create policy actas_object_owner_update on storage.objects
  for update to authenticated
  using (bucket_id = 'actas' and public.is_owner())
  with check (bucket_id = 'actas' and public.is_owner());

-- Remove a bad or duplicated scan. Without this the owner can never delete one.
drop policy if exists actas_object_owner_delete on storage.objects;
create policy actas_object_owner_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'actas' and public.is_owner());
