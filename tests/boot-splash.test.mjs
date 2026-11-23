/*
 * The boot curtain, as markup.
 *
 * It is the only screen in the project that exists outside React, so the tests
 * that can reach it are structural ones: where it sits, what it is made of, how
 * it can be released, and what a reader who asked for stillness gets. The
 * behaviour behind it — when it is allowed to lift — is `tests/app-ready.test.mjs`.
 *
 * These assertions are deliberately about the guarantees, not the pixels: the
 * colours and sizes below are the ones the owner asked for (dark blurred ground,
 * crest centred) and a refactor that quietly drops one of them is the regression
 * worth catching.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");

test("the curtain is the page's first element and lives outside the React root", () => {
  const curtain = html.indexOf('id="acf-splash"');
  const root = html.indexOf('<div id="root"');
  assert.ok(curtain > -1, "index.html carries the curtain");
  assert.ok(root > -1, "index.html still carries the root");
  assert.ok(
    curtain < root,
    "the curtain comes before #root: React replaces the root's children on mount, so a curtain inside it would be wiped by the very mount it waits for",
  );
});

test("the centre is the club's crest, sized so it cannot shift the layout", () => {
  assert.match(html, /class="acf-splash__crest"[^>]*src="\/assets\/logo-acf\.png"/);
  assert.match(
    html,
    /<img class="acf-splash__crest"[^>]*width="486"[^>]*height="630"/,
    "the intrinsic size is declared: a crest that paints after its bytes is the same jump, one layer down",
  );
});

test("the ground is the page's own photograph, heavily blurred, over the club's canvas", () => {
  assert.match(html, /pitch-night-900\.webp/);
  assert.match(html, /pitch-night\.jpg/);
  assert.match(html, /filter: blur\(26px\)/, "the ground is blurred on purpose");
  assert.match(html, /background-color: #141416/, "the canvas is the app's, not a white default");
});

test("there are two ways out, and the app's is idempotent", () => {
  assert.match(html, /window\.acfSplash\s*=\s*\{\s*hide:\s*hide\s*\}/, "the app can lift it");
  assert.match(html, /setTimeout\(hide, GIVE_UP_MS\)/, "and it gives up on its own");
  assert.match(html, /if \(lifted \|\| !splash\) return;/, "lifting twice is one lift");
  assert.match(
    html,
    /document\.documentElement\.classList\.remove\("acf-booting"\)/,
    "the curtain releases the page's scroll when it goes",
  );
});

test("the gutter is reserved, so the reveal moves nothing sideways", () => {
  assert.match(
    html,
    /scrollbar-gutter: stable/,
    "the curtain locks the scroll and releases it; without a reserved gutter the scrollbar leaving and returning reflows the page ten pixels wide at the moment it is first seen",
  );
});

test("a reader who asked for stillness gets no sweep and no breathing", () => {
  const reduced = html.slice(html.indexOf("prefers-reduced-motion"));
  assert.match(reduced, /acf-splash__crest/);
  assert.match(reduced, /acf-splash__bar::after/);
  assert.match(reduced, /animation: none/);
});
