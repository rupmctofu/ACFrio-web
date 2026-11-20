import { Shield } from "lucide-react";
import {
  CLUB_SLUG,
  cupTable,
  leagueTable,
  teamFullName,
  teamName,
} from "../data/competition.js";
import Card from "../components/cards/Card.jsx";
import { Crest } from "../components/cards/Crest.jsx";
import { routeLink } from "../lib/router.js";

/**
 * The clubs of a table, as a card inside the tab that draws that table (S22).
 *
 * This was the third tab of `/competicion`, the one that listed the eleven clubs
 * of the season together. The owner did not want a section for the names alone:
 * "eliminamos esa tercera etapa de equipos y la ponemos en liga y en Copa cada
 * uno con sus respectivos equipos". So there is no merged list any more, and no
 * new markup either: the Liga tab draws the clubs of the league table and the
 * Copa tab the clubs of the cup table, and both use this card, which takes the
 * selection it is given. A club is a row — crest, name, position, link — and that
 * row is written once, here.
 *
 * The selections are named after the table they come from and nothing else: no
 * roster is kept in this file, so a club that joins either competition appears
 * without anyone editing a list.
 */

/* One collator for the club names, so the order is the same on every render and
   an accent does not move a club up or down. */
const collator = new Intl.Collator("es");

/**
 * Ranked clubs first, then the ones with no league position, by name.
 *
 * A cup club that does not play the league has no position to print, and the
 * alphabet is the only honest order left for it.
 */
const byRank = (a, b) => {
  if (a.rank !== null && b.rank !== null) return a.rank - b.rank;
  if (a.rank !== null) return -1;
  if (b.rank !== null) return 1;
  return collator.compare(teamFullName(a.slug), teamFullName(b.slug));
};

/** The clubs of the league table, in the order the table puts them. */
export function leagueClubs() {
  return leagueTable()
    .rows.map((row) => ({ slug: row.slug, rank: row.rank ?? null }))
    .sort(byRank);
}

/**
 * The clubs of the cup table, each with its league position where it has one.
 *
 * The cup publishes its own group, so its six clubs are not the league's seven:
 * the two that meet the league are ranked with it, the rest carry a dash.
 */
export function cupClubs() {
  const ranks = new Map(leagueTable().rows.map((row) => [row.slug, row.rank]));
  return cupTable()
    .rows.map((row) => ({ slug: row.slug, rank: ranks.get(row.slug) ?? null }))
    .sort(byRank);
}

/** One club: crest, name and where it sits in the league, all of it the link. */
function ClubRow({ club }) {
  const ours = club.slug === CLUB_SLUG;

  return (
    <li className={ours ? "bg-acf-red/[0.12]" : ""}>
      <a
        {...routeLink(`/equipo/${club.slug}`)}
        title={teamFullName(club.slug)}
        className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-white/[0.04] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acf-red sm:px-6"
      >
        <Crest slug={club.slug} size="md" />
        <span className="min-w-0 flex-1">
          <span
            className={`block truncate text-row font-bold uppercase tracking-[0.04em] ${
              ours ? "text-white" : "text-acf-snow/80"
            }`}
          >
            {teamName(club.slug)}
          </span>
          {/* The short label is a display alias: the official name stays readable. */}
          <span className="sr-only">{teamFullName(club.slug)}</span>
        </span>
        <span
          className={`w-12 text-right font-display text-lg font-medium leading-none tabular-nums ${
            ours ? "text-acf-red" : club.rank === null ? "text-acf-dim" : "text-acf-snow/60"
          }`}
        >
          {club.rank === null ? (
            "—"
          ) : (
            <>
              {club.rank}
              <span className="align-super text-[0.625rem] font-semibold">º</span>
            </>
          )}
        </span>
      </a>
    </li>
  );
}

/**
 * The clubs passed to it, as a card of the tab that owns them.
 *
 * The title and the hint are the caller's, because the honest label of the list
 * names the competition it belongs to; the figure column and the note under it
 * are the same in both tabs, so they live here.
 */
export default function ClubList({
  id = "competicion-clubes",
  title,
  hint,
  href,
  linkLabel,
  clubs,
  className = "",
}) {
  return (
    <Card
      id={id}
      title={title}
      hint={hint}
      icon={Shield}
      href={href}
      linkLabel={linkLabel}
      className={className}
      bodyClassName="flex flex-col"
    >
      <ul className="divide-y divide-acf-line-soft border-t border-acf-line-soft">
        {clubs.map((club) => (
          <ClubRow key={club.slug} club={club} />
        ))}
      </ul>
      {/* The figure on the right is a league position, and one club can have
          none: the cup publishes its own group. The dash says that, instead of a
          zero that would read as last place. */}
      <p className="mt-auto border-t border-acf-line-soft px-4 py-3.5 text-micro font-semibold uppercase tracking-[0.16em] text-acf-dim sm:px-6">
        La cifra es la posición en liga. Un guion: juega la copa.
      </p>
    </Card>
  );
}
