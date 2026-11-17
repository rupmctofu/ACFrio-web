/**
 * Attendance data layer: every read and write the UI needs, in one place.
 *
 * Two layers, deliberately kept apart (see odd/tasks/match-attendance.md):
 *   * the DECLARED list — informational, a headcount, written by anyone;
 *   * the ACTA — the referee's scanned sheet, filed by the owner and the
 *     authority on who actually played.
 *
 * Nothing here reconciles the two. The owner does that by hand, because a paper
 * sheet filled in with a pen cannot be read reliably by code.
 */
import { client, isConfigured } from "./supabase.js";

export { isConfigured };

/** Supabase errors carried as plain Error, with the original code kept. */
function fail(error) {
  const wrapped = new Error(error?.message ?? "Supabase request failed");
  wrapped.code = error?.code;
  wrapped.cause = error;
  return wrapped;
}

/**
 * The row for a fixture, created on first use. Callers pass what the fixture
 * card already knows; nothing is invented when a field is unknown.
 */
export async function ensureMatch({ season, competition, matchday, kickoff, rival }) {
  const db = await client();
  const { data, error } = await db.rpc("ensure_match", {
    p_season: season,
    p_competition: competition,
    p_matchday: matchday,
    p_kickoff: kickoff ?? null,
    p_rival: rival ?? null,
  });
  if (error) throw fail(error);
  return data;
}

/** Declared answers for one match, keyed by squad id: `{ [playerId]: "in" | "out" }`. */
export async function fetchAnswers(matchId) {
  const db = await client();
  const { data, error } = await db
    .from("attendance")
    .select("player_id, status, updated_at")
    .eq("match_id", matchId);
  if (error) throw fail(error);
  return Object.fromEntries((data ?? []).map((row) => [row.player_id, row.status]));
}

/** Declares one answer. Upsert, so changing your mind replaces your previous one. */
export async function setAnswer({ matchId, playerId, status }) {
  const db = await client();
  const { error } = await db.from("attendance").upsert(
    {
      match_id: matchId,
      player_id: playerId,
      status,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "match_id,player_id" },
  );
  if (error) throw fail(error);
}

/** "none" | "pending" | "reviewed" — read through the RPC, so no scan path leaks. */
export async function fetchActaState(matchId) {
  const db = await client();
  const { data, error } = await db.rpc("acta_state", { p_match_id: matchId });
  if (error) throw fail(error);
  return data ?? "none";
}

// ---------------------------------------------------------------------------
// Owner-only surfaces. The database enforces this; the UI only hides the door.
// ---------------------------------------------------------------------------

/** Sends the magic link. No password is ever created or stored. */
export async function signInOwner(email) {
  const db = await client();
  const { error } = await db.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: window.location.href },
  });
  if (error) throw fail(error);
}

export async function currentOwner() {
  if (!isConfigured) return null;
  const db = await client();
  const { data } = await db.auth.getSession();
  return data?.session?.user ?? null;
}

export async function signOutOwner() {
  const db = await client();
  await db.auth.signOut();
}

/** Files the scan and records it as pending review. One acta per match. */
export async function uploadActa({ matchId, file, notes, email }) {
  const db = await client();
  const safeName = file.name.replace(/[^\w.-]+/g, "_");
  const path = `match-${matchId}/${Date.now()}-${safeName}`;

  const upload = await db.storage.from("actas").upload(path, file, { upsert: true });
  if (upload.error) throw fail(upload.error);

  const { error } = await db.from("actas").upsert(
    {
      match_id: matchId,
      storage_path: path,
      uploaded_by: email ?? null,
      uploaded_at: new Date().toISOString(),
      reviewed_at: null,
      notes: notes ?? null,
    },
    { onConflict: "match_id" },
  );
  if (error) throw fail(error);
  return path;
}

/** Every acta with its match, newest first, for the owner's panel. */
export async function fetchActas() {
  const db = await client();
  const { data, error } = await db
    .from("actas")
    .select("match_id, storage_path, uploaded_at, reviewed_at, notes, matches(competition, matchday)")
    .order("uploaded_at", { ascending: false });
  if (error) throw fail(error);
  return data ?? [];
}

/** Short-lived link, because the bucket is private. */
export async function actaUrl(storagePath) {
  const db = await client();
  const { data, error } = await db.storage.from("actas").createSignedUrl(storagePath, 600);
  if (error) throw fail(error);
  return data.signedUrl;
}

/**
 * Marks the acta as checked and, with it, closes the match's declared list.
 *
 * The order matters and the guard is not decoration: `closed_at` means "this
 * list was checked against the paper". Closing a match with no acta would
 * assert a reconciliation that never happened, so it throws instead.
 */
export async function closeMatch(matchId) {
  const db = await client();
  const now = new Date().toISOString();

  const acta = await db
    .from("actas")
    .update({ reviewed_at: now })
    .eq("match_id", matchId)
    .select("match_id");
  if (acta.error) throw fail(acta.error);
  if (!acta.data || acta.data.length === 0) {
    throw new Error(
      "Este partido no tiene acta subida, así que no se puede cerrar: no habría nada con lo que comparar la lista.",
    );
  }

  const match = await db.from("matches").update({ closed_at: now }).eq("id", matchId);
  if (match.error) throw fail(match.error);
}
