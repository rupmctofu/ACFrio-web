#!/usr/bin/env node
/**
 * Live check of the attendance backend.
 *
 * Everything in tests/ proves the site survives WITHOUT a Supabase project (and
 * that the SQL files say what they must say). This script proves the other half:
 * that the schema accepts what the app sends, and that the row level security
 * refuses what it must refuse. It cannot be run offline and it is not part of
 * `npm test`, because it needs a real project and it writes data.
 *
 * Three outcomes, deliberately kept apart:
 *
 *   PASS          the check observed the behaviour it is named after.
 *   FAIL          the project is not protected (or does not work) as declared.
 *   INCONCLUSIVE  the precondition the check needs is absent, so its PASS would
 *                 be vacuous. An empty table proves nothing about a negative
 *                 read assertion: `admins` returning no rows is the expected
 *                 answer both when the policy works and when nobody has
 *                 registered an owner yet. Those checks say so instead of
 *                 claiming evidence they do not have. INCONCLUSIVE never fails
 *                 the run.
 *
 * It probes a synthetic match (cup · matchday 999) so it never touches the
 * fixtures the club actually plays. Cleanup, when you are done:
 *
 *   delete from public.matches where matchday = 999;
 *
 * (attendance and actas rows cascade.) Set the environment first, either as
 * variables or in .env.local at the repository root:
 *
 *   VITE_SUPABASE_URL=https://xxxx.supabase.co
 *   VITE_SUPABASE_ANON_KEY=eyJ...
 *
 * Run with: npm run verify:supabase
 */
import { readFileSync } from "node:fs";

const PROBE = { season: "2026-2027", competition: "cup", matchday: 999 };
const STATUS = { PASS: "PASS", FAIL: "FAIL", INCONCLUSIVE: "INCONCLUSIVE" };
const { PASS, FAIL, INCONCLUSIVE } = STATUS;

function readEnv() {
  const env = {
    url: process.env.VITE_SUPABASE_URL?.trim() ?? "",
    key: process.env.VITE_SUPABASE_ANON_KEY?.trim() ?? "",
  };
  if (env.url && env.key) return env;

  try {
    const text = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
    for (const line of text.split(/\r?\n/)) {
      const match = line.match(/^\s*(VITE_SUPABASE_URL|VITE_SUPABASE_ANON_KEY)\s*=\s*(.*)$/);
      if (!match) continue;
      const value = match[2].trim().replace(/^["']|["']$/g, "");
      if (match[1] === "VITE_SUPABASE_URL") env.url = value;
      else env.key = value;
    }
  } catch {
    /* No .env.local: the variables above are the only source. */
  }
  return env;
}

const env = readEnv();
if (!env.url || !env.key) {
  console.error(
    "Missing VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (as variables or in .env.local).",
  );
  process.exit(2);
}

const base = env.url.replace(/\/+$/, "");

/** One request as `anon`, which is exactly what the public site is. */
async function call(url, init = {}) {
  const response = await fetch(url, {
    ...init,
    headers: {
      apikey: env.key,
      Authorization: `Bearer ${env.key}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  const text = await response.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  return { ok: response.ok, status: response.status, body, headers: response.headers };
}

/** One PostgREST call. */
function rest(path, init = {}) {
  return call(`${base}/rest/v1/${path}`, init);
}

/** One Storage API call: same anon key, different service path. */
function storage(path, init = {}) {
  return call(`${base}/storage/v1/${path}`, init);
}

/** PostgREST answers a privilege denial (Postgres 42501) with 401 or 403. */
function isDeniedByPrivilege(response) {
  return response.status === 401 || response.status === 403;
}

/**
 * PostgREST can also refuse an UPDATE/DELETE by filtering every row out: the
 * statement runs, matches nothing, and comes back empty instead of erroring.
 * That is a refusal too — but only the caller can prove it, by reading a row it
 * knows exists afterwards. A 2xx with a body means the write went through.
 */
function isFilteredByPolicy(response) {
  if (response.status === 401 || response.status === 403) return true;
  if (response.status !== 200 && response.status !== 204) return false;
  return !Array.isArray(response.body) || response.body.length === 0;
}

/** A Storage API refusal always carries an error body; success carries data. */
function storageError(response) {
  const body = response.body;
  if (!body || typeof body !== "object") return null;
  if (typeof body.error === "string" && body.error) return body.error;
  if (body.statusCode && Number(body.statusCode) >= 400) return body.message ?? "refused";
  return null;
}

const results = [];
const counts = { PASS: 0, FAIL: 0, INCONCLUSIVE: 0 };

async function check(name, run) {
  let result;
  try {
    result = parseOutcome(await run());
  } catch (error) {
    result = [FAIL, error.message];
  }
  const [outcome, detail] = result;
  counts[outcome] += 1;
  results.push({ name, outcome, detail });
  console.log(`${outcome}  ${name}${detail ? ` — ${detail}` : ""}`);
}

/** Checks return a `[outcome, detail]` tuple; a bare boolean is read as PASS/FAIL. */
function parseOutcome(value) {
  if (Array.isArray(value) && STATUS[value[0]]) return [value[0], value[1]];
  return value ? [PASS, ""] : [FAIL, ""];
}

let matchId = null;

/** Checks that need the probe match report the missing precondition honestly. */
function needsMatch() {
  return matchId === null ? [INCONCLUSIVE, "ensure_match returned no match id"] : null;
}

await check("ensure_match runs and is idempotent", async () => {
  const first = await rest("rpc/ensure_match", {
    method: "POST",
    body: JSON.stringify({
      p_season: PROBE.season,
      p_competition: PROBE.competition,
      p_matchday: PROBE.matchday,
      p_kickoff: null,
      p_rival: "PROBE",
    }),
  });
  if (!first.ok) throw new Error(`HTTP ${first.status}: ${JSON.stringify(first.body)}`);
  matchId = Number(first.body);
  if (!Number.isFinite(matchId)) throw new Error(`unexpected body: ${JSON.stringify(first.body)}`);

  const second = await rest("rpc/ensure_match", {
    method: "POST",
    body: JSON.stringify({
      p_season: PROBE.season,
      p_competition: PROBE.competition,
      p_matchday: PROBE.matchday,
    }),
  });
  return [Number(second.body) === matchId, `match id ${matchId}, stable across two calls`];
});

await check("anon can read matches", async () => {
  const skip = needsMatch();
  if (skip) return skip;
  const { ok, body } = await rest(`matches?select=id,closed_at&id=eq.${matchId}`);
  return [ok && Array.isArray(body) && body.length === 1, `${body?.length ?? "?"} row(s)`];
});

// ensure_match is the code path that changed most recently, and the ON CONFLICT
// target is the whole key. A project whose matches row lost `season` (or whose
// unique index is missing) fails here rather than silently reusing a row.
await check("ensure_match kept the match key: season, competition, matchday", async () => {
  const skip = needsMatch();
  if (skip) return skip;
  const { ok, status, body } = await rest(
    `matches?select=season,competition,matchday&id=eq.${matchId}`,
  );
  const row = body?.[0];
  if (!ok || !row) {
    return [FAIL, `could not read the probe match: HTTP ${status} ${JSON.stringify(body)}`];
  }
  const same =
    row.season === PROBE.season &&
    row.competition === PROBE.competition &&
    Number(row.matchday) === PROBE.matchday;
  return [
    same,
    `read back ${JSON.stringify({ season: row.season, competition: row.competition, matchday: row.matchday })}`,
  ];
});

await check("anon cannot close a match", async () => {
  const skip = needsMatch();
  if (skip) return skip;
  const patch = await rest(`matches?id=eq.${matchId}`, {
    method: "PATCH",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({ closed_at: new Date().toISOString() }),
  });
  // The status is part of the evidence, not decoration: a 400 from a payload the
  // API did not understand, or a 404 from a path that never reached a table,
  // must not be read as "the policy held". 401/403 is an explicit privilege
  // denial; 200/204 without rows is the RLS predicate filtering the write.
  if (!isFilteredByPolicy(patch)) {
    return [FAIL, `unexpected HTTP ${patch.status}: ${JSON.stringify(patch.body)}`];
  }
  const read = await rest(`matches?select=closed_at&id=eq.${matchId}`);
  const closed = read.body?.[0]?.closed_at ?? null;
  return [
    closed === null,
    closed === null ? "closed_at still null" : `closed_at was set to ${closed}`,
  ];
});

await check("anon cannot DELETE the probe match", async () => {
  const skip = needsMatch();
  if (skip) return skip;
  const remove = await rest(`matches?id=eq.${matchId}`, {
    method: "DELETE",
    headers: { Prefer: "return=representation" },
  });
  if (!isFilteredByPolicy(remove)) {
    return [FAIL, `unexpected HTTP ${remove.status}: ${JSON.stringify(remove.body)}`];
  }
  // The row provably exists (it was just read), so this is not an empty-table
  // argument: either it is still there or anon deleted a fixture.
  const { body } = await rest(`matches?select=id&id=eq.${matchId}`);
  const survived = body?.length === 1;
  return [
    survived,
    survived ? `HTTP ${remove.status}, row ${matchId} still present` : "the probe row is gone",
  ];
});

await check("anon cannot read the admin list", async () => {
  const { ok, body } = await rest("admins?select=email");
  if (!ok || !Array.isArray(body)) {
    return [FAIL, `expected an empty array, got ${JSON.stringify(body)}`];
  }
  if (body.length > 0) return [FAIL, `${body.length} admin row(s) readable by anon`];
  // Zero rows is the expected answer both when the policy works and when the
  // table is empty, and anon has no way to tell which. Only the INSERT denial
  // below can be evidence, so this read does not claim any.
  return [
    INCONCLUSIVE,
    "0 row(s), but an empty admins table reads the same as a working policy",
  ];
});

await check("anon cannot INSERT into admins", async () => {
  const { status, body } = await rest("admins", {
    method: "POST",
    body: JSON.stringify({ email: "anon-probe@example.invalid" }),
  });
  const refused = isDeniedByPrivilege({ status });
  return [refused, `HTTP ${status}${refused ? "" : `: ${JSON.stringify(body)}`}`];
});

await check("anon cannot read the acta scans", async () => {
  const { ok, body } = await rest("actas?select=storage_path");
  if (!ok || !Array.isArray(body)) {
    return [FAIL, `expected an empty array, got ${JSON.stringify(body)}`];
  }
  if (body.length > 0) return [FAIL, `${body.length} acta row(s) readable by anon`];
  return [
    INCONCLUSIVE,
    "0 row(s), but no acta is filed yet, so an empty table reads the same as a working policy",
  ];
});

await check("anon cannot INSERT an acta row", async () => {
  const { status, body } = await rest("actas", {
    method: "POST",
    body: JSON.stringify({
      match_id: matchId ?? 0,
      storage_path: "probe/anon.jpg",
      uploaded_by: "anon-probe@example.invalid",
    }),
  });
  const refused = isDeniedByPrivilege({ status });
  return [refused, `HTTP ${status}${refused ? "" : `: ${JSON.stringify(body)}`}`];
});

await check("anon can read an acta's state and nothing more", async () => {
  const skip = needsMatch();
  if (skip) return skip;
  const { ok, status, body } = await rest("rpc/acta_state", {
    method: "POST",
    body: JSON.stringify({ p_match_id: matchId }),
  });
  if (!ok) return [FAIL, `HTTP ${status}: ${JSON.stringify(body)}`];
  if (!["none", "pending", "reviewed"].includes(body)) {
    return [FAIL, `unexpected state: ${JSON.stringify(body)}`];
  }
  if (body === "none") {
    // The probe match has no acta, so "none" is the only answer it can give.
    // A broken function that always returns "none" is indistinguishable here.
    return [
      INCONCLUSIVE,
      "no acta filed for the probe match, so \"none\" proves nothing",
    ];
  }
  return [PASS, `state: ${body}`];
});

// The real client path. src/lib/attendance.js calls
// upsert(..., { onConflict: "match_id,player_id" }), which supabase-js sends as
// POST /attendance?on_conflict=match_id,player_id with
// `Prefer: resolution=merge-duplicates`. Both halves matter: the header alone
// merges on the primary key, so dropping the query parameter would insert a
// duplicate instead of exercising the unique index the app depends on. Without
// that index PostgREST answers 42P10, which is exactly the failure the app would
// hit on the first tap.
await check("declaring answers upserts instead of duplicating", async () => {
  const skip = needsMatch();
  if (skip) return skip;
  const declare = (status) =>
    rest("attendance?on_conflict=match_id,player_id", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates" },
      body: JSON.stringify({
        match_id: matchId,
        player_id: 1,
        status,
        updated_at: new Date().toISOString(),
      }),
    });

  const first = await declare("in");
  if (!first.ok) throw new Error(`upsert HTTP ${first.status}: ${JSON.stringify(first.body)}`);

  const second = await declare("out");
  if (!second.ok) throw new Error(`second upsert HTTP ${second.status}: ${JSON.stringify(second.body)}`);

  const after = await rest(`attendance?select=status&match_id=eq.${matchId}&player_id=eq.1`);
  const rows = after.body?.length ?? 0;
  const flipped = after.body?.[0]?.status === "out";
  return [
    rows === 1 && flipped,
    `in -> out through upsert, ${rows} row (no duplicate)`,
  ];
});

await check("anon cannot DELETE the declared answers", async () => {
  const skip = needsMatch();
  if (skip) return skip;
  const remove = await rest(`attendance?match_id=eq.${matchId}`, {
    method: "DELETE",
    headers: { Prefer: "return=representation" },
  });
  if (!isFilteredByPolicy(remove)) {
    return [FAIL, `unexpected HTTP ${remove.status}: ${JSON.stringify(remove.body)}`];
  }
  const { body } = await rest(`attendance?select=status&match_id=eq.${matchId}`);
  const survived = (body?.length ?? 0) > 0;
  return [
    survived,
    survived ? `HTTP ${remove.status}, ${body?.length ?? 0} row(s) still present` : "the declared rows are gone",
  ];
});

await check("the probe match is still open", async () => {
  const skip = needsMatch();
  if (skip) return skip;
  const { body } = await rest(`matches?select=closed_at&id=eq.${matchId}`);
  return [body?.[0]?.closed_at === null, "open"];
});

// ---------------------------------------------------------------------------
// Storage. The bucket is private and the four policies live in
// supabase/storage.sql, which nothing above touches: a project that skipped
// that file has a readable actas bucket and no other check would notice.
// ---------------------------------------------------------------------------

await check("anon cannot list the actas bucket", async () => {
  const response = await storage("object/list/actas", {
    method: "POST",
    body: JSON.stringify({ prefix: "", limit: 100, offset: 0 }),
  });
  const refusal = isDeniedByPrivilege(response)
    ? `HTTP ${response.status}`
    : storageError(response);
  if (refusal) return [PASS, `refused: ${refusal} (HTTP ${response.status})`];
  if (Array.isArray(response.body)) {
    if (response.body.length > 0) {
      return [FAIL, `anon listed ${response.body.length} object(s) in the private bucket`];
    }
    return [
      INCONCLUSIVE,
      "empty list without an error: an empty private bucket answers the same way",
    ];
  }
  return [FAIL, `unexpected answer: HTTP ${response.status} ${JSON.stringify(response.body)}`];
});

await check("anon cannot get a signed URL for a scan", async () => {
  // Any refusal satisfies this: 401/403 from the gateway, or the storage API's
  // own 400/404 "not found"/"unauthorized", which is what a private object
  // answers to a role with no read policy.
  const response = await storage(`object/sign/actas/match-${matchId ?? 0}/probe.jpg`, {
    method: "POST",
    body: JSON.stringify({ expiresIn: 60 }),
  });
  const body = response.body;
  const signed =
    body && typeof body === "object" ? body.signedURL ?? body.signedUrl ?? null : null;
  if (signed) return [FAIL, `anon got a signed URL for a private scan: ${String(signed).slice(0, 40)}…`];
  const refusal = isDeniedByPrivilege(response)
    ? `HTTP ${response.status}`
    : storageError(response);
  if (refusal) return [PASS, `refused: ${refusal} (HTTP ${response.status})`];
  if (response.ok) {
    return [FAIL, `HTTP ${response.status} without an error body: ${JSON.stringify(body)}`];
  }
  return [PASS, `refused: HTTP ${response.status}`];
});

const failed = results.filter((result) => result.outcome === FAIL);
const inconclusive = results.filter((result) => result.outcome === INCONCLUSIVE);
console.log(
  `\n${counts.PASS}/${results.length} checks passed${failed.length ? `, ${counts.FAIL} FAILED` : ""}${
    inconclusive.length ? `, ${counts.INCONCLUSIVE} INCONCLUSIVE` : ""
  }`,
);
if (inconclusive.length) {
  console.log("Inconclusive checks prove nothing either way (no precondition to test):");
  for (const result of inconclusive) console.log(`  · ${result.name} — ${result.detail}`);
}
console.log(`Cleanup: delete from public.matches where matchday = ${PROBE.matchday};`);
process.exit(failed.length ? 1 : 0);
