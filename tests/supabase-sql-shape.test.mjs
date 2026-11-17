import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/**
 * Offline guards over the two SQL files.
 *
 * The schema cannot be executed here — there is no project and there are no
 * credentials in a test run — so this file checks the SHAPE of the claims the
 * rest of the system relies on: which bucket, which role, which expression,
 * which conflict target. It is not a substitute for `npm run verify:supabase`,
 * it is the part that can never be skipped or cost a network request.
 *
 * Files are normalised first (CRLF, comments, runs of whitespace) so a
 * reformat does not read as a behaviour change and, more importantly, so a
 * comment can never satisfy an assertion about code.
 */

const root = new URL("../supabase/", import.meta.url);

function readSql(name) {
  return readFileSync(new URL(name, root), "utf8")
    .replace(/\r\n?/g, "\n")
    .replace(/--[^\n]*/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

const schema = readSql("schema.sql");
const storage = readSql("storage.sql");

/** Every statement that starts with `opener`, up to its terminator. */
function statements(text, opener, terminator = ";") {
  return text
    .split(opener)
    .slice(1)
    .map((part) => part.split(terminator)[0].trim())
    .filter(Boolean);
}

/** A plpgsql body runs to `$$;`, not to the first `;` (the DECLARE section has one). */
const functionBody = (name) =>
  statements(schema, `create or replace function ${name}`, "$$;")[0] ?? "";

test("schema.sql touches no storage object, so it runs without storage privileges", () => {
  assert.doesNotMatch(schema, /storage\./, "storage.sql owns every storage.* statement");
});

test("storage.sql creates exactly the four owner-only policies", () => {
  const policies = statements(storage, "create policy");
  assert.equal(policies.length, 4, `found ${policies.length} policies`);

  const expression = "bucket_id = 'actas' and public.is_owner()";
  for (const policy of policies) {
    assert.match(policy, / on storage\.objects /, `not on storage.objects: ${policy}`);
    assert.match(policy, / to authenticated /, `not owner-gated by role: ${policy}`);
    assert.doesNotMatch(policy, / to anon | to public | to authenticated, anon /, policy);
    assert.ok(policy.includes(expression), `missing the owner expression: ${policy}`);
  }

  const verbs = policies.map((policy) => policy.match(/ for (select|insert|update|delete) /)?.[1]);
  assert.deepEqual(verbs.sort(), ["delete", "insert", "select", "update"], "one per operation");
});

test("storage.sql mentions no anon anywhere in code", () => {
  assert.doesNotMatch(storage, /\banon\b/);
});

test("the actas bucket is private, including when it already exists", () => {
  assert.match(
    storage,
    /insert into storage\.buckets \(id, name, public\) values \('actas', 'actas', false\)/,
    "the bucket must be created with public = false",
  );
  // `do nothing` would leave a bucket that was created PUBLIC earlier exactly as
  // it was, so the conflict branch has to pin the invariant.
  assert.match(storage, /on conflict \(id\) do update set public = false/);
  assert.doesNotMatch(storage, /on conflict \(id\) do nothing/);
});

test("every public table has row level security enabled", () => {
  for (const table of ["admins", "matches", "attendance", "actas"]) {
    assert.match(
      schema,
      new RegExp(`alter table public\\.${table} enable row level security`),
      `${table} must have RLS enabled`,
    );
  }
});

test("the ON CONFLICT target is the key the table declares", () => {
  const matches = statements(schema, "create table if not exists public.matches")[0];
  assert.match(matches, /unique \(season, competition, matchday\)/, "declared key");
  assert.match(
    schema,
    /on conflict \(season, competition, matchday\) do update/,
    "ensure_match targets that key",
  );
  // The key is also created for projects installed before it existed, otherwise
  // the file "runs clean" and every write then fails on the missing index.
  assert.match(schema, /alter table public\.matches add column if not exists season text/);
  assert.match(
    schema,
    /create unique index if not exists \w+ on public\.matches \(season, competition, matchday\)/,
  );
});

test("the DO UPDATE body never schema-qualifies the target row", () => {
  const conflict = schema.slice(schema.indexOf("on conflict (season, competition, matchday)"));
  const body = conflict.slice(0, conflict.indexOf("returning"));
  assert.ok(body.length > 0, "no ON CONFLICT body found");
  // `set public.matches.kickoff = ...` is a syntax error in the DO UPDATE clause.
  assert.doesNotMatch(body, /public\.matches\./, body);
  assert.doesNotMatch(body, /excluded\.(season|competition|matchday|closed_at)/);
});

test("ensure_match only ever writes kickoff and rival, through coalesce", () => {
  const body = functionBody("public.ensure_match");
  assert.ok(body.includes("on conflict (season, competition, matchday) do update"), body);
  const set = body.slice(body.indexOf(" do update "));
  assert.ok(set.includes("set kickoff = coalesce(matches.kickoff, excluded.kickoff)"), set);
  assert.ok(set.includes("rival = coalesce(matches.rival, excluded.rival)"), set);
  assert.equal(set.match(/=/g).length, 2, `unexpected assignment in: ${set}`);
  // `closed_at` is the owner's reconciliation flag; a player must never set it.
  assert.doesNotMatch(body, /closed_at/);
});

test("the revoke and grant signatures match the declared parameter types", () => {
  const body = functionBody("public.ensure_match");
  const declared = body.slice(0, body.indexOf(")")).replace(/^[\s(]+/, "");
  const parameters = declared
    .split(",")
    .map((parameter) => parameter.trim())
    .filter(Boolean);

  // "p_matchday integer" -> "integer"; the default marker is not a type.
  const types = parameters.map((parameter) =>
    parameter.replace(/^p_\w+\s+/, "").split(/\s+/)[0],
  );

  assert.deepEqual(types, ["text", "text", "integer", "timestamptz", "text"]);
  const signature = `public.ensure_match(${types.join(", ")})`;
  assert.ok(
    schema.includes(`revoke all on function ${signature} from public`),
    `missing revoke for ${signature}`,
  );
  assert.ok(
    schema.includes(`grant execute on function ${signature} to anon, authenticated`),
    `missing grant for ${signature}`,
  );
});
