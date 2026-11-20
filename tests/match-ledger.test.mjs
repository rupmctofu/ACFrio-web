import test from "node:test";
import assert from "node:assert/strict";

/**
 * The per-match ledger and the one rule it exists to enforce: a match with no
 * row is UNKNOWN, never zero.
 *
 * The league matchdays 1-3 of 2026-2027 already have season totals in
 * src/data/club-record.json, but nobody has transcribed their actas. If this
 * module answered "0 goals, 0 cards" for those matches, every entry that needs a
 * single afternoon would be silently decided on data nobody has — the wrong
 * direction of doubt. So the tests below spend most of their lines on the
 * difference between "the acta says nobody" (a known empty list) and "there is no
 * acta" (unknown), and on malformed rows, which are treated as the second.
 *
 * The shipped file is read here on purpose: it is the only place that proves the
 * ledger holds the cup match and nothing it cannot prove.
 */

const {
  clubLedger,
  ledgerRow,
  matchCards,
  matchGoals,
  matchKey,
  playerTotals,
  readLedger,
} = await import("../src/lib/match-ledger.js");

/** A row as the file writes it, so a test can change one field. */
const row = (overrides = {}) => ({
  competition: "cup",
  matchday: 1,
  date: "2026-11-17",
  goals: [{ player: "Rup", goals: 2 }],
  cards: [],
  ...overrides,
});

// ---------------------------------------------------------------------------
// The join
// ---------------------------------------------------------------------------

test("a row and a fixture are joined on competition and matchday, nothing else", () => {
  assert.equal(matchKey("cup", 1), "cup:1");
  assert.equal(matchKey(" league ", 3), "league:3");
  assert.equal(matchKey("cup", "1"), null, "a matchday that is a string is not a matchday");
  assert.equal(matchKey("cup", 0), null);
  assert.equal(matchKey("", 1), null);
  assert.equal(matchKey(null, 1), null);
});

test("the date is carried for the reader, not for the join", () => {
  const ledger = readLedger([row({ date: undefined })]);
  assert.equal(matchGoals(ledger, "cup", 1).known, true, "a row with no date still joins");
  assert.equal(ledgerRow(ledger, "cup", 1).date, null);
});

// ---------------------------------------------------------------------------
// What the club can prove today
// ---------------------------------------------------------------------------

test("the cup match of 17 November is two for Rup, one for Cristian, no cards", () => {
  const goals = matchGoals(clubLedger, "cup", 1);
  assert.equal(goals.known, true);
  assert.equal(goals.total, 3);
  assert.deepEqual(
    goals.goals.map((goal) => [goal.name, goal.goals]),
    [
      ["Rup", 2],
      ["Cristian", 1],
    ],
  );

  /* The acta was read and it lists no card for AC FRÍO: a record of zero. */
  const cards = matchCards(clubLedger, "cup", 1);
  assert.equal(cards.known, true);
  assert.deepEqual(cards.cards, []);
  assert.equal(cards.yellow, 0);
  assert.equal(cards.red, 0);
});

test("the league matchdays with only season totals are unknown, not zero", () => {
  for (const matchday of [1, 2, 3]) {
    const goals = matchGoals(clubLedger, "league", matchday);
    assert.equal(goals.known, false, `league matchday ${matchday} has no acta transcribed`);
    assert.equal(goals.total, null, "an unknown total must not be addable as zero");
    assert.deepEqual(goals.goals, []);

    const cards = matchCards(clubLedger, "league", matchday);
    assert.equal(cards.known, false);
    assert.equal(cards.yellow, null);
    assert.equal(cards.red, null);
  }
});

test("the shipped ledger holds no matchday nobody transcribed", () => {
  /* Only the cup match has an acta. Any other row would be an invented report. */
  assert.deepEqual([...clubLedger.matches.keys()], ["cup:1"]);
});

// ---------------------------------------------------------------------------
// Empty is a fact, missing is not
// ---------------------------------------------------------------------------

test("an empty list is a report of nothing and a missing list is no report", () => {
  const scoreless = readLedger([row({ goals: [], cards: [] })]);
  assert.equal(matchGoals(scoreless, "cup", 1).known, true);
  assert.equal(matchGoals(scoreless, "cup", 1).total, 0);

  const halfReport = readLedger([row({ goals: undefined })]);
  assert.equal(matchGoals(halfReport, "cup", 1).known, false, "goals that are not a list are unknown");
  assert.equal(ledgerRow(halfReport, "cup", 1), null);
});

// ---------------------------------------------------------------------------
// Malformed rows degrade to unknown
// ---------------------------------------------------------------------------

test("a row that cannot be read in full degrades to unknown instead of a smaller figure", () => {
  const broken = [
    /* A row that is not an object. */
    null,
    "cup:1",
    /* No competition, no usable matchday. */
    row({ competition: undefined }),
    row({ matchday: 1.5 }),
    /* Goals that are not a list, or a line that lost its player or its count. */
    row({ goals: "dos" }),
    row({ goals: [{ player: "Rup" }] }),
    row({ goals: [{ goals: 2 }] }),
    row({ goals: [{ player: "   ", goals: 2 }] }),
    row({ goals: [{ player: "Rup", goals: 0 }] }),
    row({ goals: [{ player: "Rup", goals: "2" }] }),
    /* Cards with a colour the acta does not have. */
    row({ cards: [{ player: "Rup", type: "blue" }] }),
    row({ cards: [{ player: "Rup" }] }),
    row({ cards: "una" }),
  ];

  for (const raw of broken) {
    const ledger = readLedger([raw]);
    assert.equal(ledger.matches.size, 0, `${JSON.stringify(raw)} must not become a row`);
    assert.equal(matchGoals(ledger, "cup", 1).known, false);
    assert.equal(matchCards(ledger, "cup", 1).known, false);
  }
});

test("one bad line does not leave a half-read row behind", () => {
  const ledger = readLedger([
    row({
      goals: [
        { player: "Rup", goals: 2 },
        { player: "Cristian", goals: -1 },
      ],
    }),
  ]);
  /* Rup's two goals cannot be kept: the acta's total is not trustworthy. */
  assert.equal(matchGoals(ledger, "cup", 1).known, false);
  assert.equal(ledger.matches.size, 0);
});

test("the same match twice is one match, and the first report wins", () => {
  const ledger = readLedger([row(), row({ goals: [{ player: "Rup", goals: 5 }] })]);
  assert.equal(ledger.matches.size, 1);
  assert.equal(matchGoals(ledger, "cup", 1).total, 2, "two transcriptions of one acta are not two matches");
});

test("a ledger that is not a list of rows is an empty ledger, not a crash", () => {
  for (const source of [null, undefined, {}, { matches: null }, { matches: "nope" }, 42]) {
    const ledger = readLedger(source);
    assert.equal(ledger.matches.size, 0);
    assert.equal(matchGoals(ledger, "cup", 1).known, false);
  }
});

test("a bare array of rows is accepted, so a test can hand over one match", () => {
  const ledger = readLedger([row()]);
  assert.equal(matchGoals(ledger, "cup", 1).total, 2);
  assert.equal(ledger.season, null, "a bare array carries no season of its own");
});

// ---------------------------------------------------------------------------
// Per-player totals
// ---------------------------------------------------------------------------

test("per-player totals add the rows, by normalised name", () => {
  const ledger = readLedger([
    row({
      goals: [
        { player: "Rúp", goals: 2 },
        { player: "Cristian", goals: 1 },
      ],
      cards: [
        { player: "Cristian", type: "yellow" },
        { player: "Cristian", type: "red" },
      ],
    }),
    row({ matchday: 2, goals: [{ player: "Rup", goals: 1 }], cards: [] }),
  ]);

  const totals = playerTotals(ledger);
  assert.equal(totals.known, true);
  assert.equal(totals.matches, 2);
  assert.deepEqual(
    totals.players.map((player) => [player.name, player.goals, player.yellow, player.red, player.matchesScored]),
    [
      ["Rúp", 3, 0, 0, 2],
      ["Cristian", 1, 1, 1, 1],
    ],
  );
});

test("no rows is an unknown total, not a list of zeroes", () => {
  const empty = readLedger([]);
  const totals = playerTotals(empty);
  assert.equal(totals.known, false);
  assert.equal(totals.matches, 0);
  assert.deepEqual(totals.players, []);
});

test("per-player totals can be limited to the matches the calendar has played", () => {
  const ledger = readLedger([row(), row({ matchday: 2, goals: [{ player: "Rup", goals: 3 }] })]);
  const played = playerTotals(ledger, ["cup:1"]);
  assert.equal(played.matches, 1);
  assert.deepEqual(played.players.map((player) => [player.name, player.goals]), [["Rup", 2]]);

  const nothingPlayed = playerTotals(ledger, ["league:1"]);
  assert.equal(nothingPlayed.known, false);
  assert.deepEqual(nothingPlayed.players, []);
});

test("the acta's totals are the transcribed matches, not the season record", () => {
  const totals = playerTotals(clubLedger);
  assert.equal(totals.matches, 1, "one acta, so one match's worth of goals");
  assert.deepEqual(
    totals.players.map((player) => [player.name, player.goals]),
    [
      ["Rup", 2],
      ["Cristian", 1],
    ],
  );
});
