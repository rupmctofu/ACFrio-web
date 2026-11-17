import test, { mock } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import {
  createStubBackend,
  actaPresent,
  noActaRow,
  actaDataNull,
  actaDenied,
  transcript,
  findCall,
} from "./fixtures/close-match-scenarios.mjs";

/**
 * The two-layer model has one invariant that is easy to break by accident:
 *
 *   `matches.closed_at` means "this declared list was checked against the paper
 *   acta". So closed implies reviewed, and a new scan must never leave a match
 *   closed next to a sheet nobody has looked at.
 *
 * These tests drive src/lib/attendance.js with a stubbed client, because the
 * order of the two requests is the whole contract. They need module mocking,
 * which Node only exposes behind `--experimental-test-module-mocks`; when
 * `npm test` does not pass it, the file re-runs itself with the flag so the
 * guard is really executed instead of quietly skipped.
 */

const selfPath = fileURLToPath(import.meta.url);
const canMockModules = typeof mock.module === "function";

if (!canMockModules) {
  test("closed implies reviewed: the attendance guard runs", () => {
    const child = spawnSync(
      process.execPath,
      ["--experimental-test-module-mocks", "--test", selfPath],
      { encoding: "utf8" },
    );
    assert.equal(
      child.status,
      0,
      `the guarded run failed:\n${child.stdout ?? ""}\n${child.stderr ?? ""}`,
    );
  });
} else {
  // One active backend per test; `attendance.js` asks for the client on every
  // call, so swapping this object is enough.
  let active = createStubBackend();

  mock.module("../src/lib/supabase.js", {
    namedExports: {
      isConfigured: true,
      client: async () => active.client,
    },
  });

  const { closeMatch, uploadActa } = await import("../src/lib/attendance.js");

  function backend(results) {
    active = createStubBackend(results);
    return active;
  }

  test("closing a match with no acta throws and never touches matches", async () => {
    const stub = backend(noActaRow());

    await assert.rejects(closeMatch(7), (error) => {
      assert.match(error.message, /no tiene acta/i);
      return true;
    });

    assert.deepEqual(transcript(stub.calls), ["actas:update", "actas:eq", "actas:select"]);
    assert.equal(findCall(stub.calls, "matches", "update"), undefined);
  });

  test("an acta update that matched nothing is treated the same as no acta", async () => {
    const stub = backend(actaDataNull());

    await assert.rejects(closeMatch(7), (error) => {
      assert.match(error.message, /no tiene acta/i);
      return true;
    });

    assert.equal(findCall(stub.calls, "matches", "update"), undefined);
  });

  test("closing a match reviews the acta first and closes the match second", async () => {
    const stub = backend(actaPresent());

    await closeMatch(7);

    assert.deepEqual(transcript(stub.calls), [
      "actas:update",
      "actas:eq",
      "actas:select",
      "matches:update",
      "matches:eq",
    ]);

    const reviewed = findCall(stub.calls, "actas", "update").args[0];
    assert.ok(reviewed.reviewed_at, "the acta is stamped as reviewed");
    assert.equal(
      new Date(reviewed.reviewed_at).toISOString(),
      reviewed.reviewed_at,
      "the stamp is an ISO instant Postgres can parse",
    );

    const closed = findCall(stub.calls, "matches", "update").args[0];
    assert.equal(closed.closed_at, reviewed.reviewed_at, "both steps share one instant");
    assert.equal(findCall(stub.calls, "matches", "eq").args[1], 7, "the right match");
  });

  test("a denied acta update surfaces 42501 and leaves the match open", async () => {
    const stub = backend(actaDenied());

    await assert.rejects(closeMatch(7), (error) => {
      assert.equal(error.code, "42501");
      assert.equal(error.cause?.code, "42501");
      return true;
    });

    assert.equal(findCall(stub.calls, "matches", "update"), undefined);
  });

  test("filing a new scan on a closed match reopens it", async () => {
    const stub = backend({
      actas: { data: null, error: null },
      matches: { data: null, error: null },
    });

    const path = await uploadActa({
      matchId: 7,
      file: { name: "acta arbitro.jpg" },
      email: "owner@example.com",
    });

    assert.match(path, /^match-7\/\d+-acta_arbitro\.jpg$/);

    const written = findCall(stub.calls, "actas", "upsert").args[0];
    assert.equal(written.reviewed_at, null, "a new sheet is not reviewed yet");
    assert.equal(written.storage_path, path);
    assert.deepEqual(findCall(stub.calls, "actas", "upsert").args[1], {
      onConflict: "match_id",
    });

    // Two requests, in this order, and the reopen is conditional on the row
    // actually being closed rather than a read-then-write.
    assert.deepEqual(transcript(stub.calls), [
      "storage:actas:upload",
      "actas:upsert",
      "matches:update",
      "matches:eq",
      "matches:not",
    ]);

    assert.deepEqual(findCall(stub.calls, "matches", "update").args[0], { closed_at: null });
    assert.deepEqual(findCall(stub.calls, "matches", "not").args, ["closed_at", "is", null]);
    assert.equal(
      findCall(stub.calls, "matches", "eq").args[1],
      7,
      "the reopen targets the same match",
    );
  });

  test("a denied reopen is reported instead of leaving a closed, unreviewed match", async () => {
    backend({
      actas: { data: null, error: null },
      matches: { data: null, error: { code: "42501", message: "denied" } },
    });

    await assert.rejects(
      uploadActa({ matchId: 7, file: { name: "acta.jpg" } }),
      (error) => error.code === "42501",
    );
  });
}
