import test from "node:test";
import assert from "node:assert/strict";

/**
 * The pure half of MVP voting: who may be voted for, how a fixture is named
 * across syncs, and in which order the votes are printed.
 *
 * No DOM and no network: the component and the backend need Supabase, a browser
 * and a project, and none of that exists in a test run. So this file guards the
 * three decisions that are made in plain JavaScript and are the ones a reviewer
 * of the feature would argue about:
 *
 *   * the candidate list is the WHOLE squad minus the reader — never the declared
 *     attendance list, which the club keeps by hand;
 *   * the match key is the same for the same fixture on every call, because a card
 *     that reloads must not invent a second match;
 *   * the tally ranks by votes and breaks ties by name, the way the site ranks
 *     everything else.
 */

const { matchKey, candidates, tally, voterSlug, ensureMatchRow } = await import(
  "../src/lib/mvp.js"
);

/** The shape `competition.js` hands to a card: a synced fixture plus its round. */
const playedLeague = {
  competitionKey: "league",
  competitionName: "3ª Divisió Grup B",
  matchday: 3,
  date: "2026-11-08",
  time: "22:30",
  status: "played",
  home: { slug: "acfrio", name: "AC FRÍO" },
  away: { slug: "francesco", name: "L'AUTENTICO" },
  score: { home: 3, away: 1 },
};

const playedCup = { ...playedLeague, competitionKey: "cup", matchday: 1 };

/** A roster just big enough to have the reader and someone else in it. */
const squad = [
  { id: 1, name: "Pablo", photo: "/assets/players/pablo.png" },
  { id: 2, name: "Nil", photo: "/assets/players/nil.png" },
  { id: 3, name: "Martí", photo: "/assets/players/marti.png" },
  { id: 7, name: "Albert", photo: "/assets/players/albert.png" },
  { id: 11, name: "Ander", photo: "/assets/players/ander.png" },
  { id: 15, name: "Genís", photo: "/assets/players/genis.png" },
];

// ---------------------------------------------------------------------------
// Candidates: the whole squad, minus the reader
// ---------------------------------------------------------------------------

test("the reader is not in his own candidate list", () => {
  const options = candidates(squad, 3);
  assert.equal(options.some((player) => player.id === 3), false, "Martí voted himself in");
  assert.equal(options.length, squad.length - 1, "everyone else must stay reachable");
});

test("every squad member is a candidate, not only the declared attendance", () => {
  // The club maintains the attendance list by hand, so a missing name must never
  // lock a player out of the vote: the roster is the only filter here.
  const options = candidates(squad, 1);
  assert.deepEqual(
    options.map((player) => player.id),
    [2, 3, 7, 11, 15],
  );
  for (const player of options) {
    assert.equal("status" in player, false, "candidates must not be filtered by attendance");
  }
});

test("an unbound device sees the whole squad, and its slug is nothing", () => {
  assert.equal(voterSlug(null), null);
  assert.equal(candidates(squad, null).length, squad.length);
  // The identity is carried as a token, compared to another token, never counted.
  assert.equal(voterSlug(7), "7");
});

// ---------------------------------------------------------------------------
// Match key: competition + matchday, stable across calls
// ---------------------------------------------------------------------------

test("the match key is the same for the same fixture across calls", () => {
  const first = matchKey(playedLeague);
  const second = matchKey({ ...playedLeague });
  assert.equal(first, second, "the same round must answer the same key");
  assert.equal(first, "league:3");
});

test("another competition or another matchday is another match", () => {
  assert.notEqual(matchKey(playedLeague), matchKey(playedCup));
  assert.notEqual(matchKey(playedLeague), matchKey({ ...playedLeague, matchday: 4 }));
  // A changed kickoff or score is the same round, so the key must not move.
  assert.equal(matchKey({ ...playedLeague, time: "21:00", score: { home: 0, away: 2 } }), "league:3");
});

test("a fixture with no round has no key, so there is nowhere to vote", () => {
  assert.equal(matchKey(null), null);
  assert.equal(matchKey({}), null);
  assert.equal(matchKey({ competitionKey: "league" }), null);
  assert.equal(matchKey({ matchday: 3 }), null);
});

test("a fixture with no key is refused before any request is made", async () => {
  await assert.rejects(ensureMatchRow({ fixture: {}, season: "2026-2027", clubSlug: "acfrio" }), {
    message: /no dice a qué jornada pertenece/,
  });
});

// ---------------------------------------------------------------------------
// Tally: votes first, names on a tie
// ---------------------------------------------------------------------------

const vote = (candidateId) => ({ candidate_slug: String(candidateId) });

test("the tally counts the votes and ranks the most voted first", () => {
  const rows = tally([vote(2), vote(2), vote(2), vote(11), vote(7)], squad);
  assert.deepEqual(
    rows.map((row) => [row.name, row.votes]),
    [
      ["Nil", 3],
      ["Albert", 1],
      ["Ander", 1],
    ],
  );
});

test("ties break by name, the way the rest of the site breaks them", () => {
  // club-record.js sorts `b.count - a.count || a.name.localeCompare(b.name)`.
  const rows = tally([vote(11), vote(7), vote(15)], squad);
  assert.deepEqual(
    rows.map((row) => row.name),
    ["Albert", "Ander", "Genís"],
  );
  assert.deepEqual(
    rows.map((row) => row.votes),
    [1, 1, 1],
  );
});

test("votes for a player who left the roster cannot be printed", () => {
  // teamData.json is the only source of who exists; the tally never invents a
  // name for an id no card can show.
  const rows = tally([vote(2), vote(99), { candidate_slug: null }, {}], squad);
  assert.deepEqual(
    rows.map((row) => row.name),
    ["Nil"],
  );
});

test("no votes is an empty tally, never a placeholder ranking", () => {
  assert.deepEqual(tally([], squad), []);
  assert.deepEqual(tally(null, squad), []);
});

test("a candidate with no votes does not appear at all", () => {
  const rows = tally([vote(2)], squad);
  assert.equal(rows.length, 1);
  assert.equal(rows.some((row) => row.votes === 0), false);
});

test("the tally carries the face of the player it ranks", () => {
  const [row] = tally([vote(2)], squad);
  assert.equal(row.id, 2);
  assert.equal(row.photo, "/assets/players/nil.png");
});
