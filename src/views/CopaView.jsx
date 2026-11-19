import { BarChart3, CalendarDays, Trophy } from "lucide-react";
import {
  CLUB_SLUG,
  cup,
  cupTable,
  fixtureDateLabel,
  fixtureTimeLabel,
  matchdayFixtures,
  teamFullName,
  teamName,
} from "../data/competition.js";
import Card from "../components/cards/Card.jsx";
import { Crest } from "../components/cards/Crest.jsx";
import { routeLink } from "../lib/router.js";

/**
 * `/copa` — the cup, as the federation publishes it: one group, five matchdays,
 * and a knockout phase that has been announced and not yet drawn.
 *
 * The page is in the order the competition is played: the liguilla first (its
 * table, then its rounds), and the fase final underneath. The owner wanted the
 * elimination visible already, so it is not hidden at the foot of a long page —
 * it sits beside the table on a wide screen and directly under it on a phone.
 *
 * The board is the interesting part, because it is the one thing here that
 * cannot be drawn from the data. See `KnockoutBoard` for what it does not say.
 */

/* The rounds the source publishes, in order: a round exists because the calendar
   has fixtures in it, never because a round name was written here. */
const ROUNDS = [...new Set(cup.fixtures.map((fixture) => fixture.matchday))].sort(
  (a, b) => a - b,
);

/* A round is played when every one of its fixtures is. The cup carries a table
   with one settled matchday and fourteen matches still ahead, and the count of
   rounds is the honest way to say how far into the group it is. */
const PLAYED_ROUNDS = ROUNDS.filter((round) =>
  matchdayFixtures("cup", round).every((fixture) => fixture.status === "played"),
);

const HEAD_CELL = "py-2.5 text-micro font-semibold uppercase tracking-[0.12em] text-acf-dim";
const FIGURE_CELL = "px-1 py-3 text-center text-figure tabular-nums text-acf-snow/60";

/**
 * The liguilla table, with the same anatomy the league table has in
 * `/clasificacion`: the club's row tinted, its rank carrying a red bar against
 * the left edge and its points in red, so the two pages read as the same table.
 *
 * Only the figures the cup publishes are drawn — played and points — because
 * this table answers "how is the group going", and the goals are on the
 * federation's page, one click away through the corner mark.
 */
function GroupTable({ id, rows }) {
  return (
    <div
      className="@container overflow-x-auto"
      tabIndex={0}
      role="region"
      aria-labelledby={`${id}-title`}
    >
      <table className="w-full border-collapse">
        <thead className="sticky top-0 z-10 bg-acf-panel">
          <tr className="border-b border-acf-line">
            <th className={`${HEAD_CELL} w-8 pl-4 pr-1 text-center`}>#</th>
            <th className={`${HEAD_CELL} text-left`}>Equipo</th>
            <th className={`${HEAD_CELL} px-1 text-center`}>PJ</th>
            <th className={`${HEAD_CELL} w-14 pl-2 pr-4 text-right`}>Pts</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const ours = row.slug === CLUB_SLUG;
            return (
              <tr
                key={row.slug}
                className={`border-t border-acf-line-soft transition-colors ${
                  ours ? "bg-acf-red/[0.16]" : "hover:bg-white/[0.03]"
                }`}
              >
                <td
                  className={`w-8 py-3 pl-4 pr-1 text-center font-display text-lg leading-none tabular-nums ${
                    ours
                      ? "text-acf-red shadow-[inset_3px_0_0_var(--color-acf-red)]"
                      : "text-acf-snow/40"
                  }`}
                >
                  {row.rank ?? "—"}
                </td>
                {/* `w-full max-w-0` keeps the name column out of its max-content
                    width, so the table fits the card instead of scrolling on
                    its own on a phone. */}
                <td className="w-full max-w-0 py-3 pr-1">
                  <span className="flex items-center gap-2">
                    <Crest slug={row.slug} size="sm" to={`/equipo/${row.slug}`} />
                    <span
                      title={teamFullName(row.slug)}
                      className={`truncate text-row font-bold uppercase leading-none tracking-[0.04em] ${
                        ours ? "text-white" : "text-acf-snow/80"
                      }`}
                    >
                      {teamName(row.slug)}
                    </span>
                    <span className="sr-only">{teamFullName(row.slug)}</span>
                  </span>
                </td>
                <td className={FIGURE_CELL}>{row.played}</td>
                <td
                  className={`w-14 py-2.5 pl-2 pr-4 text-right font-display text-2xl font-medium leading-none tabular-nums ${
                    ours ? "text-acf-red" : "text-white"
                  }`}
                >
                  <span
                    title={
                      row.sanction
                        ? `${Math.abs(row.sanction)} ${Math.abs(row.sanction) === 1 ? "punto" : "puntos"} menos por sanción`
                        : undefined
                    }
                  >
                    {row.points}
                    {row.sanction ? (
                      <span className="align-super text-[0.625rem] font-semibold text-acf-grey">*</span>
                    ) : null}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/**
 * One club of a cup fixture, as the way into its page (S7).
 *
 * Home is drawn right-aligned with its crest on the inside, so the two badges
 * flank whatever sits between them — the score, or the night — and the names
 * take the outer ends of the line, the way every fixture line on the site is
 * read. The crest stays inside the link here, so it is passed without `to`.
 */
function ClubLink({ slug, side }) {
  return (
    <a
      {...routeLink(`/equipo/${slug}`)}
      title={teamFullName(slug)}
      className={`flex min-w-0 items-center gap-2 rounded-tile py-1 text-acf-snow/85 transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acf-red ${
        side === "home" ? "flex-row-reverse justify-start text-right" : "justify-start"
      }`}
    >
      <Crest slug={slug} size="sm" />
      <span className="min-w-0 truncate text-row font-bold uppercase tracking-[0.04em]">
        {teamName(slug)}
      </span>
    </a>
  );
}

/**
 * One cup match: the two clubs and, between them, the result when it is settled
 * or the night when it is not.
 *
 * The night is drawn match by match instead of once per round, because a cup
 * round does not always play on one date: the fourth matchday spreads its three
 * matches over three days, and a single date on the round heading would be a
 * fact the calendar does not support.
 */
function MatchLine({ fixture }) {
  const result = fixture.status === "played" && fixture.score ? fixture.score : null;
  const ours = fixture.home.slug === CLUB_SLUG || fixture.away.slug === CLUB_SLUG;

  return (
    <li
      className={`grid grid-cols-[1fr_auto_1fr] items-center gap-x-3 px-4 py-3 sm:px-6 ${
        ours ? "bg-acf-red/[0.08]" : ""
      }`}
    >
      <ClubLink slug={fixture.home.slug} side="home" />

      {result ? (
        <span className="whitespace-nowrap font-display text-xl font-medium leading-none tabular-nums text-white">
          <span className="sr-only">Resultado: </span>
          {result.home}
          <span className="mx-1 text-acf-dim">–</span>
          {result.away}
        </span>
      ) : (
        <span className="whitespace-nowrap text-center text-micro font-semibold uppercase leading-tight tracking-[0.1em] text-acf-snow/70">
          {fixtureDateLabel(fixture)}
          <span className="mt-0.5 block text-acf-dim">{fixtureTimeLabel(fixture)}</span>
        </span>
      )}

      <ClubLink slug={fixture.away.slug} side="away" />
    </li>
  );
}

/** One matchday of the group: its fixtures, with the round number as its label. */
function RoundBlock({ round }) {
  const matches = matchdayFixtures("cup", round);

  return (
    <section className="border-t border-acf-line-soft" aria-labelledby={`copa-jornada-${round}`}>
      <h3
        id={`copa-jornada-${round}`}
        className="px-4 pb-1 pt-4 text-micro font-semibold uppercase tracking-[0.2em] text-acf-dim sm:px-6"
      >
        Jornada {round}
      </h3>
      <ul className="divide-y divide-acf-line-soft">
        {matches.map((fixture) => (
          <MatchLine key={`${fixture.home.slug}-${fixture.away.slug}`} fixture={fixture} />
        ))}
      </ul>
    </section>
  );
}

/**
 * The board of the fase final: one column of slots, one per club of the group,
 * every one of them reading "Por sortear".
 *
 * It is deliberately empty of shape. The regulation says only "fase final
 * eliminatoria": it does not say how many clubs qualify, it does not name the
 * rounds, and the federation has published no draw. So there is no round name
 * here (no "cuartos", no "semifinal", no "final"), no pairing, no line joining
 * two slots and no count of rounds — each of those would be a fact invented on
 * the club's own page, and a board that lies is worse than a board that waits.
 *
 * What is left is honest and still useful: the six clubs that are in the cup,
 * the state of the draw, and a surface that will fill in when the draw exists.
 * The slots are alphabetical rather than in table order on purpose: reading the
 * group's ranking into a bracket would suggest a seeding nobody has published.
 */
function KnockoutBoard({ rows }) {
  const collator = new Intl.Collator("es");
  const clubs = [...rows].sort((a, b) => collator.compare(teamFullName(a.slug), teamFullName(b.slug)));

  return (
    <>
      <ol className="space-y-1.5 px-4 pb-4 pt-1 sm:px-6" aria-label="Plazas de la fase final">
        {clubs.map((row) => {
          const ours = row.slug === CLUB_SLUG;
          return (
            <li
              key={row.slug}
              className={`flex items-center gap-3 rounded-tile border border-dashed px-3 py-2.5 ${
                ours ? "border-acf-red/40 bg-acf-red/[0.08]" : "border-acf-line"
              }`}
            >
              {/* The slot is not a link: it names no match and opens nothing.
                  Only the crest is one, as on every other club mark that does
                  not already sit inside an anchor. */}
              <Crest slug={row.slug} size="sm" ink to={`/equipo/${row.slug}`} />
              <span
                title={teamFullName(row.slug)}
                className={`min-w-0 flex-1 truncate text-row font-bold uppercase tracking-[0.04em] ${
                  ours ? "text-white" : "text-acf-snow/70"
                }`}
              >
                {teamName(row.slug)}
              </span>
              <span className="shrink-0 text-micro font-semibold uppercase tracking-[0.16em] text-acf-dim">
                Por sortear
              </span>
            </li>
          );
        })}
      </ol>
      {/* The one line the board owes the reader: why it is empty, and what will
          fill it. No badge and no "próximamente": the sentence is more exact,
          because it names who is missing and what has to happen. */}
      <p className="mt-auto border-t border-acf-line-soft px-4 py-3.5 text-micro font-semibold uppercase leading-relaxed tracking-[0.16em] text-acf-dim sm:px-6">
        La federación no ha publicado el sorteo de la fase final. Cuando lo haga, esta
        pizarra se rellena sola.
      </p>
    </>
  );
}

export default function CopaView() {
  const cupData = cupTable();

  return (
    <section className="relative pb-16 pt-28">
      <div className="wrap">
        <header className="max-w-2xl">
          <p className="text-micro font-semibold uppercase tracking-[0.3em] text-acf-red-soft">
            {cup.name}
          </p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Copa
          </h1>
          <p className="mt-3 text-row leading-relaxed text-acf-snow/70">
            Seis clubes, cinco jornadas y una pizarra vacía. El sorteo lo pone la
            federación; aquí se verá cuando lo publique.
          </p>
        </header>

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card
            id="copa-liguilla"
            title="Liguilla"
            hint={`${cupData.rows.length} clubes · ${ROUNDS.length} jornadas`}
            icon={BarChart3}
            href={cup.sources.table}
            linkLabel="Abrir la clasificación oficial de la Copa en CEGARRAF"
            className="surface-deep"
            bodyClassName="flex flex-col"
          >
            <GroupTable id="copa-liguilla" rows={cupData.rows} />
            <p className="mt-auto border-t border-acf-line-soft px-4 py-3.5 text-micro font-semibold uppercase tracking-[0.16em] text-acf-dim sm:px-6">
              {PLAYED_ROUNDS.length} de {ROUNDS.length} jornadas jugadas. La tabla la lleva
              la federación.
            </p>
          </Card>

          <Card
            id="copa-fase-final"
            title="Fase final"
            hint="Sorteo sin publicar"
            icon={Trophy}
            href={cup.sources.calendar}
            linkLabel="Abrir el calendario oficial de la Copa en CEGARRAF"
            className="surface-deep"
            bodyClassName="flex flex-col"
          >
            <KnockoutBoard rows={cupData.rows} />
          </Card>
        </div>

        <Card
          id="copa-jornadas"
          title="Jornadas"
          hint={`${ROUNDS.length} jornadas · ${cup.fixtures.length} partidos`}
          icon={CalendarDays}
          href={cup.sources.calendar}
          linkLabel="Abrir el calendario oficial de la Copa en CEGARRAF"
          className="mt-6"
          bodyClassName="flex flex-col"
        >
          {ROUNDS.map((round) => (
            <RoundBlock key={round} round={round} />
          ))}
        </Card>
      </div>
    </section>
  );
}
