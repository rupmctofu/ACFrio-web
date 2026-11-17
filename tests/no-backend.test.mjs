import test from "node:test";
import assert from "node:assert/strict";

/**
 * Spec S6: with no Supabase environment the site must build, deploy and render,
 * and the attendance surfaces must say they are not connected instead of
 * failing. This is the regression guard for that promise — the project has no
 * other tests, so this file is also what proves the data layer can be imported
 * outside a browser at all.
 *
 * Nothing here touches the network: that is the point.
 */

const { isConfigured, client, BackendUnavailable } = await import(
  "../src/lib/supabase.js"
);
const { ensureMatch, fetchAnswers, setAnswer, fetchActaState, currentOwner } =
  await import("../src/lib/attendance.js");

test("no environment means no backend, and the reason is nameable", async () => {
  assert.equal(isConfigured, false, "isConfigured must be false without env vars");

  await assert.rejects(client(), (error) => {
    assert.ok(error instanceof BackendUnavailable, "must reject with BackendUnavailable");
    assert.equal(error.code, "backend-unavailable");
    return true;
  });

  assert.equal(await currentOwner(), null, "no owner session can be read");
});

test("every data call rejects with the same explainable reason", async () => {
  const calls = [
    () => ensureMatch({ season: "2026-2027", competition: "cup", matchday: 1 }),
    () => fetchAnswers(7),
    () => setAnswer({ matchId: 7, playerId: 1, status: "in" }),
    () => fetchActaState(7),
  ];

  for (const call of calls) {
    await assert.rejects(call(), (error) => error?.code === "backend-unavailable");
  }
});

test("an unconfigured backend makes no network request at all", async () => {
  const seen = [];
  const original = globalThis.fetch;
  globalThis.fetch = (...args) => {
    seen.push(args);
    throw new Error("fetch must never be reached without a configured backend");
  };

  try {
    await ensureMatch({ season: "2026-2027", competition: "cup", matchday: 1 }).catch(
      () => {},
    );
    await fetchAnswers(7).catch(() => {});
    await setAnswer({ matchId: 7, playerId: 1, status: "in" }).catch(() => {});
    await fetchActaState(7).catch(() => {});
    await currentOwner();
  } finally {
    globalThis.fetch = original;
  }

  assert.deepEqual(seen, [], `expected no fetch calls, saw ${seen.length}`);
});
