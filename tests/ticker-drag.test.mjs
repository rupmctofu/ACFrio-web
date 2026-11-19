import test from "node:test";
import assert from "node:assert/strict";
import { resumeSeconds } from "../src/lib/ticker-drag.js";

const PPS = 62; // the ticker's constant rate, in pixels per second
const LOOP = 10;

test("a ticker nobody touched resumes at the start", () => {
  assert.equal(resumeSeconds(0, PPS, LOOP), 0);
});

test("dragging left for half a loop resumes halfway through it", () => {
  // 310px at 62px/s is 5 seconds of the 10 second loop.
  assert.equal(resumeSeconds(-310, PPS, LOOP), 5);
});

test("dragging left past a whole loop wraps back to the start", () => {
  assert.equal(resumeSeconds(-620, PPS, LOOP), 0);
  assert.equal(resumeSeconds(-930, PPS, LOOP), 5);
});

test("dragging right is a negative distance, wrapped into the loop", () => {
  // 124px to the right is 2 seconds backwards, which is 8 seconds into the loop.
  assert.equal(resumeSeconds(124, PPS, LOOP), 8);
});

test("an unusable measurement leaves the ticker where it was", () => {
  assert.equal(resumeSeconds(NaN, PPS, LOOP), 0);
  assert.equal(resumeSeconds(-310, 0, LOOP), 0);
  assert.equal(resumeSeconds(-310, PPS, 0), 0);
});
