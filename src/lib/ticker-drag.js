/**
 * Where the ticker resumes after the reader has dragged it.
 *
 * The marquee is one CSS animation that moves the track leftwards at a constant
 * rate. While the pointer is down the animation is off and the track follows the
 * finger; on release the animation has to restart at the offset the reader left
 * it at, which means turning a pixel offset into a negative `animation-delay`.
 *
 * Two things make this less obvious than it looks. A drag to the right produces
 * a negative distance travelled, and a positive `animation-delay` makes the
 * animation *wait* instead of starting further along, so the result is wrapped
 * into the loop. And a drag past a whole loop lands back where it began, which
 * the modulo handles by returning zero rather than the loop length.
 */
export function resumeSeconds(offsetPx, pixelsPerSecond, loopSeconds) {
  if (
    !Number.isFinite(offsetPx) ||
    !Number.isFinite(pixelsPerSecond) ||
    !Number.isFinite(loopSeconds) ||
    pixelsPerSecond <= 0 ||
    loopSeconds <= 0
  ) {
    return 0;
  }

  const travelled = -offsetPx / pixelsPerSecond;
  return ((travelled % loopSeconds) + loopSeconds) % loopSeconds;
}
