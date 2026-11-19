/**
 * MVP voting data layer: every read and write the card needs, in one place.
 *
 * It follows src/lib/attendance.js on purpose, because a vote is the same kind
 * of fact an attendance answer is: DECLARED by a device, never authenticated
 * (the site has no accounts), and corrected by people rather than by code. So
 * the same shapes come back:
 *   * `client()` is imported from ./supabase.js, so with no backend configured
 *     every call rejects with `BackendUnavailable` and the card can stay silent;
 *   * failures are wrapped by `fail()`, which keeps Supabase's `code`;
 *   * the match row is materialised by the same `ensure_match()` RPC, imported
 *     instead of copied, so this file cannot drift from the attendance one.
 *
 * Two rules live here and not in the component:
 *   * the CANDIDATES are the whole squad minus the reader. Eligibility is not
 *     the declared attendance list: the club keeps that list by hand and a gap
 *     would lock a player out of a vote he played in;
 *   * the TALLY is ordered by votes, ties broken by name, which is the same
 *     order the site already uses in src/data/club-record.js.
 *
 * Nothing in this file imports the synced JSON (competition.json, teamData.json)
 * on purpose: those imports carry a JSON import attribute the Node test runner
 * does not get from Vite, and the pure logic below has to be testable offline.
 * The caller hands over the fixture and the squad it already has.
 */
import { client, isConfigured } from "./supabase.js";
import { ensureMatch } from "./attendance.js";

export { isConfigured };

/** Supabase errors carried as plain Error, with the original code kept. */
function fail(error) {
  const wrapped = new Error(error?.message ?? "Supabase request failed");
  wrapped.code = error?.code;
  wrapped.cause = error;
  return wrapped;
}

/**
 * The identity a vote is stored under: the squad id of teamData.json as text.
 *
 * Text and not a number because it is a token that is only ever compared to
 * another token, never counted; `null` when nobody is bound to the device.
 */
export const voterSlug = (playerId) => (playerId == null ? null : String(playerId));

/**
 * The key that names a match across syncs: competition + matchday.
 *
 * `competition.json` is rewritten by `scripts/sync-competition.mjs`, so a key
 * made of a kickoff, an id or a date can change under a fixture that did not.
 * The competition key and the matchday cannot: they are the round the source
 * publishes, so the same fixture answers the same key on every run.
 *
 * This is the CLIENT's key, used to decide when the card reloads. The row in
 * Postgres is keyed `(season, competition, matchday)` — the season is added by
 * `ensure_match()`, because only the database has to survive a new season.
 */
export function matchKey(fixture) {
  const competition = fixture?.competitionKey;
  const matchday = fixture?.matchday;
  if (!competition || matchday == null) return null;
  return `${competition}:${matchday}`;
}

/**
 * Everyone the reader may vote for: the whole squad except himself.
 *
 * `voterId` null (nobody bound) returns the full squad; the card never renders
 * in that state, but a pure function should still answer for it.
 */
export function candidates(squad, voterId) {
  const self = voterSlug(voterId);
  return squad.filter((player) => voterSlug(player.id) !== self);
}

/**
 * Votes per candidate, most voted first.
 *
 * `votes` is what the table returns — one row per vote, each carrying
 * `candidate_slug` — and `squad` is the roster that turns a slug into a face.
 * Ties break by name, the same way `perPlayerAttendance()` and `scorers()` do in
 * src/data/club-record.js, so two cards never rank the same numbers differently.
 *
 * A vote for someone who is no longer in teamData.json cannot be shown: the
 * roster is the only source of who exists, and inventing a row for an id that no
 * card can name would be a name made up by the tally.
 */
export function tally(votes, squad) {
  const bySlug = new Map(squad.map((player) => [voterSlug(player.id), player]));
  const counts = new Map();

  for (const vote of votes ?? []) {
    const slug = vote?.candidate_slug;
    if (!slug || !bySlug.has(slug)) continue;
    counts.set(slug, (counts.get(slug) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([slug, count]) => ({ ...bySlug.get(slug), votes: count }))
    .sort((a, b) => b.votes - a.votes || a.name.localeCompare(b.name));
}

/**
 * The row of `public.matches` this fixture already has, or the one it gets now.
 *
 * Same call the attendance block makes, from the same fixture, so a vote and an
 * attendance answer written on the same night land on the same row. `kickoff`
 * and `rival` are only metadata `ensure_match()` fills when it has to; they are
 * read off the fixture here (not through competition.js) because this module
 * stays free of the synced JSON. `clubSlug` is passed by the caller for the same
 * reason: the rival is the other side of the fixture, and which side is ours is
 * a fact of the fixture object, not of this module.
 */
export async function ensureMatchRow({ fixture, season, clubSlug }) {
  if (!matchKey(fixture)) {
    throw new Error("Ese partido no dice a qué jornada pertenece, así que no hay dónde votar.");
  }

  const atHome = fixture.home?.slug === clubSlug;
  const kickoff = fixture.date ? `${fixture.date}T${fixture.time ?? "00:00"}:00` : null;
  const rival = atHome ? fixture.away?.name : fixture.home?.name;

  return ensureMatch({
    season,
    competition: fixture.competitionKey,
    matchday: fixture.matchday,
    kickoff,
    rival: rival ?? null,
  });
}

/** Every vote of one match, for the tally. One row per voter. */
export async function fetchTally(matchId) {
  const db = await client();
  const { data, error } = await db
    .from("mvp_votes")
    .select("candidate_slug")
    .eq("match_id", matchId);
  if (error) throw fail(error);
  return data ?? [];
}

/**
 * The candidate this device already voted for on this match, or `null`.
 *
 * The vote is remembered by the backend and not only in the tab, so "you already
 * voted" survives a reload and a second phone with the same declared player.
 */
export async function fetchMyVote(matchId, voterId) {
  const self = voterSlug(voterId);
  if (!self) return null;
  const db = await client();
  const { data, error } = await db
    .from("mvp_votes")
    .select("candidate_slug")
    .eq("match_id", matchId)
    .eq("voter_slug", self)
    .maybeSingle();
  if (error) throw fail(error);
  return data?.candidate_slug ?? null;
}

/**
 * Casts or replaces this device's vote for one match.
 *
 * Upsert on `(match_id, voter_slug)` — the unique key in supabase/mvp.sql — so
 * changing your MVP is the same request as voting for the first time, and one
 * reader can never pile up two votes on one match. Voting for yourself is
 * refused here AND by a check constraint, because a UI that only hides the
 * button is not a rule.
 */
export async function castVote({ matchId, voterId, candidateId }) {
  const voter = voterSlug(voterId);
  const candidate = voterSlug(candidateId);
  if (!voter) throw new Error("Elige quién eres para votar.");
  if (!candidate) throw new Error("Elige un jugador al que votar.");
  if (voter === candidate) throw new Error("No puedes votarte a ti mismo.");

  const db = await client();
  const { error } = await db.from("mvp_votes").upsert(
    {
      match_id: matchId,
      voter_slug: voter,
      candidate_slug: candidate,
      // One column for "when this vote was last stated", so a changed vote is
      // dated by the change and not by the first click.
      updated_at: new Date().toISOString(),
    },
    { onConflict: "match_id,voter_slug" },
  );
  if (error) throw fail(error);
}
