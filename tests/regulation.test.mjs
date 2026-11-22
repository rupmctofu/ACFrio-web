import test from "node:test";
import assert from "node:assert/strict";

/**
 * The whole regulation, block by block (S1).
 *
 * `/reglamento` is a transcription, not a summary, so the module it ships has a
 * shape that can be checked exactly: ten opening clauses and nine articles,
 * seventy-one texts in all, with the document's own references in the document's
 * own order. The checks below are structural — they cannot tell a good
 * translation from a bad one — but they do catch the two ways this file rots: a
 * clause quietly dropped while someone "tidies up", and a half-translated
 * sentence left in Catalan.
 *
 * The Catalan markers are matched on `\p{L}` edges instead of with `\b`, because
 * JavaScript's `\b` is ASCII-only: `/\bés\b/` would never fire on `és` (accented
 * letters are not word characters), and a plain `/és/` would fire on `después`,
 * `través` and `además`. Neither failure mode is worth shipping in a test.
 */

const { PREAMBLE, REGULATION } = await import("../src/data/regulation.js");

/** The opening block: the disposiciones iniciales, in order. */
const EXPECTED_PREAMBLE_REFS = [
  "P1",
  "P2",
  "P3",
  "P4",
  "P5",
  "P6",
  "P7",
  "P8",
  "P9",
  "P10",
];

/** The articles' references, in the order the official PDF prints them. */
const EXPECTED_REFS = [
  "1.1",
  "1.2",
  "1.3",
  "1.4",
  "1.5",
  "1.6",
  "1.7",
  "1.8",
  "1.9",
  "1.10",
  "1.11",
  "1.12",
  "1.13",
  "1.14",
  "1.15",
  "2.1",
  "2.1 bis",
  "2.2",
  "2.3",
  "2.4",
  "3.1",
  "3.2",
  "3.3",
  "4.1",
  "4.2",
  "4.3",
  "4.4",
  "4.5",
  "4.6",
  "4.7",
  "4.8",
  "4.9",
  "4.10",
  "4.11",
  "4.12",
  "4.13",
  "4.14",
  "5.1",
  "6.1",
  "6.2",
  "6.3",
  "7.1",
  "7.2",
  "7.3",
  "7.4",
  "7.5",
  "7.6",
  "8.1",
  "8.2",
  "8.3",
  "8.3.1",
  "8.3.2",
  "8.4",
  "8.5",
  "8.6",
  "8.7",
  "8.8",
  "8.9",
  "8.10",
  "8.11",
  "9",
];

/** Words that exist in Catalan and not in Spanish at all. */
const CATALAN_MARKERS = ["és", "però", "haurà", "així", "també", "sanció"];

const markerPattern = (marker) =>
  new RegExp(`(^|[^\\p{L}])${marker}([^\\p{L}]|$)`, "iu");

const articleItems = () => REGULATION.flatMap((article) => article.items);
const everyItem = () => [...PREAMBLE.items, ...articleItems()];

test("the preamble is the ten disposiciones iniciales, in order", () => {
  assert.deepEqual(
    PREAMBLE.items.map((item) => item.ref),
    EXPECTED_PREAMBLE_REFS,
  );
});

test("the preamble announces itself", () => {
  assert.equal(typeof PREAMBLE.title, "string");
  assert.equal(PREAMBLE.title.trim().length > 0, true);
  for (const item of PREAMBLE.items) {
    assert.match(item.ref, /^P\d+$/, `"${item.ref}" is not a preamble reference`);
  }
});

test("the regulation is nine articles, numbered 1 to 9 in order", () => {
  assert.equal(REGULATION.length, 9);
  assert.deepEqual(
    REGULATION.map((article) => article.n),
    [1, 2, 3, 4, 5, 6, 7, 8, 9],
  );
});

test("every article has a non-empty title", () => {
  for (const article of REGULATION) {
    assert.equal(typeof article.title, "string", `Art. ${article.n} has no title`);
    assert.ok(
      article.title.trim().length > 0,
      `Art. ${article.n} has an empty title`,
    );
  }
});

test("the regulation is sixty-one items", () => {
  assert.equal(articleItems().length, 61);
});

test("every article item carries its reference, in the document's order", () => {
  assert.deepEqual(
    articleItems().map((item) => item.ref),
    EXPECTED_REFS,
  );
});

test("each article's items are its own, in order", () => {
  for (const article of REGULATION) {
    const expected =
      article.n === 9
        ? ["9"]
        : EXPECTED_REFS.filter((ref) => ref.startsWith(`${article.n}.`));
    assert.deepEqual(
      article.items.map((item) => item.ref),
      expected,
      `Art. ${article.n} is not the list of its own references`,
    );
  }
});

test("the whole document is seventy-one texts", () => {
  assert.equal(everyItem().length, 71);
});

test("no text is a stub, a placeholder or a translator's note", () => {
  for (const item of everyItem()) {
    assert.ok(
      item.text.trim().length >= 20,
      `${item.ref} is too short to be a clause: "${item.text}"`,
    );
    assert.ok(!item.text.includes("…"), `${item.ref} is truncated`);
    for (const placeholder of ["TODO", "XXX"]) {
      assert.ok(
        !item.text.includes(placeholder),
        `${item.ref} still carries ${placeholder}`,
      );
    }
    assert.ok(
      !/[\[\]]/.test(item.text),
      `${item.ref} carries a bracketed note: "${item.text}"`,
    );
  }
});

test("no text was left in Catalan", () => {
  for (const item of everyItem()) {
    for (const marker of CATALAN_MARKERS) {
      assert.ok(
        !markerPattern(marker).test(item.text),
        `${item.ref} still says "${marker}": ${item.text}`,
      );
    }
  }
});
