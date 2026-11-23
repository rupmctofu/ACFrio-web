/*
 * What the boot curtain waits for.
 *
 * The splash screen in `index.html` covers the first paint, and the dashboard
 * must not be seen assembling itself behind it: the attendance block prints
 * "0 / 15" and a shrug, then swaps one line for a row of faces, and every card
 * below it moves. So the curtain lifts when the first commit is on screen AND
 * the requests that commit started have answered — not when the network says
 * so, and never later than the deadline.
 *
 * The rules below are the whole contract, in isolation from React: a pending
 * count, one mount signal, one deadline, one audience.
 */
import { test } from "node:test";
import assert from "node:assert/strict";

import { createBootTracker, BOOT_DEADLINE_MS } from "../src/lib/app-ready.js";

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

test("the curtain lifts only when the mount is done and every watched request has answered", () => {
  const boot = createBootTracker({ deadlineMs: 60_000 });
  const answerAttendance = boot.beginWork();
  const answerMvp = boot.beginWork();
  let lifted = 0;
  boot.whenBooted(() => {
    lifted += 1;
  });

  boot.markMounted();
  assert.equal(boot.isBooted, false, "mounted with two requests in flight is still loading");

  answerAttendance();
  assert.equal(boot.isBooted, false, "one of two answers is not everything");

  answerMvp();
  assert.equal(boot.isBooted, true);
  assert.equal(lifted, 1);
  boot.dispose();
});

test("a page that watches nothing lifts on the mount alone", () => {
  const boot = createBootTracker({ deadlineMs: 60_000 });
  boot.markMounted();
  assert.equal(boot.isBooted, true);
  boot.dispose();
});

test("one request answered twice cannot lift the curtain while another is still out", () => {
  const boot = createBootTracker({ deadlineMs: 60_000 });
  const answerAttendance = boot.beginWork();
  const answerMvp = boot.beginWork();
  boot.markMounted();

  answerAttendance();
  answerAttendance();
  assert.equal(boot.isBooted, false);
  assert.equal(boot.beginWork.length, 0, "a watcher takes no arguments");

  answerMvp();
  assert.equal(boot.isBooted, true);
  boot.dispose();
});

test("a request that never answers is given up on at the deadline", async () => {
  const boot = createBootTracker({ deadlineMs: 20 });
  boot.beginWork();
  boot.markMounted();
  assert.equal(boot.isBooted, false);

  await wait(60);
  assert.equal(boot.isBooted, true, "a hung request must not keep the curtain down");
  boot.dispose();
});

test("the deadline is a real budget, not a zero", () => {
  assert.ok(BOOT_DEADLINE_MS >= 2000, "a slow phone on a field still deserves the wait");
  assert.ok(BOOT_DEADLINE_MS <= 6000, "and nobody waits longer than that to see the club");
});

test("a listener removed before the curtain lifts is never called", () => {
  const boot = createBootTracker({ deadlineMs: 60_000 });
  let lifted = 0;
  const stop = boot.whenBooted(() => {
    lifted += 1;
  });
  stop();
  boot.markMounted();
  assert.equal(lifted, 0);
  boot.dispose();
});

test("work started after the curtain lifted does not close it again", () => {
  const boot = createBootTracker({ deadlineMs: 60_000 });
  boot.markMounted();
  assert.equal(boot.isBooted, true);

  const late = boot.beginWork();
  assert.equal(typeof late, "function");
  late();
  assert.equal(boot.isBooted, true);

  let lateListeners = 0;
  boot.whenBooted(() => {
    lateListeners += 1;
  });
  assert.equal(lateListeners, 1, "a late subscriber hears it at once");
  boot.dispose();
});
