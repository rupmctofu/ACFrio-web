import test from "node:test";
import assert from "node:assert/strict";

/**
 * The achievements catalogue and its evaluator.
 *
 * The one rule these tests protect: an achievement is never unlocked without
 * evidence in the data. So every test below hands the evaluator a season and
 * asks which ids come out — never the wording of a title — and the interesting
 * cases are the ones where the data is close to a trophy but not there yet: a
 * four-goal match for the five-goal entry, a margin of one for "win by two", a
 * win against a fixture the source never marked played, a completed attendance
 * in the middle of the season, no votes at all.
 *
 * It also guards the other direction the owner asked for by name: "Máximo
 * goleador" and "Asistencia perfecta" stay locked until the season is over,
 * however complete the numbers already look.
 */

const {
  achievements,
  teamAchievements,
  playerAchievements,
  evaluateAchievements,
  seasonFacts,
  achievementById,
  CLUB_SLUG,
} = await import("../src/data/achievements.js");

// ---------------------------------------------------------------------------
// Builders: the shapes src/data/competition.js and src/data/club-record.json
// already publish, with the club's own goals given as `own` / `against` so a
// test never has to work out which side of the score is ours.
// ---------------------------------------------------------------------------

const CLUB = { slug: CLUB_SLUG, name: "AC FRÍO" };

const rivalOf = (slug) => ({ slug, name: slug.replace(/-/g, " ").toUpperCase() });

function match({
  competitionKey = "league",
  matchday = 1,
  date = "2026-11-01",
  venue = "home",
  rival = rivalOf("el-templo"),
  own = 0,
  against = 0,
  status = "played",
} = {}) {
  const home = venue === "home" ? CLUB : rival;
  const away = venue === "home" ? rival : CLUB;
  const scored =
    status === "played" && venue === "home"
      ? { home: own, away: against }
      : status === "played"
        ? { home: against, away: own }
        : null;
  return { competitionKey, matchday, date, time: "22:30", status, home, away, score: scored };
}

/** A fixture the source still lists as scheduled: no score, proves nothing. */
const pending = (options = {}) => match({ ...options, status: "scheduled" });

const day = (n) => `2026-11-${String(n).padStart(2, "0")}`;

const recordOf = ({ scorers = [], cards = [], attendance = [] } = {}) => ({
  scorers,
  cards,
  attendance,
});

const sheet = (competition, matchday, players) => ({ competition, matchday, players });

const squadOf = (size) =>
  Array.from({ length: size }, (_, index) => ({
    id: index + 1,
    name: `Jugador ${index + 1}`,
    number: index + 2,
  }));

const namesOf = (size, prefix = "Jugador") =>
  Array.from({ length: size }, (_, index) => `${prefix} ${index + 1}`);

const teamUnlocked = (input) => evaluateAchievements(input).team.unlocked;
const playerUnlocked = (input) => evaluateAchievements(input).player.unlocked;

// ---------------------------------------------------------------------------
// The catalogue itself
// ---------------------------------------------------------------------------

test("the catalogue is two scopes, one entry per id", () => {
  assert.equal(achievements.length, teamAchievements.length + playerAchievements.length);

  const ids = achievements.map((entry) => entry.id);
  assert.equal(new Set(ids).size, ids.length, "two entries share an id");

  for (const entry of achievements) {
    assert.ok(["team", "player"].includes(entry.scope), `${entry.id} has no scope`);
    assert.equal(typeof entry.title, "string");
    assert.ok(entry.title.length > 0, `${entry.id} has no title`);
    assert.ok(entry.description.length > 0, `${entry.id} has no description`);
    assert.equal(typeof entry.icon, "string");
    assert.equal(typeof entry.test, "function");
  }

  assert.deepEqual(
    achievements.map((entry) => entry.id),
    [...teamAchievements.map((entry) => entry.id), ...playerAchievements.map((entry) => entry.id)],
    "the combined list must not reorder the scopes",
  );
  assert.equal(achievementById("player-top-scorer").scope, "player");
  assert.equal(achievementById("no-such-achievement"), null);
});

test("every icon exists in the installed react-icons Remix set", async () => {
  // The icon is a name, not an import, so the catalogue stays testable without a
  // bundler; this is what stops a rename in a Remix upgrade from rendering a
  // blank square on the shelf. The catalogue keeps its own names (`Trophy`,
  // `Goal`), so the name is read through the grid's registry and the two glyphs
  // behind it are looked up in `react-icons/ri` — the library the grid renders.
  const { readFileSync } = await import("node:fs");
  /* One line ending on both sides of the comparison. A Windows checkout holds
     this file with CRLF, and every assertion below matches `\n` literally, so
     the file is normalised on the way in instead of being read as it lies. */
  const source = readFileSync(
    new URL("../src/components/AchievementsGrid.jsx", import.meta.url),
    "utf8",
  ).replace(/\r\n/g, "\n");
  const start = source.indexOf("const PLATE_ICONS = {");
  const end = source.indexOf("};\n", start);
  assert.ok(start !== -1 && end !== -1, "the grid must resolve icon names through PLATE_ICONS");
  const registry = source.slice(start, end);

  const remix = await import("react-icons/ri");
  for (const entry of achievements) {
    const row = registry.match(
      new RegExp(`^ {2}${entry.icon}: \\{ line: (\\w+), fill: (\\w+) \\},$`, "m"),
    );
    assert.ok(row, `${entry.id} names ${entry.icon}, and the grid maps no glyph for it`);
    for (const glyph of [row[1], row[2]]) {
      assert.ok(glyph in remix, `${entry.id} asks for a missing icon: ${glyph}`);
    }
  }
});

test("the two season-end entries say so, and nothing else claims to be one", () => {
  const flagged = achievements.filter((entry) => entry.seasonEnd === true).map((entry) => entry.id);
  assert.deepEqual(flagged, ["player-top-scorer", "player-perfect-attendance"]);

  for (const id of flagged) {
    const entry = achievementById(id);
    assert.match(entry.description, /al final/i, `${id} must say in its own line that it waits`);
  }
});

// ---------------------------------------------------------------------------
// Nothing in, nothing out
// ---------------------------------------------------------------------------

test("an empty input unlocks nothing and does not throw", () => {
  const result = evaluateAchievements();
  assert.deepEqual(result.team.unlocked, []);
  assert.deepEqual(result.player.unlocked, []);
  assert.equal(result.team.unlocked.length + result.team.locked.length, teamAchievements.length);
  assert.equal(result.player.unlocked.length + result.player.locked.length, playerAchievements.length);
  assert.equal(result.team.progress.playedMatches, 0);
  assert.equal(result.team.progress.seasonComplete, false, "an empty season is not a finished one");
});

test("an empty season with every fixture still pending unlocks nothing", () => {
  const fixtures = [pending({ matchday: 1, date: day(1) }), pending({ matchday: 2, date: day(8) })];
  const result = evaluateAchievements({ fixtures });
  assert.deepEqual(result.team.unlocked, []);
  assert.deepEqual(result.player.unlocked, []);
  assert.equal(result.team.progress.seasonComplete, false);
});

test("a fixture with no score proves nothing, even if it says it was played", () => {
  const broken = { ...match({ own: 5, against: 0 }), score: null };
  const halfScored = { ...match({ matchday: 2, own: 5, against: 0 }), score: { home: 5 } };
  const result = evaluateAchievements({ fixtures: [broken, halfScored] });
  assert.deepEqual(result.team.unlocked, []);
  assert.equal(result.team.progress.playedMatches, 0, "an unreadable score is not a result");
});

test("garbage in the optional slots is locked, not a crash", () => {
  const result = evaluateAchievements({
    fixtures: [match({ own: 2, against: 0 })],
    record: { scorers: "nope", cards: null, attendance: {} },
    squad: null,
    votes: "no",
  });
  assert.deepEqual(result.team.unlocked.includes("team-first-win"), true);
  assert.deepEqual(result.player.unlocked, []);
});

// ---------------------------------------------------------------------------
// Team: the first results
// ---------------------------------------------------------------------------

test("a first match played is a first match, a draw and a clean sheet", () => {
  const result = evaluateAchievements({
    fixtures: [match({ own: 0, against: 0 })],
    record: recordOf({}),
  });
  assert.deepEqual(result.team.unlocked, [
    "team-first-match",
    "team-first-draw",
    "team-clean-sheet",
    "team-no-cards",
    // Zero conceded in the one match of a competition that is therefore over.
    "team-fewer-conceded",
  ]);
});

test("a home win unlocks the win, the margin and beating a rival", () => {
  const result = evaluateAchievements({
    fixtures: [match({ own: 2, against: 0 })],
    record: recordOf({}),
  });
  assert.deepEqual(result.team.unlocked, [
    "team-first-match",
    "team-first-goal",
    "team-first-win",
    "team-clean-sheet",
    "team-win-by-two",
    "team-win-home",
    "team-beat-a-rival",
    "team-no-cards",
    // Zero conceded in the one match of a competition that is therefore over.
    "team-fewer-conceded",
  ]);
});

test("scoring in a loss is a goal but not a clean sheet", () => {
  const result = evaluateAchievements({
    fixtures: [match({ venue: "away", own: 1, against: 2 })],
    record: recordOf({}),
  });
  const unlocked = result.team.unlocked;
  assert.ok(unlocked.includes("team-first-goal"));
  assert.equal(unlocked.includes("team-clean-sheet"), false);
  assert.equal(unlocked.includes("team-first-win"), false);
  assert.equal(result.team.progress.cleanSheets, 0);
});

// ---------------------------------------------------------------------------
// Team: goals in a match, and the margin
// ---------------------------------------------------------------------------

test("three goals unlock the three-goal entry even in a cup loss", () => {
  const result = evaluateAchievements({
    fixtures: [match({ competitionKey: "cup", own: 3, against: 4 })],
    record: recordOf({}),
  });
  const unlocked = result.team.unlocked;
  assert.ok(unlocked.includes("team-three-goals"));
  assert.equal(unlocked.includes("team-five-goals"), false);
  assert.equal(unlocked.includes("team-win-by-two"), false, "a loss has no margin");
  assert.equal(unlocked.includes("team-first-cup-win"), false, "scoring is not winning");
  assert.equal(result.team.progress.bestMargin, 0);
});

test("five goals need five, and four are still not enough", () => {
  const four = evaluateAchievements({
    fixtures: [match({ own: 4, against: 0 })],
    record: recordOf({}),
  });
  assert.equal(four.team.unlocked.includes("team-five-goals"), false);
  assert.ok(four.team.unlocked.includes("team-three-goals"));

  const five = evaluateAchievements({
    fixtures: [match({ own: 5, against: 1 })],
    record: recordOf({}),
  });
  assert.ok(five.team.unlocked.includes("team-five-goals"));
  assert.ok(five.team.unlocked.includes("team-win-by-two"));
  assert.equal(five.team.progress.bestScoring, 5);
  assert.equal(five.team.progress.bestMargin, 4);
});

test("a margin of one is not winning by two", () => {
  const one = evaluateAchievements({
    fixtures: [match({ own: 2, against: 1 })],
    record: recordOf({}),
  });
  assert.equal(one.team.unlocked.includes("team-win-by-two"), false);

  const two = evaluateAchievements({
    fixtures: [match({ own: 3, against: 1 })],
    record: recordOf({}),
  });
  assert.ok(two.team.unlocked.includes("team-win-by-two"));
});

// ---------------------------------------------------------------------------
// Team: runs, read in kickoff order and across competitions
// ---------------------------------------------------------------------------

test("two wins in a row count by date, not by the order the array arrives in", () => {
  const fixtures = [
    match({ matchday: 2, date: day(8), own: 0, against: 1 }),
    match({ matchday: 3, date: day(15), own: 1, against: 0 }),
    match({ matchday: 1, date: day(1), own: 2, against: 0 }),
  ];
  const result = evaluateAchievements({ fixtures, record: recordOf({}) });
  assert.equal(result.team.progress.winStreak, 1, "win, loss, win is not two in a row");
  assert.equal(result.team.unlocked.includes("team-two-wins-in-a-row"), false);
});

test("a league win and a cup win on consecutive nights are two wins in a row", () => {
  const fixtures = [
    match({ matchday: 3, date: day(1), own: 1, against: 0 }),
    match({ competitionKey: "cup", matchday: 1, date: day(8), own: 1, against: 0 }),
  ];
  const result = evaluateAchievements({ fixtures, record: recordOf({}) });
  assert.ok(result.team.unlocked.includes("team-two-wins-in-a-row"));
  assert.equal(result.team.progress.winStreak, 2);
});

test("three unbeaten need three: win, win, loss is only two", () => {
  const unfinished = [
    match({ matchday: 1, date: day(1), own: 2, against: 0 }),
    match({ matchday: 2, date: day(8), own: 2, against: 0 }),
    match({ matchday: 3, date: day(15), own: 0, against: 1 }),
  ];
  assert.equal(
    evaluateAchievements({ fixtures: unfinished, record: recordOf({}) }).team.unlocked.includes(
      "team-three-unbeaten",
    ),
    false,
  );

  const unbeaten = [
    match({ matchday: 1, date: day(1), own: 2, against: 0 }),
    match({ matchday: 2, date: day(8), own: 0, against: 0 }),
    match({ matchday: 3, date: day(15), own: 1, against: 0 }),
  ];
  const result = evaluateAchievements({ fixtures: unbeaten, record: recordOf({}) });
  assert.ok(result.team.unlocked.includes("team-three-unbeaten"));
  assert.equal(result.team.progress.unbeatenRun, 3);
});

test("winning at home and winning away are two different trophies", () => {
  const away = evaluateAchievements({
    fixtures: [match({ venue: "away", own: 1, against: 0 })],
    record: recordOf({}),
  });
  assert.ok(away.team.unlocked.includes("team-win-away"));
  assert.equal(away.team.unlocked.includes("team-win-home"), false);

  const home = evaluateAchievements({
    fixtures: [match({ venue: "home", own: 1, against: 0 })],
    record: recordOf({}),
  });
  assert.ok(home.team.unlocked.includes("team-win-home"));
  assert.equal(home.team.unlocked.includes("team-win-away"), false);
});

test("a cup win is not a league win", () => {
  const league = evaluateAchievements({
    fixtures: [match({ own: 1, against: 0 })],
    record: recordOf({}),
  });
  assert.equal(league.team.unlocked.includes("team-first-cup-win"), false);

  const cup = evaluateAchievements({
    fixtures: [match({ competitionKey: "cup", own: 1, against: 0 })],
    record: recordOf({}),
  });
  assert.ok(cup.team.unlocked.includes("team-first-cup-win"));
});

test("ten league goals count league goals only", () => {
  const nine = [1, 2, 3].map((matchday) =>
    match({ matchday, date: day(matchday), own: 3, against: 0 }),
  );
  const eight = evaluateAchievements({ fixtures: nine, record: recordOf({}) });
  assert.equal(eight.team.progress.leagueGoals, 9);
  assert.equal(eight.team.unlocked.includes("team-ten-league-goals"), false);

  const ten = evaluateAchievements({
    fixtures: [...nine, match({ matchday: 4, date: day(4), own: 1, against: 0 })],
    record: recordOf({}),
  });
  assert.equal(ten.team.progress.leagueGoals, 10);
  assert.ok(ten.team.unlocked.includes("team-ten-league-goals"));

  const cupGoals = [1, 2, 3, 4].map((matchday) =>
    match({ competitionKey: "cup", matchday, date: day(matchday), own: 3, against: 0 }),
  );
  const onlyCup = evaluateAchievements({ fixtures: cupGoals, record: recordOf({}) });
  assert.equal(onlyCup.team.progress.leagueGoals, 0, "cup goals are not league goals");
  assert.equal(onlyCup.team.unlocked.includes("team-ten-league-goals"), false);
});

// ---------------------------------------------------------------------------
// Team: a rival is only a rival once a played result says so
// ---------------------------------------------------------------------------

test("a rival only counts once a played result involves it", () => {
  const fixtures = [
    match({ matchday: 1, date: day(1), rival: rivalOf("el-templo"), own: 0, against: 0 }),
    // The source has not marked this one played, so it is not a result and the
    // club in it is not a rival we have met.
    { ...pending({ matchday: 2, date: day(8), rival: rivalOf("kongitos-fc") }), score: { home: 3, away: 0 } },
  ];
  const result = evaluateAchievements({ fixtures, record: recordOf({}) });

  assert.equal(result.team.unlocked.includes("team-beat-a-rival"), false);
  assert.deepEqual(
    result.team.progress.rivals.map((rival) => rival.slug),
    ["el-templo"],
  );
  assert.deepEqual(result.team.progress.rivals[0], {
    slug: "el-templo",
    name: "EL TEMPLO",
    played: 1,
    wins: 0,
  });
});

test("beating a rival needs a played win against it", () => {
  const draw = match({ matchday: 1, date: day(1), rival: rivalOf("el-templo"), own: 1, against: 1 });
  assert.equal(
    evaluateAchievements({ fixtures: [draw], record: recordOf({}) }).team.unlocked.includes(
      "team-beat-a-rival",
    ),
    false,
  );

  const win = match({ matchday: 2, date: day(8), rival: rivalOf("el-templo"), own: 2, against: 1 });
  const result = evaluateAchievements({ fixtures: [draw, win], record: recordOf({}) });
  assert.ok(result.team.unlocked.includes("team-beat-a-rival"));
  assert.deepEqual(
    result.team.progress.rivals.map((rival) => [rival.slug, rival.wins]),
    [["el-templo", 1]],
  );
});

// ---------------------------------------------------------------------------
// Team: the called-up list
// ---------------------------------------------------------------------------

test("ten called up need ten names in a played match", () => {
  const nine = evaluateAchievements({
    fixtures: [match({ matchday: 1, date: day(1), own: 1, against: 0 })],
    record: recordOf({ attendance: [sheet("league", 1, namesOf(9))] }),
  });
  assert.equal(nine.team.progress.bestCalledUp, 9);
  assert.equal(nine.team.unlocked.includes("team-ten-called-up"), false);

  const ten = evaluateAchievements({
    fixtures: [match({ matchday: 1, date: day(1), own: 1, against: 0 })],
    record: recordOf({ attendance: [sheet("league", 1, namesOf(10))] }),
  });
  assert.ok(ten.team.unlocked.includes("team-ten-called-up"));
});

test("a full squad needs the squad as the denominator", () => {
  const eleven = evaluateAchievements({
    fixtures: [match({ matchday: 1, date: day(1), own: 1, against: 0 })],
    record: recordOf({ attendance: [sheet("league", 1, namesOf(11))] }),
    squad: squadOf(12),
  });
  assert.equal(eleven.team.progress.fullSquad, false);
  assert.equal(eleven.team.unlocked.includes("team-full-squad"), false);

  const full = evaluateAchievements({
    fixtures: [match({ matchday: 1, date: day(1), own: 1, against: 0 })],
    record: recordOf({ attendance: [sheet("league", 1, namesOf(12))] }),
    squad: squadOf(12),
  });
  assert.ok(full.team.unlocked.includes("team-full-squad"));

  const unknown = evaluateAchievements({
    fixtures: [match({ matchday: 1, date: day(1), own: 1, against: 0 })],
    record: recordOf({ attendance: [sheet("league", 1, namesOf(15))] }),
  });
  assert.equal(unknown.team.unlocked.includes("team-full-squad"), false, "no squad, no proof");
});

test("a called-up list for a match that was never played counts for nothing", () => {
  const result = evaluateAchievements({
    fixtures: [pending({ matchday: 2, date: day(8) })],
    record: recordOf({ attendance: [sheet("league", 2, namesOf(14))] }),
  });
  assert.equal(result.team.progress.bestCalledUp, 0);
  assert.equal(result.player.unlocked.includes("player-debut"), false);
});

// ---------------------------------------------------------------------------
// Team: cards
// ---------------------------------------------------------------------------

test("a card-free match needs a played match with no card recorded on that day", () => {
  const carded = evaluateAchievements({
    fixtures: [match({ matchday: 2, date: day(8), own: 0, against: 0 })],
    record: recordOf({
      cards: [{ player: "Albert", yellow: 1, red: 0, yellowAt: 2 }],
    }),
  });
  assert.deepEqual(carded.team.progress.cardFreeMatches, []);
  assert.equal(carded.team.unlocked.includes("team-no-cards"), false);

  const free = evaluateAchievements({
    fixtures: [
      match({ matchday: 1, date: day(1), own: 0, against: 0 }),
      match({ matchday: 2, date: day(8), own: 0, against: 0 }),
    ],
    record: recordOf({
      cards: [{ player: "Albert", yellow: 1, red: 0, yellowAt: 2 }],
    }),
  });
  assert.deepEqual(
    free.team.progress.cardFreeMatches.map((entry) => entry.matchday),
    [1],
  );
  assert.ok(free.team.unlocked.includes("team-no-cards"));
});

test("a card the record cannot place on the calendar blocks every card-free claim", () => {
  const result = evaluateAchievements({
    fixtures: [match({ matchday: 1, date: day(1), own: 0, against: 0 })],
    record: recordOf({ cards: [{ player: "Albert", yellow: 0, red: 1 }] }),
  });
  assert.deepEqual(result.team.progress.cardFreeMatches, []);
  assert.equal(result.team.unlocked.includes("team-no-cards"), false);
  assert.ok(result.team.unlocked.includes("team-first-card"), "the card itself was reported");
});

test("first card: an empty list is none, a missing list is unknown", () => {
  const none = evaluateAchievements({
    fixtures: [match({ matchday: 1, date: day(1), own: 0, against: 0 })],
    record: recordOf({ cards: [] }),
  });
  assert.equal(none.team.unlocked.includes("team-first-card"), false);
  assert.ok(none.team.unlocked.includes("team-no-cards"));

  const reported = evaluateAchievements({
    fixtures: [match({ matchday: 1, date: day(1), own: 0, against: 0 })],
    record: recordOf({ cards: [{ player: "Jonay", yellow: 1, red: 0, yellowAt: 1 }] }),
  });
  assert.ok(reported.team.unlocked.includes("team-first-card"));
  assert.equal(reported.team.unlocked.includes("team-no-cards"), false);

  const unknown = evaluateAchievements({
    fixtures: [match({ matchday: 1, date: day(1), own: 0, against: 0 })],
    record: {},
  });
  assert.equal(unknown.team.unlocked.includes("team-no-cards"), false);
  assert.equal(unknown.team.unlocked.includes("team-first-card"), false);
});

// ---------------------------------------------------------------------------
// MVP votes: optional, and absent means locked
// ---------------------------------------------------------------------------

const VOTES_SQUAD = [
  { id: 7, name: "Albert", number: 7 },
  { id: 3, name: "Pau", number: 3 },
];

const ballot = (candidate, voter, matchKey = "league:1") => ({
  match_key: matchKey,
  candidate_slug: String(candidate),
  voter_slug: String(voter),
});

test("with no votes, nothing about an MVP is unlocked", () => {
  const fixtures = [match({ own: 2, against: 0 })];
  for (const votes of [undefined, null, []]) {
    const result = evaluateAchievements({ fixtures, record: recordOf({}), squad: VOTES_SQUAD, votes });
    assert.equal(result.team.unlocked.includes("team-first-mvp"), false);
    assert.equal(result.team.unlocked.includes("team-ten-mvp-votes"), false);
    assert.equal(result.player.unlocked.includes("player-first-mvp"), false);
    assert.equal(result.player.unlocked.includes("player-three-mvps"), false);
    assert.equal(result.player.unlocked.includes("player-first-vote"), false);
    assert.equal(result.team.progress.bestMvpVotes, 0);
  }
});

test("one vote awards the MVP of that match", () => {
  const result = evaluateAchievements({
    fixtures: [match({ own: 2, against: 0 })],
    record: recordOf({}),
    squad: VOTES_SQUAD,
    votes: [ballot(7, 3)],
  });
  assert.ok(result.team.unlocked.includes("team-first-mvp"));
  assert.ok(result.player.unlocked.includes("player-first-mvp"));
  assert.equal(result.player.unlocked.includes("player-three-mvps"), false);
  const albert = result.player.progress.players.find((player) => player.name === "Albert");
  assert.equal(albert.mvps, 1);
});

test("ten votes on one MVP are the tenth-vote trophy, nine are not", () => {
  const nine = Array.from({ length: 9 }, (_, index) => ballot(7, 10 + index));
  const eightNine = evaluateAchievements({
    fixtures: [match({ own: 2, against: 0 })],
    record: recordOf({}),
    squad: VOTES_SQUAD,
    votes: nine,
  });
  assert.equal(eightNine.team.progress.bestMvpVotes, 9);
  assert.equal(eightNine.team.unlocked.includes("team-ten-mvp-votes"), false);

  const ten = evaluateAchievements({
    fixtures: [match({ own: 2, against: 0 })],
    record: recordOf({}),
    squad: VOTES_SQUAD,
    votes: [...nine, ballot(7, 99)],
  });
  assert.equal(ten.team.progress.bestMvpVotes, 10);
  assert.ok(ten.team.unlocked.includes("team-ten-mvp-votes"));
});

test("three MVPs need three matches, not three votes in one", () => {
  const oneMatch = [
    ballot(7, 3, "league:1"),
    ballot(7, 4, "league:1"),
    ballot(7, 5, "league:1"),
  ];
  const crowded = evaluateAchievements({
    fixtures: [match({ own: 2, against: 0 })],
    record: recordOf({}),
    squad: VOTES_SQUAD,
    votes: oneMatch,
  });
  assert.equal(crowded.player.unlocked.includes("player-three-mvps"), false);

  const threeMatches = [
    ballot(7, 3, "league:1"),
    ballot(7, 3, "league:2"),
    ballot(7, 3, "league:3"),
  ];
  const result = evaluateAchievements({
    fixtures: [match({ own: 2, against: 0 })],
    record: recordOf({}),
    squad: VOTES_SQUAD,
    votes: threeMatches,
  });
  assert.ok(result.player.unlocked.includes("player-three-mvps"));
  assert.equal(result.player.progress.players.find((p) => p.name === "Albert").mvps, 3);
});

test("a vote for a slug the squad does not know awards an MVP to nobody", () => {
  const result = evaluateAchievements({
    fixtures: [match({ own: 2, against: 0 })],
    record: recordOf({}),
    squad: VOTES_SQUAD,
    votes: [{ match_key: "league:1", candidate_slug: "99", voter_slug: "3" }],
  });
  assert.ok(result.team.unlocked.includes("team-first-mvp"), "somebody was voted for");
  assert.equal(result.player.unlocked.includes("player-first-mvp"), false, "nobody can be named");
  assert.equal(result.team.progress.mvpAwards[0].name, null);
});

test("first vote is an emitted ballot, and it is about the reader when known", () => {
  const fixtures = [match({ own: 2, against: 0 })];
  const record = recordOf({});

  const plain = evaluateAchievements({ fixtures, record, squad: VOTES_SQUAD, votes: [ballot(7, 3)] });
  assert.ok(plain.player.unlocked.includes("player-first-vote"));

  const others = evaluateAchievements({
    fixtures,
    record,
    squad: VOTES_SQUAD,
    votes: [ballot(7, 3)],
    voterSlug: "5",
  });
  assert.equal(others.player.unlocked.includes("player-first-vote"), false, "someone else voted");

  const own = evaluateAchievements({
    fixtures,
    record,
    squad: VOTES_SQUAD,
    votes: [ballot(7, 5)],
    voterSlug: "5",
  });
  assert.ok(own.player.unlocked.includes("player-first-vote"));

  const tallyOnly = evaluateAchievements({
    fixtures,
    record,
    squad: VOTES_SQUAD,
    votes: [{ match_key: "league:1", candidate_slug: "7" }],
  });
  assert.equal(
    tallyOnly.player.unlocked.includes("player-first-vote"),
    false,
    "a tally row does not prove a ballot was emitted",
  );
});

// ---------------------------------------------------------------------------
// Player: debuts, matches, goals, cards
// ---------------------------------------------------------------------------

test("debut is a called-up name in a played match", () => {
  const result = evaluateAchievements({
    fixtures: [match({ matchday: 1, date: day(1), own: 1, against: 0 }), pending({ matchday: 2, date: day(8) })],
    record: recordOf({ attendance: [sheet("league", 1, ["Albert"])] }),
  });
  assert.ok(result.player.unlocked.includes("player-debut"));
  assert.equal(result.player.unlocked.includes("player-five-matches"), false);
});

test("five and ten matches are counted, not guessed", () => {
  const fixturesUpTo = (count) =>
    Array.from({ length: count }, (_, index) =>
      match({ matchday: index + 1, date: day(index + 1), own: 1, against: 0 }),
    );
  const sheetsUpTo = (count) =>
    Array.from({ length: count }, (_, index) => sheet("league", index + 1, ["Albert"]));

  const five = evaluateAchievements({
    fixtures: [...fixturesUpTo(5), pending({ matchday: 6, date: day(20) })],
    record: recordOf({ attendance: sheetsUpTo(5) }),
  });
  assert.ok(five.player.unlocked.includes("player-five-matches"));
  assert.equal(five.player.unlocked.includes("player-ten-matches"), false);
  assert.equal(five.player.unlocked.includes("player-perfect-attendance"), false, "mid-season");

  const ten = evaluateAchievements({
    fixtures: [...fixturesUpTo(10), pending({ matchday: 11, date: day(28) })],
    record: recordOf({ attendance: sheetsUpTo(10) }),
  });
  assert.ok(ten.player.unlocked.includes("player-ten-matches"));
});

test("goals per player: one, five and ten", () => {
  // One match still to play, so this is an ongoing season and the two
  // season-end entries are not part of what a goal count can decide.
  const fixtures = [match({ own: 2, against: 0 }), pending({ matchday: 2, date: day(8) })];
  const withGoals = (goals) =>
    evaluateAchievements({
      fixtures,
      record: recordOf({ scorers: [{ player: "Albert", goals, league: goals, cup: 0 }] }),
    });

  assert.deepEqual(withGoals(1).player.unlocked, ["player-first-goal"]);
  assert.ok(withGoals(5).player.unlocked.includes("player-five-goals"));
  assert.equal(withGoals(5).player.unlocked.includes("player-ten-goals"), false);
  assert.ok(withGoals(10).player.unlocked.includes("player-ten-goals"));
});

test("a player's cup goals count in his season total", () => {
  const result = evaluateAchievements({
    fixtures: [match({ competitionKey: "cup", own: 5, against: 6 })],
    record: recordOf({ scorers: [{ player: "Rup", goals: 5, league: 0, cup: 5 }] }),
  });
  assert.ok(result.player.unlocked.includes("player-five-goals"));
});

test("first yellow needs a reported card, not merely a name on a sheet", () => {
  const result = evaluateAchievements({
    fixtures: [match({ own: 1, against: 0 })],
    record: recordOf({
      attendance: [sheet("league", 1, ["Albert"])],
      scorers: [{ player: "Albert", goals: 1, league: 1, cup: 0 }],
    }),
  });
  assert.equal(result.player.unlocked.includes("player-first-yellow"), false);

  const carded = evaluateAchievements({
    fixtures: [match({ own: 1, against: 0 })],
    record: recordOf({ cards: [{ player: "Albert", yellow: 2, red: 0, yellowAt: 1 }] }),
  });
  assert.ok(carded.player.unlocked.includes("player-first-yellow"));
});

// ---------------------------------------------------------------------------
// A player-scope entry is decided about ONE player
//
// The personal shelf paints these tiles under the reader's own name, so a tile
// that is unlocked because SOMEBODY in the squad holds the fact is a lie in the
// first person. The owner (Rup) has no card in src/data/club-record.json and the
// shelf told him he had a yellow, because `player-first-yellow` was decided with
// `facts.players.some(...)` — "someone in the squad took a card".
//
// So every player-scope entry is now decided against one player at a time, and
// `player.byPlayer` publishes that reading, keyed by the normalised name the
// evaluator has always used as a player's identity. `player.unlocked` stays as
// the squad-wide reading, which is what a caller with no identity can ask.
// ---------------------------------------------------------------------------

/** The scope of one player, in the shape the personal shelf reads. */
function scopeOfPlayer(result, name) {
  const byPlayer = result.player.byPlayer;
  assert.ok(byPlayer instanceof Map, "the evaluator publishes one scope per player");
  const key = name.toUpperCase();
  assert.ok(byPlayer.has(key), `the shelf has no scope for ${name}`);
  return byPlayer.get(key);
}

test("a yellow card unlocks «1.ª amarilla» for the player who took it, and for nobody else", () => {
  const result = evaluateAchievements({
    fixtures: [match({ own: 1, against: 0 })],
    record: recordOf({
      cards: [{ player: "Albert", yellow: 1, red: 0, yellowAt: 1 }],
      attendance: [sheet("league", 1, ["Albert", "Rup"])],
    }),
    squad: [
      { id: 7, name: "Albert", number: 7 },
      { id: 9, name: "Rup", number: 9 },
    ],
  });

  const albert = scopeOfPlayer(result, "Albert");
  const rup = scopeOfPlayer(result, "Rup");

  assert.ok(albert.unlocked.includes("player-first-yellow"), "Albert took the card");
  assert.equal(
    rup.unlocked.includes("player-first-yellow"),
    false,
    "the club having a yellow is not «you have a yellow»",
  );
  assert.ok(rup.locked.includes("player-first-yellow"));
  assert.equal(rup.progress.yellow, 0);
  assert.equal(albert.progress.yellow, 1);

  /* Two scopes of one catalogue: no entry is dropped and none is invented. */
  assert.equal(albert.unlocked.length + albert.locked.length, playerAchievements.length);
  assert.equal(rup.unlocked.length + rup.locked.length, playerAchievements.length);
});

test("three MVPs belong to the player who won them, and a ballot to the player who cast it", () => {
  const result = evaluateAchievements({
    fixtures: [1, 2, 3].map((matchday) =>
      match({ matchday, date: day(matchday), own: 2, against: 0 }),
    ),
    record: recordOf({}),
    squad: VOTES_SQUAD,
    /* Albert wins all three; Pau casts every ballot. */
    votes: [ballot(7, 3, "league:1"), ballot(7, 3, "league:2"), ballot(7, 3, "league:3")],
  });

  const albert = scopeOfPlayer(result, "Albert");
  const pau = scopeOfPlayer(result, "Pau");

  assert.ok(albert.unlocked.includes("player-three-mvps"), "Albert won three");
  assert.equal(
    pau.unlocked.includes("player-three-mvps"),
    false,
    "a team-mate's three MVPs are not his",
  );
  assert.equal(pau.progress.mvps, 0);
  assert.equal(albert.progress.mvps, 3);

  assert.ok(pau.unlocked.includes("player-first-vote"), "Pau cast the ballots");
  assert.equal(
    albert.unlocked.includes("player-first-vote"),
    false,
    "receiving a vote is not casting one",
  );
  assert.equal(albert.progress.ballots, 0);
  assert.equal(pau.progress.ballots, 3);
});

// ---------------------------------------------------------------------------
// The two season-end entries
// ---------------------------------------------------------------------------

/** Three played matchdays, the same player in every sheet, and one still pending. */
function seasonNearTheEnd({ pending: stillPending = true } = {}) {
  const fixtures = [
    match({ matchday: 1, date: day(1), own: 3, against: 0 }),
    match({ matchday: 2, date: day(8), own: 2, against: 2 }),
    match({ matchday: 3, date: day(15), own: 1, against: 0 }),
  ];
  if (stillPending) fixtures.push(pending({ matchday: 4, date: day(22) }));
  return {
    fixtures,
    record: recordOf({
      scorers: [{ player: "Albert", goals: 4, league: 3, cup: 1 }],
      cards: [],
      attendance: [
        sheet("league", 1, ["Albert", "Pau"]),
        sheet("league", 2, ["Albert", "Pau"]),
        sheet("league", 3, ["Albert"]),
      ],
    }),
  };
}

test("the season-end entries stay locked while a single match is still to play", () => {
  const result = evaluateAchievements(seasonNearTheEnd());

  assert.equal(result.team.progress.seasonComplete, false);
  assert.equal(result.player.unlocked.includes("player-top-scorer"), false);
  assert.equal(result.player.unlocked.includes("player-perfect-attendance"), false);

  // The figures already say who is first and who has turned up to everything:
  // that is what the screen prints as "pending", never as a trophy.
  assert.deepEqual(result.player.progress.pending.topScorer, ["Albert"]);
  assert.deepEqual(result.player.progress.pending.perfectAttendance, ["Albert"]);
});

test("the same season, once every match is played, hands both of them out", () => {
  const result = evaluateAchievements(seasonNearTheEnd({ pending: false }));

  assert.equal(result.player.progress.seasonComplete, true);
  assert.equal(result.player.progress.everyMatchHasList, true);
  assert.ok(result.player.unlocked.includes("player-top-scorer"));
  assert.ok(result.player.unlocked.includes("player-perfect-attendance"));
});

test("a complete season with a missing called-up list cannot crown perfect attendance", () => {
  const season = seasonNearTheEnd({ pending: false });
  season.record = recordOf({
    scorers: season.record.scorers,
    cards: [],
    attendance: [sheet("league", 1, ["Albert"]), sheet("league", 3, ["Albert"])],
  });
  const result = evaluateAchievements(season);

  assert.equal(result.player.progress.everyMatchHasList, false);
  assert.equal(result.player.unlocked.includes("player-perfect-attendance"), false);
  assert.ok(result.player.unlocked.includes("player-top-scorer"), "goals do not need a sheet");
});

test("a complete season with no goals has no top scorer", () => {
  const result = evaluateAchievements({
    fixtures: [
      match({ matchday: 1, date: day(1), own: 0, against: 0 }),
      match({ matchday: 2, date: day(8), own: 0, against: 0 }),
    ],
    record: recordOf({
      scorers: [],
      cards: [],
      attendance: [sheet("league", 1, ["Albert"]), sheet("league", 2, ["Albert"])],
    }),
  });
  assert.equal(result.player.unlocked.includes("player-top-scorer"), false);
  assert.ok(result.player.unlocked.includes("player-perfect-attendance"));
});

// ---------------------------------------------------------------------------
// Purity and the catalogue/evaluator agreement
// ---------------------------------------------------------------------------

test("the same input always gives the same answer, and the input is not touched", () => {
  const input = seasonNearTheEnd();
  const snapshot = JSON.parse(JSON.stringify(input));

  const first = evaluateAchievements(input);
  const second = evaluateAchievements(input);

  assert.deepEqual(first.team.unlocked, second.team.unlocked);
  assert.deepEqual(first.player.unlocked, second.player.unlocked);
  assert.deepEqual(JSON.parse(JSON.stringify(input)), snapshot, "the evaluator mutated its input");
});

test("every entry's own predicate agrees with the evaluator", () => {
  const inputs = [
    {},
    { fixtures: [match({ own: 2, against: 0 })], record: recordOf({}) },
    seasonNearTheEnd(),
    seasonNearTheEnd({ pending: false }),
  ];

  for (const input of inputs) {
    const result = evaluateAchievements(input);
    const facts = seasonFacts(input);
    for (const entry of achievements) {
      const decided = result[entry.scope].unlocked.includes(entry.id);
      assert.equal(entry.test(facts), decided, `${entry.id} disagrees with its own scope`);
    }
  }
});

// ---------------------------------------------------------------------------
// The owner's 100-entry catalogue, reconciled
//
// The 33 entries the app already had keep their ids; everything under `ADDED`
// came from the catalogue because the project's own data can prove it. Each one
// is exercised twice: a season that holds the fact unlocks it, and a season that
// does not leaves it locked. The thin season is deliberately the smallest there
// is, so an entry that unlocks there is an entry that proves nothing.
// ---------------------------------------------------------------------------

/** The entries the app already had before the catalogue was reconciled. */
const ORIGINAL_IDS = [
  "team-first-match",
  "team-first-goal",
  "team-first-draw",
  "team-first-win",
  "team-clean-sheet",
  "team-three-goals",
  "team-five-goals",
  "team-win-by-two",
  "team-two-wins-in-a-row",
  "team-three-unbeaten",
  "team-win-away",
  "team-win-home",
  "team-first-cup-win",
  "team-ten-league-goals",
  "team-beat-a-rival",
  "team-ten-called-up",
  "team-full-squad",
  "team-no-cards",
  "team-first-card",
  "team-first-mvp",
  "team-ten-mvp-votes",
  "player-debut",
  "player-five-matches",
  "player-ten-matches",
  "player-first-goal",
  "player-five-goals",
  "player-ten-goals",
  "player-first-mvp",
  "player-three-mvps",
  "player-first-yellow",
  "player-first-vote",
  "player-top-scorer",
  "player-perfect-attendance",
];

/** What the reconciliation brought over from the owner's catalogue. */
const ADDED_IDS = [
  "team-first-loss",
  "team-win-by-three",
  "team-win-by-five",
  "team-all-called-up",
  "team-three-wins-in-a-row",
  "team-five-wins-in-a-row",
  "team-ten-wins",
  "team-five-unbeaten",
  "team-ten-unbeaten",
  "team-three-home-wins",
  "team-three-away-wins",
  "team-revenge",
  "team-ten-goals-for",
  "team-twentyfive-goals-for",
  "team-fifty-goals-for",
  "team-hundred-goals-for",
  "team-seven-goals",
  "team-scoring-run-five",
  "team-scoring-run-ten",
  "team-five-scorers",
  "team-three-clean-sheets",
  "team-five-clean-sheets",
  "team-clean-sheet-run",
  "team-five-without-thrash",
  "team-fewer-conceded",
  "team-positive-ten",
  "team-positive-twenty",
  "team-perfect-match",
  "team-best-defence",
  "team-best-attack",
  "team-ten-points",
  "team-twenty-points",
  "team-top-five",
  "team-podium",
  "team-champions",
  "team-five-cup-matches",
  "team-beat-leader",
  "player-fifteen-goals",
  "player-twenty-goals",
  "player-twentyfive-goals",
  "player-fifteen-matches",
  "player-twenty-matches",
  "player-five-consecutive-call-ups",
  "player-ten-consecutive-call-ups",
  "player-first-vote-received",
  "player-five-votes-received",
  "player-ten-votes-received",
  "player-twenty-votes-received",
  "player-five-mvps",
  "player-ten-mvps",
  "player-consecutive-mvps",
  "player-five-voters",
  "player-ten-voters",
  "player-three-yellows",
  "player-five-yellows",
  "player-ten-yellows",
  "player-first-red",
  "player-yellow-and-red",
  "player-two-reds",
  "player-most-cards",
  "player-five-league-goals",
  "player-three-cup-goals",
  "player-goal-in-both",
  "player-competition-top-scorer",
  "player-mvp-in-loss",
  /*
   * The nine entries the owner's catalogue named and the season totals could not
   * decide: each one asks what happened in a single match, so each one reads the
   * acta ledger. They were left out until the ledger existed.
   */
  "player-two-goals-in-a-match",
  "player-three-goals-in-a-match",
  "player-four-goals-in-a-match",
  "player-scoring-run-three",
  "player-scoring-run-five",
  "player-three-scoring-runs",
  "player-first-scorer-of-the-season",
  "player-two-cards-in-a-match",
  "player-yellows-in-a-row",
];

const CATALOGUE_SQUAD = Array.from({ length: 15 }, (_, index) => ({
  id: index + 1,
  name: `Jugador ${index + 1}`,
  number: index + 2,
}));

const CATALOGUE_NAMES = CATALOGUE_SQUAD.map((player) => player.name);

const RIVAL_LEAGUE = rivalOf("premier-team-f-c");
const RIVAL_CUP = rivalOf("volta-fred-fc");

/**
 * The actas of that same season: the row per played match, joined to the
 * calendar by competition and matchday.
 *
 * Jugador 2 is the busy one. He scores four in each of three separate blocks —
 * league matchdays 1-5, 7-9 and 11-15 — which is the double, the hat-trick, the
 * four-goal night, a five-match scoring run and the three three-match runs. He
 * is booked in league matchdays 1, 2 and 3 (three consecutive jornadas) and takes
 * two cards in matchday 5, one of them red. The two matchdays with no goal from
 * him are rows like any other: the acta was read and he is not on it, which is a
 * fact, not a gap.
 *
 * The cup matchdays are here so that no played match is missing a report: a
 * missing row breaks a run on purpose, and this season is the one that holds
 * every fact the catalogue can ask for.
 */
function richLedger() {
  const rows = [];
  const leagueGoals = (matchday) =>
    matchday === 6 || matchday === 10
      ? [
          { player: "Jugador 3", goals: 5 },
          { player: "Jugador 4", goals: 4 },
        ]
      : [
          { player: "Jugador 2", goals: 4 },
          { player: "Jugador 3", goals: 3 },
          { player: "Jugador 4", goals: 2 },
        ];

  for (let matchday = 1; matchday <= 15; matchday += 1) {
    rows.push({
      competition: "league",
      matchday,
      date: `2026-09-${String(matchday).padStart(2, "0")}`,
      goals: leagueGoals(matchday),
      cards:
        matchday === 5
          ? [
              { player: "Jugador 2", type: "yellow" },
              { player: "Jugador 2", type: "red" },
            ]
          : matchday <= 3
            ? [{ player: "Jugador 2", type: "yellow" }]
            : [],
    });
  }

  for (let matchday = 1; matchday <= 5; matchday += 1) {
    rows.push({
      competition: "cup",
      matchday,
      date: `2027-01-${String(matchday).padStart(2, "0")}`,
      /* The first cup match was the 0-3 defeat: no goals to report. */
      goals:
        matchday === 1
          ? []
          : [
              { player: "Jugador 2", goals: 4 },
              { player: "Jugador 3", goals: 5 },
            ],
      cards: [],
    });
  }

  return rows;
}

/** A season that holds every fact the added entries ask for. */
function richSeason() {
  const fixtures = [];

  /* Fifteen league wins of 9-0: goals, margins, runs and clean sheets at once. */
  for (let matchday = 1; matchday <= 15; matchday += 1) {
    fixtures.push(
      match({
        matchday,
        date: `2026-09-${String(matchday).padStart(2, "0")}`,
        rival: RIVAL_LEAGUE,
        own: 9,
        against: 0,
      }),
    );
  }

  /* Five cup matches away: a 0-3 loss and then four wins, against the same club. */
  for (let matchday = 1; matchday <= 5; matchday += 1) {
    fixtures.push(
      match({
        competitionKey: "cup",
        matchday,
        date: `2027-01-${String(matchday).padStart(2, "0")}`,
        venue: "away",
        rival: RIVAL_CUP,
        own: matchday === 1 ? 0 : 9,
        against: matchday === 1 ? 3 : 0,
      }),
    );
  }

  const attendance = [];
  for (let matchday = 1; matchday <= 15; matchday += 1) {
    attendance.push(sheet("league", matchday, CATALOGUE_NAMES));
  }
  for (let matchday = 1; matchday <= 5; matchday += 1) {
    attendance.push(sheet("cup", matchday, CATALOGUE_NAMES));
  }

  /*
   * One player carries the goal ladders and both colours of card; four more make
   * the league a five-scorer competition.
   */
  const scorers = [
    { player: "Jugador 2", goals: 30, league: 20, cup: 10 },
    { player: "Jugador 3", goals: 1, league: 1, cup: 0 },
    { player: "Jugador 4", goals: 1, league: 1, cup: 0 },
    { player: "Jugador 5", goals: 1, league: 1, cup: 0 },
    { player: "Jugador 6", goals: 1, league: 1, cup: 0 },
  ];
  const cards = [{ player: "Jugador 2", yellow: 10, red: 2, yellowAt: 1 }];

  /* Two ballots on each of ten league matchdays, from two new voters each time. */
  const votes = [];
  for (let matchday = 1; matchday <= 10; matchday += 1) {
    votes.push(ballot(2, 2 * matchday - 1, `league:${matchday}`));
    votes.push(ballot(2, 2 * matchday, `league:${matchday}`));
  }
  /* The MVP of the match the club lost. */
  votes.push(ballot(2, 31, "cup:1"));

  const tables = [
    {
      key: "league",
      rows: [
        { rank: 1, slug: CLUB.slug, played: 15, goalsFor: 135, goalsAgainst: 0 },
        { rank: 2, slug: RIVAL_LEAGUE.slug, played: 15, goalsFor: 20, goalsAgainst: 40 },
      ],
    },
    {
      key: "cup",
      rows: [
        { rank: 1, slug: RIVAL_CUP.slug, played: 5, goalsFor: 10, goalsAgainst: 5 },
        { rank: 2, slug: CLUB.slug, played: 5, goalsFor: 36, goalsAgainst: 3 },
      ],
    },
  ];

  return {
    fixtures,
    record: recordOf({ scorers, cards, attendance }),
    squad: CATALOGUE_SQUAD,
    votes,
    tables,
    ledger: richLedger(),
  };
}

/** The smallest season there is: one 0-0, one pending match, nothing else. */
const thinSeason = () => ({
  fixtures: [
    match({ matchday: 1, date: day(1), own: 0, against: 0 }),
    pending({ matchday: 2, date: day(8) }),
  ],
  record: recordOf({ cards: [], attendance: [] }),
  squad: [],
  votes: [],
  /* No acta has been transcribed: every single-match entry must stay locked. */
  ledger: [],
});

const leagueTableOf = (rows) => [{ key: "league", rows }];

test("the catalogue is the 33 original entries plus the 74 the data can prove", () => {
  assert.equal(ORIGINAL_IDS.length, 33);
  assert.equal(ADDED_IDS.length, 74);
  assert.deepEqual(achievements.map((entry) => entry.id), [
    ...ORIGINAL_IDS.slice(0, 21),
    ...ADDED_IDS.slice(0, 37),
    ...ORIGINAL_IDS.slice(21),
    ...ADDED_IDS.slice(37),
  ]);
  assert.equal(teamAchievements.length, 58);
  assert.equal(playerAchievements.length, 49);
  assert.equal(achievements.length, 107);
});

test("every added entry is unlocked by the data that proves it, and locked without it", () => {
  const rich = evaluateAchievements(richSeason());
  const thin = evaluateAchievements(thinSeason());

  for (const id of ADDED_IDS) {
    const entry = achievementById(id);
    assert.ok(entry, `${id} is not in the catalogue`);
    assert.ok(
      rich[entry.scope].unlocked.includes(id),
      `${id} should be unlocked by the season that holds the fact`,
    );
    assert.equal(
      thin[entry.scope].unlocked.includes(id),
      false,
      `${id} must stay locked when the data does not prove it`,
    );
  }
});

test("the grid registers every icon the catalogue names", async () => {
  const { readFileSync } = await import("node:fs");
  const source = readFileSync(
    new URL("../src/components/AchievementsGrid.jsx", import.meta.url),
    "utf8",
  ).replace(/\r\n/g, "\n");
  const start = source.indexOf("const PLATE_ICONS = {");
  const end = source.indexOf("};\n", start);
  assert.ok(start !== -1 && end !== -1, "the grid must resolve icon names through PLATE_ICONS");
  const registry = source.slice(start, end);

  for (const entry of achievements) {
    assert.ok(
      registry.includes(`\n  ${entry.icon}: {`),
      `${entry.id} names ${entry.icon}, and the grid does not register it`,
    );
  }
});

test("the added team ladders are thresholds, not round-ups", () => {
  const twoHomeWins = [
    match({ matchday: 1, date: day(1), venue: "home", own: 1, against: 0 }),
    match({ matchday: 2, date: day(2), venue: "home", own: 1, against: 0 }),
    match({ matchday: 3, date: day(3), venue: "away", own: 1, against: 0 }),
  ];
  assert.equal(
    teamUnlocked({ fixtures: twoHomeWins, record: recordOf({}) }).includes("team-three-home-wins"),
    false,
  );

  const fourWins = [1, 2, 3, 4].map((matchday) =>
    match({ matchday, date: day(matchday), own: 1, against: 0 }),
  );
  assert.equal(
    teamUnlocked({ fixtures: fourWins, record: recordOf({}) }).includes("team-five-wins-in-a-row"),
    false,
  );

  const nineGoals = [1, 2, 3].map((matchday) =>
    match({ matchday, date: day(matchday), own: 3, against: 0 }),
  );
  assert.equal(
    teamUnlocked({ fixtures: nineGoals, record: recordOf({}) }).includes("team-ten-goals-for"),
    false,
  );

  const fourCleanSheets = [1, 2, 3, 4].map((matchday) =>
    match({ matchday, date: day(matchday), own: 1, against: 0 }),
  );
  assert.equal(
    teamUnlocked({ fixtures: fourCleanSheets, record: recordOf({}) }).includes(
      "team-five-clean-sheets",
    ),
    false,
  );
});

test("a clean-sheet run is broken by a draw that concedes", () => {
  const broken = [
    match({ matchday: 1, date: day(1), own: 1, against: 0 }),
    match({ matchday: 2, date: day(2), own: 1, against: 0 }),
    match({ matchday: 3, date: day(3), own: 1, against: 1 }),
    match({ matchday: 4, date: day(4), own: 1, against: 0 }),
  ];
  const result = evaluateAchievements({ fixtures: broken, record: recordOf({}) });
  assert.equal(result.facts.cleanSheetRun, 2);
  assert.equal(result.team.unlocked.includes("team-clean-sheet-run"), false);

  const run = [
    match({ matchday: 1, date: day(1), own: 1, against: 0 }),
    match({ matchday: 2, date: day(2), own: 1, against: 0 }),
    match({ matchday: 3, date: day(3), own: 1, against: 0 }),
  ];
  assert.ok(teamUnlocked({ fixtures: run, record: recordOf({}) }).includes("team-clean-sheet-run"));
});

test("a revenge needs the loss before the win, against the same rival", () => {
  const lossFirst = [
    match({ matchday: 1, date: day(1), rival: RIVAL_CUP, own: 0, against: 3 }),
    match({ matchday: 2, date: day(8), rival: RIVAL_CUP, own: 2, against: 1 }),
  ];
  assert.ok(teamUnlocked({ fixtures: lossFirst, record: recordOf({}) }).includes("team-revenge"));

  const winFirst = [
    match({ matchday: 1, date: day(1), rival: RIVAL_CUP, own: 2, against: 1 }),
    match({ matchday: 2, date: day(8), rival: RIVAL_CUP, own: 0, against: 3 }),
  ];
  assert.equal(
    teamUnlocked({ fixtures: winFirst, record: recordOf({}) }).includes("team-revenge"),
    false,
    "beating a club and losing to it afterwards is not a revenge",
  );
});

test("the table entries wait for the competition to be over", () => {
  const threeMatches = [1, 2, 3].map((matchday) =>
    match({ matchday, date: day(matchday), own: 1, against: 0 }),
  );
  const table = leagueTableOf([
    { rank: 1, slug: CLUB.slug, played: 3, goalsFor: 3, goalsAgainst: 0 },
    { rank: 2, slug: RIVAL_LEAGUE.slug, played: 3, goalsFor: 1, goalsAgainst: 5 },
  ]);
  const finalClaims = [
    "team-top-five",
    "team-podium",
    "team-champions",
    "team-best-defence",
    "team-best-attack",
  ];

  const finished = evaluateAchievements({
    fixtures: threeMatches,
    record: recordOf({}),
    tables: table,
  });
  for (const id of finalClaims) {
    assert.ok(finished.team.unlocked.includes(id), `${id} should be unlocked by a finished league`);
  }

  const stillRunning = evaluateAchievements({
    fixtures: [...threeMatches, pending({ matchday: 4, date: day(20) })],
    record: recordOf({}),
    tables: table,
  });
  for (const id of finalClaims) {
    assert.equal(
      stillRunning.team.unlocked.includes(id),
      false,
      `${id} is a final claim and the league is not over`,
    );
  }
});

test("sixth place is not the top five, and a missing table proves nothing", () => {
  const threeMatches = [1, 2, 3].map((matchday) =>
    match({ matchday, date: day(matchday), own: 1, against: 0 }),
  );
  const sixth = evaluateAchievements({
    fixtures: threeMatches,
    record: recordOf({}),
    tables: leagueTableOf([{ rank: 6, slug: CLUB.slug, played: 3, goalsFor: 3, goalsAgainst: 2 }]),
  });
  assert.equal(sixth.team.unlocked.includes("team-top-five"), false);
  assert.equal(sixth.team.unlocked.includes("team-podium"), false);
  assert.equal(sixth.team.unlocked.includes("team-champions"), false);

  const noTable = evaluateAchievements({ fixtures: threeMatches, record: recordOf({}) });
  assert.equal(noTable.team.unlocked.includes("team-best-defence"), false);
  /* Points come from our own results, so they need no table at all. */
  assert.equal(noTable.facts.leaguePoints, 9);
  const tenPoints = evaluateAchievements({
    fixtures: [...threeMatches, match({ matchday: 4, date: day(4), own: 1, against: 0 })],
    record: recordOf({}),
  });
  assert.equal(tenPoints.facts.leaguePoints, 12);
  assert.ok(tenPoints.team.unlocked.includes("team-ten-points"));
});

test("best defence needs genuinely fewer conceded, not merely as few", () => {
  const threeMatches = [1, 2, 3].map((matchday) =>
    match({ matchday, date: day(matchday), own: 1, against: 0 }),
  );
  const tied = leagueTableOf([
    { rank: 1, slug: CLUB.slug, played: 3, goalsFor: 3, goalsAgainst: 1 },
    { rank: 2, slug: RIVAL_LEAGUE.slug, played: 3, goalsFor: 8, goalsAgainst: 1 },
  ]);
  assert.equal(
    teamUnlocked({ fixtures: threeMatches, record: recordOf({}), tables: tied }).includes(
      "team-best-defence",
    ),
    false,
  );
});

test("the per-competition split is what proves the competition entries", () => {
  const fixtures = [match({ matchday: 1, date: day(1), own: 1, against: 0 })];
  const split = (league, cup) =>
    playerUnlocked({
      fixtures,
      record: recordOf({ scorers: [{ player: "Albert", goals: league + cup, league, cup }] }),
    });

  const fourInLeague = split(4, 0);
  assert.equal(fourInLeague.includes("player-five-league-goals"), false);
  assert.equal(fourInLeague.includes("player-three-cup-goals"), false);
  assert.equal(fourInLeague.includes("player-goal-in-both"), false);

  const both = split(5, 3);
  assert.ok(both.includes("player-five-league-goals"));
  assert.ok(both.includes("player-three-cup-goals"));
  assert.ok(both.includes("player-goal-in-both"));
});

test("consecutive MVPs cannot skip a match, and consecutive call-ups cannot skip a list", () => {
  const fixtures = [
    match({ matchday: 1, date: day(1), own: 1, against: 0 }),
    match({ matchday: 2, date: day(2), own: 1, against: 0 }),
    match({ matchday: 3, date: day(3), own: 1, against: 0 }),
  ];
  const record = recordOf({
    attendance: [
      sheet("league", 1, ["Albert"]),
      sheet("league", 2, ["Albert"]),
      sheet("league", 3, ["Albert"]),
    ],
  });

  const apart = evaluateAchievements({
    fixtures,
    record,
    squad: VOTES_SQUAD,
    votes: [ballot(7, 3, "league:1"), ballot(7, 3, "league:3")],
  });
  assert.equal(apart.player.unlocked.includes("player-consecutive-mvps"), false);

  const together = evaluateAchievements({
    fixtures,
    record,
    squad: VOTES_SQUAD,
    votes: [ballot(7, 3, "league:1"), ballot(7, 3, "league:2")],
  });
  assert.ok(together.player.unlocked.includes("player-consecutive-mvps"));

  const fiveMatches = [1, 2, 3, 4, 5].map((matchday) =>
    match({ matchday, date: day(matchday), own: 1, against: 0 }),
  );
  const skipped = evaluateAchievements({
    fixtures: fiveMatches,
    record: recordOf({
      attendance: [
        sheet("league", 1, ["Albert"]),
        sheet("league", 2, ["Albert"]),
        sheet("league", 3, []),
        sheet("league", 4, ["Albert"]),
        sheet("league", 5, ["Albert"]),
      ],
    }),
  });
  assert.equal(skipped.player.unlocked.includes("player-five-consecutive-call-ups"), false);

  const missingList = evaluateAchievements({
    fixtures: fiveMatches,
    record: recordOf({
      attendance: [1, 2, 3, 4].map((matchday) => sheet("league", matchday, ["Albert"])),
    }),
  });
  assert.equal(
    missingList.player.unlocked.includes("player-five-consecutive-call-ups"),
    false,
    "a match with no list is an unknown, not a called-up name",
  );
});

test("votes received and voters are two different counts", () => {
  const fixtures = [match({ matchday: 1, date: day(1), own: 1, against: 0 })];
  const oneVoterRepeats = Array.from({ length: 6 }, (_, index) =>
    ballot(7, 3, `league:${index + 1}`),
  );
  const result = evaluateAchievements({
    fixtures,
    record: recordOf({}),
    squad: VOTES_SQUAD,
    votes: oneVoterRepeats,
  });
  assert.ok(result.player.unlocked.includes("player-five-votes-received"));
  assert.equal(
    result.player.unlocked.includes("player-five-voters"),
    false,
    "one supporter voting six times is one voter",
  );
});

test("the entries that read a finished season still wait for it without the pending flag", () => {
  const fixtures = [
    match({ matchday: 1, date: day(1), own: 1, against: 0 }),
    match({ matchday: 2, date: day(2), own: 1, against: 0 }),
  ];
  const record = recordOf({
    cards: [{ player: "Albert", yellow: 2, red: 0, yellowAt: 1 }],
    attendance: [sheet("league", 1, ["Albert"]), sheet("league", 2, ["Albert"])],
  });

  const running = evaluateAchievements({
    fixtures: [...fixtures, pending({ matchday: 3, date: day(9) })],
    record,
  });
  assert.equal(running.player.unlocked.includes("player-most-cards"), false);

  const over = evaluateAchievements({ fixtures, record });
  assert.ok(over.player.unlocked.includes("player-most-cards"));
  assert.equal(
    achievementById("player-most-cards").seasonEnd,
    undefined,
    "only the two named entries carry the pending flag",
  );
});

// ---------------------------------------------------------------------------
// The acta ledger: what happened in ONE match
//
// The nine entries below were left out of the catalogue for months because the
// record kept season totals and a league/cup split, and neither can say who
// scored twice on a given night or who took two cards. The owner corrected that:
// the acta he sends every week carries exactly those facts. So these tests cover
// both directions of the same rule — a match with a row proves its entries, and
// the same match with no row leaves them locked instead of reading the silence
// as zero goals and zero cards.
// ---------------------------------------------------------------------------

/** The ids that can only be decided by a match report. */
const LEDGER_IDS = [
  "player-two-goals-in-a-match",
  "player-three-goals-in-a-match",
  "player-four-goals-in-a-match",
  "player-scoring-run-three",
  "player-scoring-run-five",
  "player-three-scoring-runs",
  "player-first-scorer-of-the-season",
  "player-two-cards-in-a-match",
  "player-yellows-in-a-row",
];

/** The cup match of 17 November 2026, as the calendar publishes it: 3-4. */
const cupNight = () =>
  match({ competitionKey: "cup", matchday: 1, date: "2026-11-17", own: 3, against: 4 });

/** Its acta: Rup twice, Cristian once, no cards for AC FRÍO. */
const cupActa = () => ({
  competition: "cup",
  matchday: 1,
  date: "2026-11-17",
  goals: [
    { player: "Rup", goals: 2 },
    { player: "Cristian", goals: 1 },
  ],
  cards: [],
});

test("a match with an acta proves its entries, and the same match without one leaves them locked", () => {
  const withActa = evaluateAchievements({
    fixtures: [cupNight()],
    record: recordOf({}),
    ledger: [cupActa()],
  });
  assert.ok(withActa.player.unlocked.includes("player-two-goals-in-a-match"));
  assert.equal(
    withActa.player.unlocked.includes("player-three-goals-in-a-match"),
    false,
    "two goals in one match are a double, not a hat-trick",
  );
  assert.equal(withActa.facts.ledgerMatches, 1);
  assert.equal(withActa.facts.ledgerPlayed, 1);

  const withoutActa = evaluateAchievements({
    fixtures: [cupNight()],
    record: recordOf({}),
    ledger: [],
  });
  for (const id of LEDGER_IDS) {
    assert.equal(
      withoutActa.player.unlocked.includes(id),
      false,
      `${id} must stay locked when the match has no row`,
    );
  }
  assert.equal(withoutActa.facts.ledgerMatches, 0);
  assert.equal(withoutActa.facts.firstScorerKnown, false, "no acta is not a season without goals");
});

test("the acta transcribed today proves the cup double and nothing more", () => {
  /*
   * A small version of the real season: the three league matchdays that only
   * have season totals, and the cup night that has an acta. No ledger in the
   * input, so this reads the file the site ships.
   */
  const season = [
    match({ matchday: 1, date: "2026-10-22", own: 0, against: 0 }),
    match({ matchday: 2, date: "2026-10-29", own: 5, against: 2 }),
    match({ matchday: 3, date: "2026-11-05", own: 2, against: 6 }),
    cupNight(),
  ];
  const result = evaluateAchievements({ fixtures: season, record: recordOf({}) });

  assert.ok(result.player.unlocked.includes("player-two-goals-in-a-match"));
  assert.equal(result.player.unlocked.includes("player-three-goals-in-a-match"), false);
  assert.equal(result.player.unlocked.includes("player-four-goals-in-a-match"), false);
  assert.equal(
    result.player.unlocked.includes("player-two-cards-in-a-match"),
    false,
    "the cup acta records no cards for AC FRÍO",
  );
  assert.equal(result.player.unlocked.includes("player-yellows-in-a-row"), false);
  assert.equal(
    result.player.unlocked.includes("player-first-scorer-of-the-season"),
    false,
    "the league reports are still missing, so the first goal of the season is unknown",
  );
  assert.deepEqual(result.facts.ledgerPlayers, [
    { key: "RUP", name: "Rup", goals: 2, yellow: 0, red: 0, matchesScored: 1 },
    { key: "CRISTIAN", name: "Cristian", goals: 1, yellow: 0, red: 0, matchesScored: 1 },
  ]);
});

test("a season with no ledger at all stays green", () => {
  /* The shipped ledger holds the cup match, so a league-only season joins nothing. */
  const result = evaluateAchievements({
    fixtures: [match({ matchday: 1, date: day(1), own: 2, against: 0 })],
    record: recordOf({
      cards: [],
      scorers: [{ player: "Albert", goals: 1, league: 1, cup: 0 }],
    }),
  });

  assert.ok(result.team.unlocked.includes("team-first-win"));
  assert.ok(result.player.unlocked.includes("player-first-goal"));
  for (const id of LEDGER_IDS) {
    assert.equal(result.player.unlocked.includes(id), false, `${id} needs a row for its own match`);
  }
  assert.equal(result.facts.ledgerPlayed, 1);
  assert.equal(result.facts.ledgerMatches, 0);
});

test("a scoring run counts consecutive actas, and a missing one breaks it", () => {
  const fixtures = [1, 2, 3, 4].map((matchday) =>
    match({ matchday, date: day(matchday), own: 2, against: 0 }),
  );
  const rows = (matchdays) =>
    matchdays.map((matchday) => ({
      competition: "league",
      matchday,
      goals: [{ player: "Albert", goals: 1 }],
      cards: [],
    }));

  const four = evaluateAchievements({ fixtures, record: recordOf({}), ledger: rows([1, 2, 3, 4]) });
  assert.equal(four.facts.bestScoringRun, 4);
  assert.ok(four.player.unlocked.includes("player-scoring-run-three"));
  assert.equal(four.player.unlocked.includes("player-scoring-run-five"), false);

  const gap = evaluateAchievements({ fixtures, record: recordOf({}), ledger: rows([1, 2, 4]) });
  assert.equal(
    gap.facts.bestScoringRun,
    2,
    "matchdays 1 and 2 are a run of two, and the gap at 3 stops it reaching three",
  );
  assert.equal(gap.player.unlocked.includes("player-scoring-run-three"), false);

  /* The acta of matchday 2 was read and names somebody else: that breaks a run. */
  const silent = evaluateAchievements({
    fixtures,
    record: recordOf({}),
    ledger: [
      ...rows([1]),
      { competition: "league", matchday: 2, goals: [{ player: "Pau", goals: 1 }], cards: [] },
      ...rows([3, 4]),
    ],
  });
  assert.equal(silent.facts.bestScoringRun, 2);
  assert.equal(silent.player.unlocked.includes("player-scoring-run-three"), false);
});

test("three separate scoring runs are not one long one", () => {
  const fixtures = Array.from({ length: 11 }, (_, index) =>
    match({ matchday: index + 1, date: day(index + 1), own: 1, against: 0 }),
  );
  const rowsFor = (matchdays) =>
    matchdays.map((matchday) => ({
      competition: "league",
      matchday,
      goals: [{ player: "Albert", goals: 1 }],
      cards: [],
    }));
  /* Rows for every played match; the two gaps are actas that name somebody else. */
  const gap = (matchday) => ({
    competition: "league",
    matchday,
    goals: [{ player: "Pau", goals: 1 }],
    cards: [],
  });

  const threeRuns = evaluateAchievements({
    fixtures,
    record: recordOf({}),
    ledger: [
      ...rowsFor([1, 2, 3]),
      gap(4),
      ...rowsFor([5, 6, 7]),
      gap(8),
      ...rowsFor([9, 10, 11]),
    ],
  });
  assert.equal(threeRuns.facts.threeMatchScoringRuns, 3);
  assert.ok(threeRuns.player.unlocked.includes("player-three-scoring-runs"));

  const oneRun = evaluateAchievements({
    fixtures,
    record: recordOf({}),
    ledger: rowsFor([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]),
  });
  assert.equal(oneRun.facts.bestScoringRun, 11);
  assert.equal(oneRun.facts.threeMatchScoringRuns, 1, "an eleven-match run is one run, not three");
  assert.equal(oneRun.player.unlocked.includes("player-three-scoring-runs"), false);
});

test("two cards in one acta, and a yellow on three consecutive jornadas", () => {
  const fixtures = [1, 2, 3].map((matchday) =>
    match({ matchday, date: day(matchday), own: 0, against: 0 }),
  );
  const booking = (matchday, cards, competitionKey = "league") => ({
    competition: competitionKey,
    matchday,
    goals: [],
    cards,
  });

  const result = evaluateAchievements({
    fixtures,
    record: recordOf({}),
    ledger: [
      booking(1, [{ player: "Jonay", type: "yellow" }]),
      booking(2, [
        { player: "Jonay", type: "yellow" },
        { player: "Jonay", type: "red" },
      ]),
      booking(3, [{ player: "Jonay", type: "yellow" }]),
    ],
  });
  assert.equal(result.facts.bestCardsInAMatch, 2);
  assert.equal(result.facts.yellowRun, 3);
  assert.ok(result.player.unlocked.includes("player-two-cards-in-a-match"));
  assert.ok(result.player.unlocked.includes("player-yellows-in-a-row"));

  /* League matchday 1 and cup matchday 1 are not consecutive jornadas. */
  const split = evaluateAchievements({
    fixtures: [
      match({ matchday: 1, date: day(1), own: 0, against: 0 }),
      match({ competitionKey: "cup", matchday: 1, date: day(2), own: 0, against: 0 }),
      match({ competitionKey: "cup", matchday: 2, date: day(3), own: 0, against: 0 }),
    ],
    record: recordOf({}),
    ledger: [
      booking(1, [{ player: "Jonay", type: "yellow" }]),
      booking(1, [{ player: "Jonay", type: "yellow" }], "cup"),
      booking(2, [{ player: "Jonay", type: "yellow" }], "cup"),
    ],
  });
  assert.equal(split.facts.yellowRun, 2);
  assert.equal(split.player.unlocked.includes("player-yellows-in-a-row"), false);

  /* A jornada with no acta breaks the chain instead of counting as clean. */
  const gap = evaluateAchievements({
    fixtures,
    record: recordOf({}),
    ledger: [
      booking(1, [{ player: "Jonay", type: "yellow" }]),
      booking(3, [{ player: "Jonay", type: "yellow" }]),
    ],
  });
  assert.equal(gap.facts.yellowRun, 1);
  assert.equal(gap.player.unlocked.includes("player-yellows-in-a-row"), false);
});

test("the first goal of the season waits for the earlier actas", () => {
  const fixtures = [
    match({ matchday: 1, date: day(1), own: 1, against: 0 }),
    match({ matchday: 2, date: day(8), own: 1, against: 0 }),
  ];
  const secondNight = {
    competition: "league",
    matchday: 2,
    goals: [{ player: "Albert", goals: 1 }],
    cards: [],
  };

  const blind = evaluateAchievements({ fixtures, record: recordOf({}), ledger: [secondNight] });
  assert.equal(blind.facts.firstScorerKnown, false, "matchday 1 has no acta");
  assert.deepEqual(blind.facts.firstScorers, []);
  assert.equal(blind.player.unlocked.includes("player-first-scorer-of-the-season"), false);

  const full = evaluateAchievements({
    fixtures,
    record: recordOf({}),
    ledger: [
      { competition: "league", matchday: 1, goals: [{ player: "Pau", goals: 1 }], cards: [] },
      secondNight,
    ],
  });
  assert.equal(full.facts.firstScorerKnown, true);
  assert.deepEqual(full.facts.firstScorers, ["Pau"]);
  assert.ok(full.player.unlocked.includes("player-first-scorer-of-the-season"));
});

test("a row for a match the calendar has not played proves nothing", () => {
  const fixtures = [
    match({ matchday: 1, date: day(1), own: 0, against: 0 }),
    pending({ matchday: 2, date: day(8) }),
  ];
  const result = evaluateAchievements({
    fixtures,
    record: recordOf({}),
    ledger: [{ competition: "league", matchday: 2, goals: [{ player: "Albert", goals: 2 }], cards: [] }],
  });

  assert.equal(result.facts.ledgerPlayed, 1, "the pending fixture is not a played match");
  assert.equal(result.facts.ledgerMatches, 0, "the only row is a match nobody has played");
  for (const id of LEDGER_IDS) {
    assert.equal(
      result.player.unlocked.includes(id),
      false,
      `${id} needs a played match with an acta`,
    );
  }
});

test("a broken acta row is unknown, not an empty one", () => {
  const broken = evaluateAchievements({
    fixtures: [cupNight()],
    record: recordOf({}),
    ledger: [{ ...cupActa(), goals: [{ player: "Rup", goals: 2 }, { goals: 1 }] }],
  });

  assert.equal(broken.facts.ledgerMatches, 0);
  assert.equal(broken.player.unlocked.includes("player-two-goals-in-a-match"), false);
  /* The rest of the catalogue does not depend on the ledger, so it still decides. */
  assert.equal(broken.team.unlocked.includes("team-three-goals"), true);
});

// ---------------------------------------------------------------------------
// The explanation closes (S6)
//
// No DOM in this suite, so this one reads the source it guards, the same way the
// icon registry test above does. What it pins is the pair that left the card up
// on a phone: the dialog takes the focus when it opens, so the tile is blurred
// while its own card is on screen. Closing on that blur handed the focus back to
// the tile, the tile reopened the card on the focus it had just been given, and
// Escape, «Cerrar» and a tap on the ground all came back to life a frame later.
// ---------------------------------------------------------------------------

test("the tile does not close the card on the blur its own card caused", async () => {
  const { readFileSync } = await import("node:fs");
  const source = readFileSync(
    new URL("../src/components/AchievementsGrid.jsx", import.meta.url),
    "utf8",
  ).replace(/\r\n/g, "\n");

  assert.ok(
    !/onBlur=\{laterClose\}/.test(source),
    "a blur closes the card only when the focus went somewhere else",
  );
  assert.match(source, /onBlur=\{closeOnBlur\}/);
  assert.match(
    source,
    /panel\.current\?\.contains\(event\.relatedTarget\)/,
    "the card taking the focus is the card opening, not the reader leaving",
  );
  assert.match(
    source,
    /if \(returningFocus\.current\)/,
    "the focus handed back to the tile is not the reader arriving",
  );
  assert.match(
    source,
    /wasOpen: open/,
    "the press notes whether the card was already open before the gesture",
  );
  assert.match(
    source,
    /setOpen\(started \? !started\.wasOpen : true\)/,
    "a press toggles what the gesture found, so a second press closes what the first opened",
  );
  assert.ok(
    source.includes('if (event.key === "Escape") onClose();'),
    "Escape is one of the ways out, and it goes through the same close",
  );
});
