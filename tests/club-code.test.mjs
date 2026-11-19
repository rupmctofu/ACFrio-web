import test from "node:test";
import assert from "node:assert/strict";
import { codeFor, parseCode, resolvePlayer } from "../src/lib/club-code.js";
import teamData from "../src/data/teamData.json" with { type: "json" };

const squad = teamData.squad;

test("every player gets a code from their name and number", () => {
  const rup = squad.find((player) => player.name === "Rup");
  const cristian = squad.find((player) => player.name === "Cristian");
  assert.equal(codeFor(rup), "ACF-RUP-8");
  assert.equal(codeFor(cristian), "ACF-CRISTIAN-23");
});

test("accents and spaces do not survive into the code", () => {
  const marti = squad.find((player) => player.name === "Martí");
  assert.equal(codeFor(marti), "ACF-MARTI-9");
});

test("a player with no shirt number falls back to the squad id", () => {
  const genis = squad.find((player) => player.name === "Genís");
  assert.equal(codeFor(genis), `ACF-GENIS-${genis.id}`);
});

test("no two players share a code", () => {
  const codes = squad.map(codeFor);
  assert.equal(new Set(codes).size, codes.length);
  assert.equal(codes.filter(Boolean).length, codes.length);
});

test("what people actually type still resolves", () => {
  const rup = squad.find((player) => player.name === "Rup");
  for (const typed of ["ACF-RUP-8", "acf-rup-8", " ACF RUP 8 ", "Acf-rup-8"]) {
    assert.equal(resolvePlayer(typed, squad)?.name, rup.name, `typed: ${typed}`);
  }
});

test("a wrong number, a wrong name or a wrong prefix resolves to nobody", () => {
  assert.equal(resolvePlayer("ACF-RUP-9", squad), null);
  assert.equal(resolvePlayer("ACF-NOEXISTE-8", squad), null);
  assert.equal(resolvePlayer("XYZ-RUP-8", squad), null);
  assert.equal(resolvePlayer("ACF-RUP", squad), null);
  assert.equal(resolvePlayer("", squad), null);
  assert.equal(resolvePlayer(null, squad), null);
});

test("every code round-trips back to its own player", () => {
  for (const player of squad) {
    assert.equal(resolvePlayer(codeFor(player), squad)?.id, player.id);
  }
});

test("the parser rejects a code whose number is not a number", () => {
  assert.equal(parseCode("ACF-RUP-OCHO"), null);
  assert.deepEqual(parseCode("ACF-RUP-8"), { name: "RUP", number: "8" });
});
