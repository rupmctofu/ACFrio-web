/*
 * The lift contract, seen from the outside.
 *
 * `tests/app-ready.test.mjs` covers the tracker as a state machine and
 * `tests/boot-splash.test.mjs` covers the curtain as markup. What is left is the
 * seam between them, and it is the least forgiving part: the two rules below are
 * the ones a regression would slip through, because nothing on screen would look
 * wrong until a field phone on a bad connection finds them.
 *
 * The third rule is deliberately structural. There is no DOM in this suite, so
 * the only way to pin "the curtain waits for the first read of a block, not for
 * its every refetch" is to read the two components. It is a source assertion, and
 * it says so: it exists because the alternative is a guarantee with no test at
 * all, guarding the one defence against a refetch loop that would otherwise hand
 * the curtain a signal that is busy half the time.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { createBootTracker } from "../src/lib/app-ready.js";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const html = read("../index.html");

test("a listener that throws after the lift cannot break the caller", () => {
  const boot = createBootTracker({ deadlineMs: 60_000 });
  boot.markMounted();
  assert.equal(boot.isBooted, true);

  // The settle path already isolates listeners from each other; a listener that
  // subscribes after the fact is called on the spot, and it must be isolated
  // the same way. Otherwise one buggy listener turns a page that is ready into
  // an exception thrown out of a React effect.
  assert.doesNotThrow(() => boot.whenBooted(() => {
    throw new Error("boom");
  }));
  boot.dispose();
});

test("the boot waits for the first read of each block, not for every refetch", () => {
  for (const path of [
    "../src/components/MatchAttendance.jsx",
    "../src/components/cards/LastMatchCard.jsx",
  ]) {
    const source = read(path);
    assert.match(source, /firstRead\.current \? \(\) => \{\} : beginWork\(\)/, path);
    assert.match(source, /firstRead\.current = true;/, path);
    assert.match(source, /finally \{[\s\S]*?answered\(\);/, `${path} answers on both paths`);
  }
});

test("nothing behind the curtain can be reached while it is down", () => {
  // The overlay covers the app, but a keyboard does not know that: without
  // `inert`, Tab walks into controls nobody can see for as long as the curtain
  // is up.
  assert.match(html, /<div id="root" inert>/, "the app starts out inert");
  assert.match(html, /\.removeAttribute\("inert"\)/, "and the lift releases it");
});
