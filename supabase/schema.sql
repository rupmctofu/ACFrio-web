-- AC FRÍO · match attendance schema
--
-- Run this once in the Supabase SQL editor of the project, after creating it.
-- It is written to be re-runnable: every object is created only if absent, and
-- every policy is dropped before being recreated.
--
-- Model, and why it looks like this:
--   * The squad itself is NOT duplicated here. Names, shirt numbers and photos
--     live in src/data/teamData.json and are resolved on the client by id, so
--     there is one source of truth for who the players are.
--   * `attendance` holds what the group DECLARES before the match.
--   * `actas` holds the referee's scanned sheet, which is EVIDENCE. Nothing
--     infers attendance from the image: the owner reconciles by hand, and
--     `matches.closed_at` records that the list was checked against the paper.

-- ---------------------------------------------------------------------------
-- Owner allow-list
-- ---------------------------------------------------------------------------

create table if not exists public.admins (
  email text primary key,
  created_at timestamptz not null default now()
);

comment on table public.admins is
  'Supabase Auth addresses allowed to file actas and close matches. Add the owner email here.';

-- ---------------------------------------------------------------------------
-- Matches
-- ---------------------------------------------------------------------------

create table if not exists public.matches (
  id bigint generated always as identity primary key,
  season text not null,
  competition text not null check (competition in ('league', 'cup')),
  matchday integer not null check (matchday > 0),
  kickoff timestamptz,
  rival text,
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  -- The season is part of the key on purpose: without it, next season's cup
  -- matchday 1 would reuse this season's row, its answers and its acta.
  unique (season, competition, matchday)
);

comment on column public.matches.closed_at is
  'Set by the owner once the declared list was checked against the acta.';

-- ---------------------------------------------------------------------------
-- Declared attendance
-- ---------------------------------------------------------------------------

create table if not exists public.attendance (
  id bigint generated always as identity primary key,
  match_id bigint not null references public.matches (id) on delete cascade,
  player_id integer not null,
  status text not null check (status in ('in', 'out')),
  updated_at timestamptz not null default now(),
  unique (match_id, player_id)
);

comment on column public.attendance.player_id is
  'teamData.json squad id. Not a foreign key on purpose: the squad is a static file.';

create index if not exists attendance_match_idx on public.attendance (match_id);

-- ---------------------------------------------------------------------------
-- Actas: the scanned referee sheet
-- ---------------------------------------------------------------------------

create table if not exists public.actas (
  match_id bigint primary key references public.matches (id) on delete cascade,
  storage_path text not null,
  uploaded_by text,
  uploaded_at timestamptz not null default now(),
  reviewed_at timestamptz,
  notes text
);

comment on table public.actas is
  'One scanned referee sheet per match. storage_path points into the private actas bucket.';

-- ---------------------------------------------------------------------------
-- Match materialisation
-- ---------------------------------------------------------------------------
-- Fixtures come from competition.json, so the app never seeds matches in bulk.
-- When someone first declares for a fixture, this creates (or reuses) its row.
-- It is security definer so anon never needs an INSERT grant on `matches`, and
-- it can only ever touch kickoff/rival, never closed_at.

create or replace function public.ensure_match(
  p_season text,
  p_competition text,
  p_matchday integer,
  p_kickoff timestamptz default null,
  p_rival text default null
)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id bigint;
begin
  insert into public.matches (season, competition, matchday, kickoff, rival)
  values (p_season, p_competition, p_matchday, p_kickoff, p_rival)
  on conflict (season, competition, matchday) do update
    -- The existing row is referenced by table name, unqualified: a
    -- schema-qualified reference (public.matches.kickoff) is not valid in the
    -- DO UPDATE clause and would make every attendance write fail.
    set kickoff = coalesce(matches.kickoff, excluded.kickoff),
        rival = coalesce(matches.rival, excluded.rival)
  returning id into v_id;
  return v_id;
end;
$$;

revoke all on function public.ensure_match(text, text, integer, timestamptz, text) from public;
grant execute on function public.ensure_match(text, text, integer, timestamptz, text) to anon, authenticated;

-- The one thing a player may know about an acta is whether it exists and has
-- been checked. The scan itself stays private, so anon never reads `actas`.

create or replace function public.acta_state(p_match_id bigint)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select case when a.reviewed_at is not null then 'reviewed' else 'pending' end
       from public.actas a where a.match_id = p_match_id),
    'none'
  );
$$;

revoke all on function public.acta_state(bigint) from public;
grant execute on function public.acta_state(bigint) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------

alter table public.admins enable row level security;
alter table public.matches enable row level security;
alter table public.attendance enable row level security;
alter table public.actas enable row level security;

-- The owner check, in one place, so every policy reads the same way.
create or replace function public.is_owner()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admins where email = (auth.jwt() ->> 'email')
  );
$$;

-- admins: nobody reads it from the client; only the SQL editor touches it.
drop policy if exists admins_no_client_access on public.admins;
create policy admins_no_client_access on public.admins
  for all to anon, authenticated using (false) with check (false);

-- matches: everyone reads, only the owner writes.
drop policy if exists matches_read on public.matches;
create policy matches_read on public.matches
  for select to anon, authenticated using (true);

drop policy if exists matches_owner_write on public.matches;
create policy matches_owner_write on public.matches
  for all to authenticated using (public.is_owner()) with check (public.is_owner());

-- attendance: everyone reads (the list is the point), everyone may declare their
-- own answer, only the owner may close the match. Marking for someone else is
-- accepted by design (owner decision L3); the acta is what corrects it.
drop policy if exists attendance_read on public.attendance;
create policy attendance_read on public.attendance
  for select to anon, authenticated using (true);

drop policy if exists attendance_declare on public.attendance;
create policy attendance_declare on public.attendance
  for insert to anon, authenticated with check (true);

drop policy if exists attendance_change on public.attendance;
create policy attendance_change on public.attendance
  for update to anon, authenticated using (true) with check (true);

drop policy if exists attendance_owner_write on public.attendance;
create policy attendance_owner_write on public.attendance
  for all to authenticated using (public.is_owner()) with check (public.is_owner());

-- actas: only the owner reads the rows (they carry the storage path). Everyone
-- else learns the state from public.acta_state(), never from the table.
drop policy if exists actas_read on public.actas;
create policy actas_read on public.actas
  for select to authenticated using (public.is_owner());

drop policy if exists actas_owner_write on public.actas;
create policy actas_owner_write on public.actas
  for all to authenticated using (public.is_owner()) with check (public.is_owner());

-- ---------------------------------------------------------------------------
-- Storage lives in supabase/storage.sql, on purpose: it touches a table owned by
-- Supabase's internal roles, and a failure there must not stop this file.
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- Owner setup, run by hand once (replace the address):
--
--   insert into public.admins (email) values ('owner@example.com')
--     on conflict (email) do nothing;
--
-- Then sign in on the site with that address: Supabase sends a magic link and
-- no password is ever created.
-- ---------------------------------------------------------------------------
