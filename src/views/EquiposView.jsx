import { Shield } from "lucide-react";
import {
  CLUB_SLUG,
  cupTable,
  league,
  leagueTable,
  teamFullName,
  teamName,
} from "../data/competition.js";
import Card from "../components/cards/Card.jsx";
import { Crest } from "../components/cards/Crest.jsx";
import { routeLink } from "../lib/router.js";

/**
 * `/equipos` — the eleven clubs of the season, each one a way into its page
 * (S5, S7).
 *
 * The list is the league table and the cup table put together, which is exactly
 * the eleven clubs the source publishes: no roster is kept here, so a club that
 * joins either competition appears on this page without anyone editing it. The
 * order is the way the page is read — the league ranking first, because a
 * position is information — and the clubs that only play the cup follow it in
 * alphabetical order with no position to show.
 */

const collator = new Intl.Collator("es");

/** The eleven clubs, ranked ones first, each with its league position or null. */
function allClubs() {
  const leagueRows = leagueTable().rows;
  const ranks = new Map(leagueRows.map((row) => [row.slug, row.rank]));

  const seen = new Set();
  const clubs = [];
  for (const row of [...leagueRows, ...cupTable().rows]) {
    if (seen.has(row.slug)) continue;
    seen.add(row.slug);
    clubs.push({ slug: row.slug, rank: ranks.get(row.slug) ?? null });
  }

  return clubs.sort((a, b) => {
    if (a.rank !== null && b.rank !== null) return a.rank - b.rank;
    if (a.rank !== null) return -1;
    if (b.rank !== null) return 1;
    return collator.compare(teamFullName(a.slug), teamFullName(b.slug));
  });
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

export default function EquiposView() {
  const clubs = allClubs();

  return (
    <section className="relative pb-16 pt-28">
      <div className="wrap">
        <header className="max-w-2xl">
          <p className="text-micro font-semibold uppercase tracking-[0.3em] text-acf-red-soft">
            {league.name}
          </p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Equipos
          </h1>
          <p className="mt-3 text-row leading-relaxed text-acf-snow/70">
            Los once clubes de la liga y la copa, en el orden en que están. Elige uno
            y mira lo suyo.
          </p>
        </header>

        <Card
          title="Los once"
          hint={`${league.name} · ${clubs.length} clubes`}
          icon={Shield}
          href={league.sources.table}
          linkLabel="Abrir la clasificación oficial de la liga en CEGARRAF"
          className="mt-8"
          bodyClassName="flex flex-col"
        >
          <ul className="divide-y divide-acf-line-soft border-t border-acf-line-soft">
            {clubs.map((club) => (
              <ClubRow key={club.slug} club={club} />
            ))}
          </ul>
          {/* The figure on the right is a league position, and one club can have
              none: the cup publishes its own group. The dash says that, instead
              of a zero that would read as last place. */}
          <p className="mt-auto border-t border-acf-line-soft px-4 py-3.5 text-micro font-semibold uppercase tracking-[0.16em] text-acf-dim sm:px-6">
            La cifra es la posición en liga. Un guion: juega la copa.
          </p>
        </Card>
      </div>
    </section>
  );
}
