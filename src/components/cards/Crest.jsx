import { useState } from "react";
import teamData from "../../data/teamData.json";
import { CLUB_SLUG, teamCrest, teamFullName, teamInitials } from "../../data/competition";
import { crestColourArt, crestInkArt, crestWhiteArt } from "../../data/crest-art";
import { routeLink } from "../../lib/router.js";

const SIZES = {
  sm: "h-7 w-7 rounded-md text-[0.625rem]",
  md: "h-10 w-10 rounded-lg text-[0.75rem]",
  lg: "h-24 w-24 rounded-2xl text-xl sm:h-28 sm:w-28 sm:text-2xl",
  /* The poster size: the two faces of the fixture, the biggest marks on the page. */
  xl: "h-28 w-28 rounded-2xl text-2xl sm:h-32 sm:w-32 sm:text-3xl",
};

/**
 * The club shows its own shield and every rival the one the source publishes.
 * A supplied vector wins over both: it is the only version that is not a raster
 * crest, and for the club it is the white artwork tinted to the brand red.
 */
export const crestSrc = (slug) =>
  crestColourArt(slug) ?? (slug === CLUB_SLUG ? teamData.club.logo : teamCrest(slug));

/**
 * The one-ink copy of the same crest.
 *
 * The club has real vector artwork now (`logo-ACF.svg`, 36 paths, one white ink),
 * so its mark is masked straight from the SVG and stays crisp at any size. The
 * rivals publish nothing but an 80px webp, so their ink is a mask derived from
 * that bitmap by `scripts/build-crest-masks.mjs`.
 *
 * Either way it is a mask, not a colour image: it paints in whatever the
 * surrounding text colour is, which is how a fixture three weeks away keeps its
 * club mark without shouting.
 */
export const crestInkSrc = (slug) =>
  slug === CLUB_SLUG ? "/assets/badges/logo-ACF.svg" : (crestInkArt(slug) ?? `/assets/badges/ink/${slug}.png`);

/** The vector the club supplied, kept in one place for any future use. */
export const CLUB_VECTOR = "/assets/badges/logo-ACF.svg";

/**
 * The mark itself: no decision about whether it is a link lives in here.
 *
 * Crest with an initials fallback: two clubs in the league publish no crest, and
 * a missing image must never become an invented badge.
 *
 * The mark sits on nothing — no border, no panel behind it. A crest is an object,
 * not a chip: boxing it put a second rectangle around artwork that already has
 * its own outline, and on a dark card the frame read louder than the badge
 * (owner, L33). The box still holds its size so rows keep their rhythm; it just
 * stops painting.
 */
function CrestMark({ slug, size, ink, className }) {
  const src = crestSrc(slug);
  const [failed, setFailed] = useState(false);
  const box =
    `inline-flex shrink-0 items-center justify-center font-semibold uppercase text-acf-grey ${SIZES[size]} ${className}`;

  /*
   * A club with no colour artwork is drawn from its one-ink file, painted white,
   * instead of falling back to a bitmap with a box baked into the image (Giner).
   */
  const whiteArt = ink ? null : crestWhiteArt(slug);
  const maskSource = ink ? crestInkSrc(slug) : whiteArt;
  const maskTone = ink ? "text-acf-grey" : "text-white";

  if (!maskSource && (!src || failed)) {
    /* Two clubs publish no crest at all. On a quiet card those initials keep the
       same bare, borderless treatment as the ink marks, so one missing badge
       does not turn into the only boxed thing on the card. */
    return (
      <span
        className={
          ink
            ? `inline-flex shrink-0 items-center justify-center font-semibold uppercase text-acf-grey ${SIZES[size]} ${className}`
            : box
        }
        aria-hidden="true"
      >
        {teamInitials(slug)}
      </span>
    );
  }

  if (maskSource) {
    const mask = `url("${maskSource}")`;
    return (
      <span
        className={`inline-flex shrink-0 items-center justify-center ${maskTone} ${SIZES[size]} ${className}`}
        aria-hidden="true"
      >
        <span
          className="h-full w-full bg-current"
          style={{
            WebkitMaskImage: mask,
            maskImage: mask,
            WebkitMaskSize: "contain",
            maskSize: "contain",
            WebkitMaskRepeat: "no-repeat",
            maskRepeat: "no-repeat",
            WebkitMaskPosition: "center",
            maskPosition: "center",
          }}
        />
      </span>
    );
  }

  return (
    <span className={box} aria-hidden="true">
      <img
        src={src}
        alt=""
        loading="lazy"
        className="h-full w-full rounded-[inherit] object-contain"
        onError={() => setFailed(true)}
      />
    </span>
  );
}

/*
 * The mark is aria-hidden, so a link wrapped around it would be a control with no
 * name. The ring is drawn on the mark instead of the anchor because the mark is
 * the element that already carries the right corner radius for its size, and a
 * box-shadow never moves the layout.
 */
const FOCUS_RING = "group-focus-visible:ring-2 group-focus-visible:ring-acf-red";

/**
 * The club's crest, and — when `to` is given — the way into that club's page.
 *
 * `to` is the route target (`/equipo/<slug>`); without it the crest is exactly
 * the mark it has always been, so every existing caller keeps its markup. The
 * link is quiet on purpose: a small scale and a little opacity, and the red ring
 * on the mark for whoever arrives with the keyboard. Nothing here moves the
 * layout, because a crest sits inside rows whose rhythm is the point.
 *
 * The accessible name is the club's official one (`teamFullName`, never the
 * display alias) — the artwork says nothing to a screen reader, so the link has
 * to say which club it opens.
 *
 * Never pass `to` where the crest already sits inside an anchor: a link inside a
 * link is invalid HTML and the browser breaks the outer one. Call sites that
 * already wrap the crest in a `routeLink` (ClubList, JornadaView, EquipoView)
 * leave it alone, and the club's own crest on its own page is not a link to
 * itself.
 */
export function Crest({ slug, size = "sm", ink = false, className = "", to = null }) {
  const mark = (
    <CrestMark
      slug={slug}
      size={size}
      ink={ink}
      className={to ? `${className} ${FOCUS_RING}`.trim() : className}
    />
  );

  if (!to) return mark;

  return (
    <a
      {...routeLink(to)}
      aria-label={`Ficha de ${teamFullName(slug)}`}
      className="group inline-flex shrink-0 rounded-[inherit] transition duration-200 ease-out hover:scale-105 hover:opacity-90 focus-visible:outline-none motion-reduce:transition-none motion-reduce:hover:scale-100"
    >
      {mark}
    </a>
  );
}
