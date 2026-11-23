/*
 * The identity of the attendance request for one fixture.
 *
 * `MatchAttendance`'s effect re-runs whenever its dependency changes, and the
 * fixture object it receives is a fresh copy on every call that builds it
 * (`nextFixtureOf` maps with `withCompetition`, and the card's clock ticks every
 * second). Depending on the object therefore means two requests per second, for
 * as long as the dashboard is open — measured at 25 fetches in 10 s in a real
 * browser.
 *
 * The dependency has to be the identity of the REQUEST, not of the object. That
 * identity is the argument list of `ensureMatch`: season, competition, matchday,
 * kickoff and rival. `matchKey` (competition + matchday) is not enough for it: a
 * fixture moved to a new kickoff keeps its competition and its matchday, and the
 * match row it points at is not the same one.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { matchLoadKey } from "../src/lib/attendance.js";

const fixture = (overrides = {}) => ({
  competitionKey: "league",
  matchday: 5,
  date: "2026-11-26",
  time: "22:30",
  home: { slug: "ac-frio", name: "AC FRÍO" },
  away: { slug: "kongitos", name: "Kongitos FC" },
  ...overrides,
});

test("two copies of one fixture are one request", () => {
  // Structurally equal, distinct objects: exactly what the card hands down every
  // second. Same key, or the effect fires once per tick.
  assert.equal(matchLoadKey(fixture()), matchLoadKey(fixture()));
});

test("a fixture moved to another kickoff is another request", () => {
  const moved = fixture({ time: "21:00" });
  assert.notEqual(matchLoadKey(fixture()), matchLoadKey(moved));
});

test("another matchday, competition or rival is another request", () => {
  const base = matchLoadKey(fixture());
  assert.notEqual(base, matchLoadKey(fixture({ matchday: 6 })));
  assert.notEqual(base, matchLoadKey(fixture({ competitionKey: "cup" })));
  assert.notEqual(
    base,
    matchLoadKey(fixture({ away: { slug: "rayo", name: "Rayo Bellaqueo" } })),
  );
});

test("no fixture is a key of its own, not a missing one", () => {
  assert.equal(typeof matchLoadKey(null), "string");
  assert.equal(matchLoadKey(null), matchLoadKey(undefined));
  assert.notEqual(matchLoadKey(null), matchLoadKey(fixture()));
});

test("the attendance block depends on that key, never on the fixture object", () => {
  // A source assertion, and it says so: without it, going back to `[fixture]`
  // passes every other test in this suite while putting two requests per second
  // back on the club's backend.
  const source = readFileSync(
    new URL("../src/components/MatchAttendance.jsx", import.meta.url),
    "utf8",
  );
  assert.doesNotMatch(source, /\}, \[fixture\]\);/, "the effect is not keyed on the object");
  assert.match(source, /\}, \[loadKey\]\);/, "it is keyed on the request");
  assert.match(source, /const loadKey = matchLoadKey\(fixture\);/, "and the key is the helper's");
});
