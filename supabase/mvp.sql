-- AC FRÍO · MVP voting schema
--
-- Run this once in the Supabase SQL editor, AFTER supabase/schema.sql: the vote
-- points at a row of `public.matches` and the owner policy reuses
-- `public.is_owner()`, so both have to exist already.
--
-- Like schema.sql it is written to be re-runnable: the table is created only if
-- absent and every policy is dropped before being recreated.
--
-- Why there is no real authentication here:
--   The site has no accounts. A player says who he is by tapping his face or
--   typing the club code, and that answer lives in the device's localStorage —
--   it is a convenience, not a credential (src/lib/identity.js). So a vote is
--   DECLARATIVE, exactly like an attendance answer: the client states the voter
--   and the database records it. Nothing here can prove the person holding the
--   phone is the player he claims to be, and pretending otherwise would be a
--   security claim the system cannot back. The honest framing is the same one
--   the attendance tables use (see `attendance_declare` in schema.sql), and the
--   club accepted it knowingly: this is a vote inside a group of fifteen.
--
-- What the constraints DO buy, being only about the shape of a row:
--   * one vote per voter per match (the unique key), so "change your mind" is an
--     upsert instead of a growing list of clicks;
--   * no self-vote: a row whose voter and candidate are the same person is
--     refused by the database, not only hidden by the UI.

-- ---------------------------------------------------------------------------
-- Votes
-- ---------------------------------------------------------------------------

create table if not exists public.mvp_votes (
  id bigint generated always as identity primary key,
  match_id bigint not null references public.matches (id) on delete cascade,
  -- The identity the device declared, as text: the squad id of teamData.json,
  -- which is also what `attendance.player_id` records. Text and not an integer
  -- because it is an opaque token, never arithmetic, and because it is compared
  -- to another token below; a squad is a static file, so there is no referenced
  -- table and no foreign key, exactly as in `attendance`.
  voter_slug text not null,
  candidate_slug text not null,
  updated_at timestamptz not null default now(),
  -- The database can only check what the row says, not who sent it (see the
  -- note at the top). It can still refuse the one answer that is never valid.
  constraint mvp_votes_voter_differs check (voter_slug <> candidate_slug),
  -- One live vote per voter and match: this is the conflict target the client
  -- upserts on, so changing your MVP replaces your previous one.
  constraint mvp_votes_one_per_voter unique (match_id, voter_slug)
);

comment on table public.mvp_votes is
  'One declarative MVP vote: who voted for whom, on which match. No accounts, so the voter is declared by the client.';

comment on column public.mvp_votes.voter_slug is
  'teamData.json squad id of the voter, as text. Declared by the device, not authenticated.';

comment on column public.mvp_votes.candidate_slug is
  'teamData.json squad id of the player voted for. The whole squad is eligible, never only the declared attendance list.';

-- The tally and "have I voted yet" both read by match, newest rows irrelevant:
-- one index on match_id serves both.
create index if not exists mvp_votes_match_idx on public.mvp_votes (match_id);

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------
-- Reads are open because the tally is made of them: what the card prints is the
-- count of rows per candidate, and there is no aggregate view to hide behind —
-- inventing one would only move the same data one step away. Everybody may also
-- cast and change a vote, because nobody can be told apart from anybody else.

alter table public.mvp_votes enable row level security;

-- The tally: every row of a match is read to count the votes.
drop policy if exists mvp_votes_read on public.mvp_votes;
create policy mvp_votes_read on public.mvp_votes
  for select to anon, authenticated using (true);

-- A first vote. The check is repeated here so a self-vote is refused even if
-- the table constraint were ever dropped or renamed.
drop policy if exists mvp_votes_cast on public.mvp_votes;
create policy mvp_votes_cast on public.mvp_votes
  for insert to anon, authenticated
  with check (voter_slug <> candidate_slug);

-- Changing your mind: the client upserts on (match_id, voter_slug), which is an
-- UPDATE for a row that already exists. Marking a vote for someone else's row is
-- accepted by design, for the same reason attendance is: there is no account to
-- tie a row to, and the group is fifteen people.
drop policy if exists mvp_votes_change on public.mvp_votes;
create policy mvp_votes_change on public.mvp_votes
  for update to anon, authenticated
  using (true) with check (voter_slug <> candidate_slug);

-- The owner keeps the manual door the other tables have: delete a vote that is
-- plainly a joke, or fix one by hand from the panel.
drop policy if exists mvp_votes_owner_write on public.mvp_votes;
create policy mvp_votes_owner_write on public.mvp_votes
  for all to authenticated using (public.is_owner()) with check (public.is_owner());

-- ---------------------------------------------------------------------------
-- Nothing else. A vote does not create its match: `public.ensure_match()` in
-- schema.sql already materialises the row from the synced fixture, and this file
-- reuses it instead of keeping a second copy of the season/competition/matchday
-- shape.
-- ---------------------------------------------------------------------------
