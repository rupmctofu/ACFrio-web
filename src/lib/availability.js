/**
 * How ready the squad is for one match.
 *
 * A squad of fifteen playing seven-a-side football: seven confirmations are
 * enough to play, and the squad size is the one the block already lists, so the
 * bar measures confirmations against the whole squad instead of inventing a
 * target of its own.
 *
 * Pure on purpose. The threshold that turns the bar red on the seventh player
 * is the one rule of this block that a test can pin without a browser, and the
 * store that holds the answers stays where it was.
 */
export const PLAYERS_NEEDED = 7;

export function availabilityOf(confirmed, squadSize) {
  const going = Number.isFinite(confirmed) ? Math.max(0, confirmed) : 0;
  const total = Number.isFinite(squadSize) && squadSize > 0 ? squadSize : 0;
  const percent = total === 0 ? 0 : Math.min(100, Math.round((going / total) * 100));

  return {
    going,
    total,
    percent,
    ready: going >= PLAYERS_NEEDED,
    missing: Math.max(0, PLAYERS_NEEDED - going),
  };
}
