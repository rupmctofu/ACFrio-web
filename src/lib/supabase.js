/**
 * Supabase platform client.
 *
 * The site is a static build with no server of its own, so the two public
 * values live in the Vite environment and ship in the bundle: that is correct
 * and safe, because every rule is enforced by row level security in
 * supabase/schema.sql, never by this file.
 *
 * The SDK is imported on demand. The landing page must stay as fast as it was
 * before this feature existed, and nothing on it needs the client until a player
 * taps a button, so the ~90 kB gzip of @supabase/supabase-js is not paid on
 * first paint.
 *
 * With no environment configured the client never resolves and every caller
 * treats the backend as absent (spec S6). Nothing throws at import time, so a
 * missing variable cannot break the build or a deploy.
 */
const url = import.meta.env.VITE_SUPABASE_URL?.trim() ?? "";
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ?? "";

/** True when both public values are present, so the attendance surfaces can work. */
export const isConfigured = Boolean(url && anonKey);

/**
 * A uniform failure for "the backend is not configured". Callers show an
 * explanation instead of an empty state that looks like real data.
 */
export class BackendUnavailable extends Error {
  constructor() {
    super("Supabase is not configured: set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.");
    this.name = "BackendUnavailable";
    this.code = "backend-unavailable";
  }
}

let pending = null;

/** The client, or a rejection that the UI knows how to explain. */
export function client() {
  if (!isConfigured) return Promise.reject(new BackendUnavailable());
  if (!pending) {
    pending = import("@supabase/supabase-js").then(({ createClient }) =>
      createClient(url, anonKey, {
        auth: {
          // The owner's magic link lands back on the same page and the session
          // is kept on the device; players never authenticate at all.
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      }),
    );
  }
  return pending;
}
