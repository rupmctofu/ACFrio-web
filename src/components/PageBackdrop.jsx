/**
 * The page's backdrop: the club's photograph, out of focus, dissolving down
 * behind the top of the dashboard.
 *
 * It used to be a band of its own that pushed everything down half a screen
 * (owner, L23), with a copy of the wordmark inside it. Both are gone (owner,
 * L28): the photograph is now the page's ground for as long as the content
 * needs it, blurred, and the content sits on it from just under the fixed
 * header instead of waiting below an empty dissolve.
 *
 * The photograph leaves slowly — `.page-backdrop` in index.css masks it from
 * fully opaque at the top to fully transparent near the bottom of the layer, so
 * it thins out as it descends instead of stopping at a line (owner, L29). The
 * mask does the work, not a black sheet on top: a sheet stops being opaque at
 * some percentage, and that stop is the cut everybody sees.
 *
 * The image is a real project asset — two players under the floodlights with
 * the night pitch between them — scaled up so its blur has no edge to show. It
 * takes no pointer events and is announced to nobody: it is a ground.
 */
export default function PageBackdrop() {
  return (
    <div
      aria-hidden="true"
      className="page-backdrop pointer-events-none absolute inset-x-0 top-0 -z-10 h-[125vh] overflow-hidden"
    >
      {/*
       * The photograph overflows the top of the layer on purpose: it is pushed up
       * and scaled past the frame so its own dark upper edge is never the first
       * thing under the header. The scale pays for the shift — the picture bleeds
       * well past the box, so moving it up cannot open a gap at the bottom.
       *
       * The blur is deliberately heavy: the pitch becomes a green-and-red wash
       * that belongs to the club's palette without competing with a single card.
       */}
      <picture className="block h-full w-full">
        <source
          type="image/webp"
          srcSet="/assets/backgrounds/pitch-night-900.webp 900w, /assets/backgrounds/pitch-night-1536.webp 1536w"
          sizes="100vw"
        />
        <img
          src="/assets/backgrounds/pitch-night.jpg"
          alt=""
          className="h-full w-full -translate-y-[8%] scale-[1.35] object-cover object-[55%_20%] blur-[20px] sm:blur-[34px]"
          loading="eager"
          fetchPriority="high"
        />
      </picture>

      {/* The fixed header's wordmark is read against this corner at rest, so the
          very top keeps a little of the canvas behind it. It fades over 8rem
          with a mid stop rather than a straight 50% ramp, because a ramp that
          ends where the photo is bright draws its own horizontal seam. */}
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-acf-dark/45 via-acf-dark/15 to-transparent" />    </div>
  );
}
