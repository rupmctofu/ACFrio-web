#!/usr/bin/env node
/**
 * Live check of the attendance backend.
 *
 * Everything in tests/no-backend.test.mjs proves the site survives WITHOUT a
 * Supabase project. This script proves the other half: that the schema accepts
 * what the app sends, and that the row level security refuses what it must
 * refuse. It cannot be run offline and it is not part of `npm test`, because it
 * needs a real project and it writes data.
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

/** One PostgREST call as `anon`, which is exactly what the public site is. */
async function rest(path, init = {}) {
  const response = await fetch(`${base}/rest/v1/${path}`, {
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
  return { ok: response.ok, status: response.status, body };
}

const results = [];
async function check(name, run) {
  try {
    const [passed, detail] = await run();
    results.push({ name, passed, detail });
    console.log(`${passed ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
  } catch (error) {
    results.push({ name, passed: false, detail: error.message });
    console.log(`FAIL  ${name} — ${error.message}`);
  }
}

let matchId = null;

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
  const { ok, body } = await rest(`matches?select=id,closed_at&id=eq.${matchId}`);
  return [ok && Array.isArray(body) && body.length === 1, `${body?.length ?? "?"} row(s)`];
});

await check("anon cannot close a match", async () => {
  await rest(`matches?id=eq.${matchId}`, {
    method: "PATCH",
    body: JSON.stringify({ closed_at: new Date().toISOString() }),
  });
  // The write may be silently filtered by RLS, so the only trustworthy check is
  // reading the row back.
  const { body } = await rest(`matches?select=closed_at&id=eq.${matchId}`);
  const closed = body?.[0]?.closed_at ?? null;
  return [closed === null, closed === null ? "closed_at still null" : `closed_at was set to ${closed}`];
});

await check("anon cannot read the admin list", async () => {
  const { ok, body } = await rest("admins?select=email");
  return [ok && Array.isArray(body) && body.length === 0, `${body?.length ?? "denied"} row(s)`];
});

await check("anon cannot read the acta scans", async () => {
  const { ok, body } = await rest("actas?select=storage_path");
  return [ok && Array.isArray(body) && body.length === 0, `${body?.length ?? "denied"} row(s)`];
});

await check("anon can read an acta's state and nothing more", async () => {
  const { ok, body } = await rest("rpc/acta_state", {
    method: "POST",
    body: JSON.stringify({ p_match_id: matchId }),
  });
  const states = ["none", "pending", "reviewed"];
  return [ok && states.includes(body), `state: ${JSON.stringify(body)}`];
});

await check("declaring answers upserts instead of duplicating", async () => {
  const write = await rest("attendance", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates" },
    body: JSON.stringify({ match_id: matchId, player_id: 1, status: "in" }),
  });
  if (!write.ok) throw new Error(`insert HTTP ${write.status}: ${JSON.stringify(write.body)}`);

  const first = await rest(`attendance?select=status&match_id=eq.${matchId}&player_id=eq.1`);
  const second = await rest(`attendance?match_id=eq.${matchId}&player_id=eq.1`, {
    method: "PATCH",
    body: JSON.stringify({ status: "out", updated_at: new Date().toISOString() }),
  });
  if (!second.ok) throw new Error(`update HTTP ${second.status}`);

  const after = await rest(`attendance?select=status&match_id=eq.${matchId}&player_id=eq.1`);
  const single = after.body?.length === 1;
  const flipped = after.body?.[0]?.status === "out";
  return [
    first.body?.[0]?.status === "in" && single && flipped,
    `in -> out, ${after.body?.length ?? 0} row (no duplicate)`,
  ];
});

await check("the probe match is still open", async () => {
  const { body } = await rest(`matches?select=closed_at&id=eq.${matchId}`);
  return [body?.[0]?.closed_at === null, "open"];
});

const failed = results.filter((result) => !result.passed);
console.log(
  `\n${results.length - failed.length}/${results.length} checks passed${
    failed.length ? `, ${failed.length} FAILED` : ""
  }`,
);
console.log(`Cleanup: delete from public.matches where matchday = ${PROBE.matchday};`);
process.exit(failed.length ? 1 : 0);
