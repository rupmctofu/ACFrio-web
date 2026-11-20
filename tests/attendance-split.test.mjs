import assert from "node:assert/strict";
import test from "node:test";
import { splitAnswers } from "../src/lib/attendance-split.js";

/**
 * The attendance card draws the faces of who is coming and, under them, the
 * names of who answered that they are not. That second list is a decision the
 * owner made after seeing the card without it («ahora no aparecen los que han
 * votado que no asisten»), and it is the only place those names exist: the
 * headcount above it counts confirmations, so a bug here loses the players
 * silently instead of failing loudly.
 */
const squad = new Map([
  [1, { id: 1, name: "Geri" }],
  [2, { id: 2, name: "Jonay" }],
  [3, { id: 3, name: "Nil" }],
  [4, { id: 4, name: "José" }],
]);

test("an answer of no lands in its own list, and not among the faces", () => {
  const { going, out } = splitAnswers({ 1: "in", 2: "out", 3: "in", 4: "out" }, squad);

  assert.deepEqual(going.map((player) => player.name), ["Geri", "Nil"]);
  assert.deepEqual(out.map((player) => player.name), ["Jonay", "José"]);
});

test("the names follow the squad's own order, which is how the answers arrive", () => {
  const { out } = splitAnswers({ 4: "out", 2: "out", 3: "out" }, squad);

  /* Player ids are integers, so `Object.entries` hands them back sorted by id
     and not by the order they were written: the line reads in squad order. */
  assert.deepEqual(out.map((player) => player.name), ["Jonay", "Nil", "José"]);
});

test("an answer from someone off the squad is dropped, not invented", () => {
  const { going, out } = splitAnswers({ 1: "in", 99: "out", 2: "out" }, squad);

  assert.deepEqual(going.map((player) => player.name), ["Geri"]);
  assert.deepEqual(out.map((player) => player.name), ["Jonay"]);
});

test("nobody has answered yet", () => {
  const { going, out } = splitAnswers({}, squad);

  assert.deepEqual(going, []);
  assert.deepEqual(out, []);
});

test("a status the card does not know is neither coming nor not coming", () => {
  const { going, out } = splitAnswers({ 1: "maybe", 2: "out" }, squad);

  assert.deepEqual(going, []);
  assert.deepEqual(out.map((player) => player.name), ["Jonay"]);
});
