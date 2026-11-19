/*
 * The availability of the squad for one match.
 *
 * Fifteen players, seven-a-side football: a match can be played from the
 * seventh confirmation on. The percentage is the whole squad as the
 * denominator, which is what the block prints, so this stays a pure function
 * of the answers the attendance store already holds.
 */
import { test } from "node:test";
import assert from "node:assert/strict";

import { availabilityOf, PLAYERS_NEEDED } from "../src/lib/availability.js";

const SQUAD = 15;

test("seven players are what a seven-a-side match needs", () => {
  assert.equal(PLAYERS_NEEDED, 7);
});

test("no confirmations: an empty grey bar and seven players still missing", () => {
  assert.deepEqual(availabilityOf(0, SQUAD), {
    going: 0,
    total: 15,
    percent: 0,
    ready: false,
    missing: 7,
  });
});

test("six confirmations are still not a match", () => {
  const state = availabilityOf(6, SQUAD);
  assert.equal(state.percent, 40);
  assert.equal(state.ready, false);
  assert.equal(state.missing, 1);
});

test("the seventh confirmation turns the bar red", () => {
  const state = availabilityOf(7, SQUAD);
  assert.equal(state.ready, true);
  assert.equal(state.missing, 0);
  assert.equal(state.percent, 47);
});

test("nine confirmations are sixty per cent of the squad", () => {
  const state = availabilityOf(9, SQUAD);
  assert.equal(state.percent, 60);
  assert.equal(state.ready, true);
  assert.equal(state.missing, 0);
});

test("everybody confirmed fills the bar", () => {
  const state = availabilityOf(15, SQUAD);
  assert.equal(state.percent, 100);
  assert.equal(state.ready, true);
});

test("a squad number above the list never overflows the bar", () => {
  const state = availabilityOf(17, SQUAD);
  assert.equal(state.percent, 100);
  assert.equal(state.going, 17);
});

test("an empty squad is not a division by zero", () => {
  assert.deepEqual(availabilityOf(3, 0), {
    going: 3,
    total: 0,
    percent: 0,
    ready: false,
    missing: 4,
  });
});

test("garbage in never breaks the bar", () => {
  for (const [confirmed, squad] of [[-4, SQUAD], [Number.NaN, SQUAD], [5, Number.NaN], [5, -3], [undefined, SQUAD]]) {
    const state = availabilityOf(confirmed, squad);
    assert.ok(state.percent >= 0 && state.percent <= 100, `percent out of range: ${state.percent}`);
    assert.equal(typeof state.ready, "boolean");
    assert.ok(state.missing >= 0);
  }
});
