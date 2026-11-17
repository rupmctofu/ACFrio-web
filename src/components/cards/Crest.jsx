import { useState } from "react";
import teamData from "../../data/teamData.json";
import { CLUB_SLUG, teamCrest, teamInitials } from "../../data/competition";

const SIZES = {
  sm: "h-7 w-7 rounded-md text-[10px]",
  md: "h-10 w-10 rounded-lg text-[12px]",
  lg: "h-24 w-24 rounded-2xl text-xl sm:h-28 sm:w-28 sm:text-2xl",
  /* The poster size: the two faces of the fixture, the biggest marks on the page. */
  xl: "h-28 w-28 rounded-2xl text-2xl sm:h-32 sm:w-32 sm:text-3xl",
};

/** The club shows its own logo; every rival shows the crest the source publishes. */
export const crestSrc = (slug) =>
  slug === CLUB_SLUG ? teamData.club.logo : teamCrest(slug);

/**
 * Crest with an initials fallback: two clubs in the league publish no crest, and
 * a missing image must never become an invented badge.
 */
export function Crest({ slug, size = "sm", className = "" }) {
  const src = crestSrc(slug);
  const [failed, setFailed] = useState(false);
  const box =
    `inline-flex shrink-0 items-center justify-center border border-acf-line bg-acf-dark font-semibold uppercase text-acf-grey ${SIZES[size]} ${className}`;

  if (!src || failed) {
    return (
      <span className={box} aria-hidden="true">
        {teamInitials(slug)}
      </span>
    );
  }

  return (
    <span className={box} aria-hidden="true">
      <img
        src={src}
        alt=""
        loading="lazy"
        className="h-full w-full rounded-[inherit] object-contain p-0.5"
        onError={() => setFailed(true)}
      />
    </span>
  );
}
