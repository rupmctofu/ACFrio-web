/**
 * The per-match ledger (src/data/match-ledger.json): what the acta of ONE match
 * says about goals and cards.
 *
 * Why this file exists: the season totals in src/data/club-record.json answer
 * "how many goals has he scored", and the league/cup split answers "in which
 * competition". Neither can answer "what happened in this one match", so every
 * achievement that needs a single afternoon — a double, a hat-trick, a scoring
 * run, two cards in the same game — had nowhere to read from and was left out of
 * the catalogue as impossible. It was not impossible: the owner sends the acta
 * every week and the acta carries exactly that. This module is the only reader
 * of the transcribed ledger; an evaluator asks it about a match and never
 * touches the JSON.
 *
 * The one rule that shapes every return value here: an absent row means UNKNOWN,
 * never zero. The league matchdays 1-3 of 2026-2027 have season totals and one
 * `yellowAt` in club-record.json but no transcribed acta, so no row mentions
 * them — and that must never be read as "nobody scored and nobody was booked".
 * A row that exists but cannot be parsed is treated the same way: half a report
 * is not a report, so the whole row degrades to unknown instead of contributing
 * a number that might be too small.
 *
 * A row with `goals: []` or `cards: []` is the opposite case and it is a fact:
 * the acta was read and it lists nobody. That distinction is the reason
 * `matchGoals()` reports `known` next to the numbers instead of returning 0.
 */
import ledgerSource from "../data/match-ledger.json" with { type: "json" };
import { normalise } from "./club-code.js";

export const YELLOW = "yellow";
export const RED = "red";

const asArray = (value) => (Array.isArray(value) ? value : []);

/** A whole positive number: a matchday, or a count of goals. `1` is not `"1"`. */
const isPositiveInteger = (value) =>
  typeof value === "number" && Number.isInteger(value) && value > 0;

/**
 * The key a played fixture and a ledger row are joined on: competition and
 * matchday, the same `${competitionKey}:${matchday}` the evaluator builds. The
 * date is carried for the reader, not for the join: a rescheduled match keeps
 * its matchday, and the two sources must agree on the thing that never moves.
 */
export function matchKey(competition, matchday) {
  const key = typeof competition === "string" ? competition.trim() : "";
  if (!key || !isPositiveInteger(matchday)) return null;
  return `${key}:${matchday}`;
}

/** A player name and its identity key, or null when the entry cannot name anyone. */
function readPerson(entry) {
  if (!entry || typeof entry !== "object") return null;
  const name = typeof entry.player === "string" ? entry.player.trim() : "";
  const key = normalise(name);
  if (!key) return null;
  return { name, key };
}

/**
 * The goals of one row, or null when any line is unusable.
 *
 * `null` and not "the lines I could read": a goal line that lost its player or
 * its count would understate the match, and an understated report is exactly the
 * kind of half-truth this module exists to refuse.
 */
function readGoals(raw) {
  if (!Array.isArray(raw)) return null;
  const goals = [];
  for (const entry of raw) {
    const person = readPerson(entry);
    if (!person || !isPositiveInteger(entry.goals)) return null;
    goals.push({ ...person, goals: entry.goals });
  }
  return goals;
}

/** The cards of one row, or null when any line is unusable. */
function readCards(raw) {
  if (!Array.isArray(raw)) return null;
  const cards = [];
  for (const entry of raw) {
    const person = readPerson(entry);
    const type = entry?.type;
    if (!person || (type !== YELLOW && type !== RED)) return null;
    cards.push({ ...person, type });
  }
  return cards;
}

/** One ledger row, normalised, or null when it cannot be trusted as a whole. */
function readRow(raw) {
  if (!raw || typeof raw !== "object") return null;
  const competition = typeof raw.competition === "string" ? raw.competition.trim() : "";
  if (!competition || !isPositiveInteger(raw.matchday)) return null;

  const goals = readGoals(raw.goals);
  const cards = readCards(raw.cards);
  if (!goals || !cards) return null;

  return {
    competition,
    matchday: raw.matchday,
    key: `${competition}:${raw.matchday}`,
    date: typeof raw.date === "string" && raw.date !== "" ? raw.date : null,
    goals,
    cards,
    goalCount: goals.reduce((total, goal) => total + goal.goals, 0),
    yellowCount: cards.filter((card) => card.type === YELLOW).length,
    redCount: cards.filter((card) => card.type === RED).length,
  };
}

/**
 * The ledger as a lookup of usable rows.
 *
 * `source` is the JSON shape ({ matches: [...] }) or the bare array of rows, so a
 * test can hand over one match without building a file. Anything else — null,
 * a string, an object with no `matches` — is an empty ledger: no rows, no
 * claims, no crash.
 */
export function readLedger(source) {
  const rows = Array.isArray(source) ? source : asArray(source?.matches);
  const matches = new Map();
  for (const raw of rows) {
    const row = readRow(raw);
    if (!row) continue;
    /* The same match twice is a duplicate in a hand-kept file. The first report
       wins: averaging or adding two transcriptions of one acta would invent a
       figure that neither of them contains. */
    if (matches.has(row.key)) continue;
    matches.set(row.key, row);
  }

  return {
    season: typeof source?.season === "string" ? source.season : null,
    updatedAt: typeof source?.updatedAt === "string" ? source.updatedAt : null,
    matches,
  };
}

/**
 * The league and cup ledger the club has transcribed so far, read once.
 *
 * It is the default the evaluator uses; everything below is a pure function of
 * a ledger handed in, which is what lets a test ask "what if this match had no
 * report" without touching the file.
 */
export const clubLedger = readLedger(ledgerSource);

/** The row of one match, or null. Null is "no report", not "nothing happened". */
export function ledgerRow(ledger, competition, matchday) {
  const key = matchKey(competition, matchday);
  if (!key || !ledger?.matches?.has(key)) return null;
  return ledger.matches.get(key) ?? null;
}

/**
 * The goals of one match.
 *
 * `known: false` means there is no usable report for that competition and
 * matchday, and `total` is then null rather than 0 so a caller cannot add it up
 * by accident. `known: true` with `total: 0` is the documented scoreless match.
 */
export function matchGoals(ledger, competition, matchday) {
  const row = ledgerRow(ledger, competition, matchday);
  if (!row) return { known: false, goals: [], total: null };
  return {
    known: true,
    goals: row.goals.map((goal) => ({ name: goal.name, key: goal.key, goals: goal.goals })),
    total: row.goalCount,
  };
}

/** The cards of one match, with the same known/unknown contract as `matchGoals`. */
export function matchCards(ledger, competition, matchday) {
  const row = ledgerRow(ledger, competition, matchday);
  if (!row) return { known: false, cards: [], yellow: null, red: null };
  return {
    known: true,
    cards: row.cards.map((card) => ({ name: card.name, key: card.key, type: card.type })),
    yellow: row.yellowCount,
    red: row.redCount,
  };
}

/**
 * Per-player totals derived from the rows: goals, yellows and reds, keyed by the
 * normalised name src/lib/club-code.js already uses, so "Rúp" and "Rup" are the
 * same player.
 *
 * These are the acta's own figures and they are NOT the season totals in
 * club-record.json: the record is the club's running count, this is the sum of
 * the matches whose acta has been transcribed. Adding the two would count a
 * match twice, so they stay apart on purpose.
 *
 * `keys` restricts the sum to those match keys (the evaluator passes the played
 * ones), because a row the calendar has not played yet is a report of something
 * that has not happened yet.
 *
 * `known: false` means there is not one usable row: the totals are unknown, not
 * zero, and `players` is empty rather than a list of zeroes.
 */
export function playerTotals(ledger, keys = null) {
  const wanted = keys ? new Set(keys) : null;
  const players = new Map();
  let matches = 0;

  const ensure = (person) => {
    if (!players.has(person.key)) {
      players.set(person.key, {
        key: person.key,
        name: person.name,
        goals: 0,
        yellow: 0,
        red: 0,
        matchesScored: 0,
      });
    }
    return players.get(person.key);
  };

  for (const row of ledger?.matches?.values() ?? []) {
    if (wanted && !wanted.has(row.key)) continue;
    matches += 1;
    for (const goal of row.goals) {
      const player = ensure(goal);
      player.goals += goal.goals;
      player.matchesScored += 1;
    }
    for (const card of row.cards) {
      const player = ensure(card);
      if (card.type === YELLOW) player.yellow += 1;
      else player.red += 1;
    }
  }

  return {
    known: matches > 0,
    matches,
    players: [...players.values()].sort(
      (a, b) => b.goals - a.goals || a.name.localeCompare(b.name),
    ),
  };
}
