/**
 * The boot tracker: what the splash screen waits for.
 *
 * The curtain lives in `index.html`, outside React, so it is on screen before
 * the bundle, the fonts or the first Supabase answer. React tells it when to
 * lift, and the honest moment to lift is this: the first commit is mounted and
 * the requests that commit started have answered.
 *
 * Why not simply lift on mount: the dashboard's attendance block prints
 * "0 / 15" while it waits and then swaps that one line for a row of faces (and
 * drops its own button row if the reader is already going), so every card below
 * it moves. Lifting on mount would put that jump on screen with a curtain in
 * front of it.
 *
 * Why a deadline: a phone under the floodlights has a bad connection, and a
 * request that never answers cannot keep the club behind a dark screen. After
 * the deadline the curtain lifts and the card speaks for itself — the clock is
 * part of the contract, not a fallback nobody tested.
 *
 * Nothing here touches the DOM, so the rules are tested in Node.
 */

/** Long enough for a slow phone, short enough that nobody stares at a logo. */
export const BOOT_DEADLINE_MS = 4000;

export function createBootTracker({ deadlineMs = BOOT_DEADLINE_MS } = {}) {
  let pending = 0;
  let mounted = false;
  let booted = false;
  let givenUp = false;
  const listeners = new Set();

  // Node keeps the process alive for a live timer; tests must not wait 4 s for
  // a tracker they disposed. In the browser `unref` does not exist and the
  // timeout is exactly what we want.
  const deadline = setTimeout(() => {
    givenUp = true;
    settle();
  }, deadlineMs);
  deadline?.unref?.();

  function settle() {
    if (booted || !mounted) return;
    if (pending > 0 && !givenUp) return;
    booted = true;
    clearTimeout(deadline);
    for (const listener of listeners) call(listener);
    listeners.clear();
  }

  /**
   * One listener throwing must not rob the others of the news — and it must not
   * throw out of `whenBooted` either, where the caller is a React effect that
   * runs during a commit.
   */
  function call(listener) {
    try {
      listener();
    } catch (cause) {
      console.error("boot listener failed", cause);
    }
  }

  return {
    /**
     * Declares one request the first screen is waiting for. Returns the way to
     * say it answered; calling it twice is the same as calling it once, because
     * a promise that settles on both paths must not pull the count down twice.
     */
    beginWork() {
      if (booted) return () => {};
      pending += 1;
      let settled = false;
      return () => {
        if (settled) return;
        settled = true;
        pending -= 1;
        settle();
      };
    },

    /**
     * The first commit is on screen: whatever registered until now is all there
     * is. Mounting is its own signal because a page that waits for nothing (a
     * route with no attendance and no vote) must lift at once, not at the
     * deadline.
     */
    markMounted() {
      mounted = true;
      settle();
    },

    /** Told once, or at once if the curtain is already up. Returns a cancel. */
    whenBooted(listener) {
      if (booted) {
        call(listener);
        return () => {};
      }
      listeners.add(listener);
      return () => listeners.delete(listener);
    },

    get isBooted() {
      return booted;
    },

    /** Drops the deadline and the audience: for tests, and for a hard unmount. */
    dispose() {
      clearTimeout(deadline);
      listeners.clear();
    },
  };
}

/**
 * The app's one tracker. Components register their first read, `App` reports the
 * mount and lifts the curtain.
 */
const tracker = createBootTracker();

export const beginWork = tracker.beginWork;
export const markAppMounted = tracker.markMounted;
export const whenBooted = tracker.whenBooted;
