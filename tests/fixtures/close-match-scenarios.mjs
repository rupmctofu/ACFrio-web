/**
 * Stub Supabase client for tests/close-match-guard.test.mjs.
 *
 * The owner surfaces in src/lib/attendance.js are two PostgREST round trips
 * each, and the interesting part of them is the ORDER: an acta is marked as
 * reviewed and only then is the match closed, and a new scan reopens a closed
 * match. That cannot be observed without a client, and a real client needs a
 * project, so this file fakes exactly the little that the data layer touches:
 * `from(table).update().eq().select()`, `.not()`, `.upsert()` and the storage
 * upload. Nothing here talks to the network.
 *
 * `results` maps a table to the `{ data, error }` the client answers with; a
 * missing table answers `{ data: null, error: null }`, which is what the real
 * client returns for a write that matched nothing.
 */

function makeBuilder(table, calls, results) {
  const record = (op, args) => calls.push({ table, op, args });

  const builder = {
    update(payload) {
      record("update", [payload]);
      return builder;
    },
    upsert(payload, options) {
      record("upsert", [payload, options]);
      return builder;
    },
    select(columns) {
      record("select", [columns]);
      return builder;
    },
    eq(column, value) {
      record("eq", [column, value]);
      return builder;
    },
    not(column, operator, value) {
      record("not", [column, operator, value]);
      return builder;
    },
    // The real builder is a thenable too: awaiting it runs the query.
    then(onFulfilled, onRejected) {
      const answer = typeof results[table] === "function" ? results[table]() : results[table];
      return Promise.resolve(answer ?? { data: null, error: null }).then(onFulfilled, onRejected);
    },
  };

  return builder;
}

/** Returns `{ client, calls }`. `calls` is the ordered transcript of the call. */
export function createStubBackend(results = {}) {
  const calls = [];

  const client = {
    from: (table) => makeBuilder(table, calls, results),
    storage: {
      from: (bucket) => ({
        upload: async (path, file, options) => {
          calls.push({ table: `storage:${bucket}`, op: "upload", args: [path, file, options] });
          const answer = results.storage;
          return typeof answer === "function"
            ? answer({ bucket, path })
            : answer ?? { data: { path }, error: null };
        },
      }),
    },
  };

  return { client, calls };
}

/** An acta row was updated and the match follows it. */
export const actaPresent = () => ({
  actas: { data: [{ match_id: 7 }], error: null },
  matches: { data: null, error: null },
});

/** The update matched nothing: this match has no acta to review. */
export const noActaRow = () => ({ actas: { data: [], error: null } });

/** Some PostgREST configurations answer a filtered write with data: null. */
export const actaDataNull = () => ({ actas: { data: null, error: null } });

/** row level security refused the write: Postgres 42501, "insufficient privilege". */
export const actaDenied = () => ({
  actas: {
    data: null,
    error: {
      code: "42501",
      message: "new row violates row-level security policy for table \"actas\"",
      details: null,
      hint: null,
    },
  },
});

/** The transcript, reduced to `table:op`, for order assertions. */
export function transcript(calls) {
  return calls.map((call) => `${call.table}:${call.op}`);
}

/** The recorded calls for one table, in order. */
export function callsFor(calls, table) {
  return calls.filter((call) => call.table === table);
}

/** The first recorded call matching a table and an operation, or undefined. */
export function findCall(calls, table, op) {
  return calls.find((call) => call.table === table && call.op === op);
}
