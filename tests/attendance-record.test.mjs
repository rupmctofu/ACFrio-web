/*
 * The attendance denominator, per player (S12).
 *
 * The club's record holds matchdays — who turned up — and no dates. The
 * calendar holds the dates of the matches actually played. A player who joined
 * in November cannot be measured against the October matches he was not there
 * for, so his denominator starts at the first fixture after his `joinedAt`
 * instead of the club's whole total. The owner, in his own words: "Jenis ha
 * entrado al equipo más tarde, entonces yo le pondría asistencia cien por cien,
 * pero que ha venido a uno de un partido".
 *
 * The arithmetic is tested on a small synthetic record: four played fixtures
 * and four matchdays, three players, one of them brand new.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

/*
 * `src/data/club-record.js` is written for the bundler: it imports its two JSON
 * neighbours without an import attribute (which Node refuses) and its sibling
 * modules without an extension (which Node cannot resolve). One hook teaches
 * the loader those two Vite habits, so the test can import the module that
 * actually ships instead of a copy of its arithmetic that could drift.
 */
registerHooks({
  resolve(specifier, context, next) {
    const relative = specifier.startsWith("./") || specifier.startsWith("../");
    if (relative && !/\.[a-z]+$/i.test(specifier)) return next(`${specifier}.js`, context);
    return next(specifier, context);
  },
  load(url, context, next) {
    if (url.endsWith(".json")) {
      return {
        format: "json",
        source: readFileSync(fileURLToPath(url), "utf8"),
        shortCircuit: true,
      };
    }
    return next(url, context);
  },
});

const { attendanceRows } = await import("../src/data/club-record.js");

/* Four played fixtures: three in October, the cup one in mid-November. */
const FIXTURES = ["2026-10-22", "2026-10-29", "2026-11-05", "2026-11-17"].map((date) => ({
  date,
  status: "played",
}));

/* The same four matches as the club lists them: names only, no dates of their own. */
const MATCHDAYS = [
  { competition: "league", matchday: 1, players: ["Veterano", "Intermitente"] },
  { competition: "league", matchday: 2, players: ["Veterano", "Intermitente"] },
  { competition: "league", matchday: 3, players: ["Veterano"] },
  { competition: "cup", matchday: 1, players: ["Veterano", "Intermitente", "Recién llegado"] },
];

/* Only the late arrival carries a join date; the others were here from match one. */
const joinedAt = (name) => (name === "Recién llegado" ? "2026-11-17" : null);

const rowOf = (rows, name) => rows.find((row) => row.name === name);

test("a late arrival is measured from the first match he could have played", () => {
  const rows = attendanceRows({ matchdays: MATCHDAYS, fixtures: FIXTURES, joinedAt });

  // One appearance out of the one match played since he joined: a hundred per cent.
  assert.deepEqual(rowOf(rows, "Recién llegado"), {
    name: "Recién llegado",
    count: 1,
    of: 1,
    pct: 100,
  });
});

test("a player with no join date keeps the whole club total", () => {
  const rows = attendanceRows({ matchdays: MATCHDAYS, fixtures: FIXTURES, joinedAt });

  assert.equal(rowOf(rows, "Veterano").of, FIXTURES.length);
  assert.equal(rowOf(rows, "Veterano").count, 4);
  assert.equal(rowOf(rows, "Veterano").pct, 100);

  // Three of four, still the club-wide denominator: no join date, no exemption.
  assert.equal(rowOf(rows, "Intermitente").of, FIXTURES.length);
  assert.equal(rowOf(rows, "Intermitente").pct, 75);
});

test("a player who joined after the last match played reads zero, not a division by zero", () => {
  const rows = attendanceRows({
    matchdays: MATCHDAYS,
    fixtures: FIXTURES,
    joinedAt: (name) => (name === "Recién llegado" ? "2026-12-01" : null),
  });

  assert.equal(rowOf(rows, "Recién llegado").of, 0);
  assert.equal(rowOf(rows, "Recién llegado").pct, 0);
});
