import { useEffect } from "react";
import { BarChart3, CalendarDays } from "lucide-react";
import {
  CLUB_SLUG,
  clubSide,
  fixtureDateLabel,
  fixtureTimeLabel,
  league,
  leagueTable,
  matchdayFixtures,
  teamFullName,
  teamName,
} from "../data/competition.js";
import Card from "../components/cards/Card.jsx";
import { Crest } from "../components/cards/Crest.jsx";
import ClubList, { leagueClubs } from "./ClubList.jsx";
import { navigate, routeLink } from "../lib/router.js";

/**
 * The Liga tab of `/competicion` (S14, S15): the league table, the round being
 * read, and the round before it.
 *
 * This file used to be `/jornada/<n>`, one page holding one round: the owner
 * opened it, found a column with three matches in it, and asked where the
 * previous matchday was ("no es como que se vean plan esta jornada anterior").
 * He was right, and the fix is not more copy: the round is drawn next to the
 * table it decides, and the round before it is drawn underneath, so the night
 * can be read against the one it followed. Nothing on this page is invented —
 * the table and both rounds come from `competition.js`, and a round exists
 * because the calendar has fixtures in it.
 *
 * The round is in the URL (`/competicion/liga/3`), because that is the address
 * people paste into the group: it is the old `/jornada/3` under the new name.
 * The query (`?jornada=3`) is still read as a fallback, the way it was before
 * the fold — a bookmark that carried it keeps working.
 *
 * The clubs of this same table are the last card, under the two columns (S22):
 * the tab that shows the league is also where its teams are, "cada uno con sus
 * respectivos equipos", so the old Equipos tab left nothing behind.
 */

/* The rounds the source publishes, in order. Nothing is invented: a round exists
   because it has at least one fixture in the synced calendar. */
const ROUNDS = [...new Set(league.fixtures.map((fixture) => fixture.matchday))].sort(
  (a, b) => a - b,
);

/* A round that is already being played is the one a reader came to see. */
const PLAYED_ROUNDS = ROUNDS.filter((round) =>
  matchdayFixtures("league", round).some((fixture) => fixture.status === "played"),
);

/** The round to open when the URL does not name one: the last played, else the first. */
const defaultRound = () => PLAYED_ROUNDS.at(-1) ?? ROUNDS[0] ?? null;

/** A round number from whatever the URL carried, or null when it is not one. */
const asRound = (value) => {
  const number = Number(String(value ?? "").trim());
  return Number.isInteger(number) && number > 0 ? number : null;
};

/**
 * The round drawn under the one being read (S15).
 *
 * The previous published round is it — that is the "jornada anterior" he was
 * missing. On the first round of the season there is no previous, and the
 * section still owes the reader more than one round of the calendar: the next
 * one takes the place, so the card under the selected round always shows a
 * night of football rather than a hole.
 */
const neighbourOf = (round) => {
  const index = ROUNDS.indexOf(round);
  if (index === -1) return null;
  const before = ROUNDS[index - 1];
  if (before !== undefined) return { round: before, kind: "previous" };
  const after = ROUNDS[index + 1];
  return after === undefined ? null : { round: after, kind: "next" };
};

const PILL =
  "block min-w-8 rounded-full px-2.5 py-1 text-center text-row font-bold tabular-nums transition-colors";
const PILL_ACTIVE = "bg-acf-red text-white";
const PILL_IDLE =
  "border border-acf-line text-acf-snow/60 hover:border-white/25 hover:bg-white/[0.06] hover:text-white";

/* ---- The league table -------------------------------------------------------
 *
 * The same table `/clasificacion` drew, moved here when that page became a tab:
 * the club's row tinted, its rank carrying a red bar against the left edge and
 * its points in red, so the table reads the same wherever it is found. No row is
 * a link — this is for reading — but the crest opens the club's page, which is
 * the only thing in the row that says "there is more here".
 */

/* The header row, one size below the figures it names. */
const HEAD_CELL = "py-2.5 text-micro font-semibold uppercase tracking-[0.12em] text-acf-dim";
/* One figure of a row: the size the site already uses for table rows. */
const FIGURE_CELL = "px-1 py-3 text-center text-figure tabular-nums text-acf-snow/60";

/* The columns a table draws between the club's name and its points. */
const LEAGUE_COLUMNS = [
  { label: "PJ", value: (row) => row.played },
  { label: "G", value: (row) => row.won },
  { label: "E", value: (row) => row.drawn },
  { label: "P", value: (row) => row.lost },
  { label: "GF:GC", value: (row) => `${row.goalsFor}:${row.goalsAgainst}` },
];

/**
 * A table of clubs: rank, crest, name, the given figures and the points.
 *
 * The scroll wrapper is a named region with a tab stop, the same way the
 * dashboard's standings are, because a table that scrolls sideways is otherwise
 * out of reach of a keyboard. `aria-labelledby` points at the card's own
 * heading, so the region announces "Liga, region" instead of an unnamed box.
 */
function Table({ id, rows, columns }) {
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
            {columns.map((column) => (
              <th key={column.label} className={`${HEAD_CELL} px-1 text-center`}>
                {column.label}
              </th>
            ))}
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
                {/* `w-full max-w-0` keeps the name column from claiming its
                    max-content width, so the table fits the card instead of
                    scrolling sideways on its own. */}
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
                {columns.map((column) => (
                  <td key={column.label} className={FIGURE_CELL}>
                    {column.value(row)}
                  </td>
                ))}
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

/* ---- The rounds ------------------------------------------------------------- */

/**
 * One club of the round, as a link to its page (S7).
 *
 * The home club is drawn right-aligned with its crest on the inside, so the two
 * badges flank whatever sits between them — the result, or the pitch — and the
 * two names sit at the outer ends of the line. That is the way a fixture line is
 * read everywhere else on the site.
 */
function TeamLink({ slug, side }) {
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
 * One match: the two clubs and, in the middle, the result when the night is
 * over or the pitch when it is not. The field is what tells a player which of
 * the three annexes they are on; on these nights the time tells nobody anything,
 * because all three kick off at 22:30.
 */
function MatchRow({ fixture }) {
  const result = fixture.status === "played" && fixture.score ? fixture.score : null;
  const ours = clubSide(fixture) !== null;
  const field = (fixture.field ?? "Campo por confirmar").replace("Camp ", "");

  return (
    <li
      className={`grid grid-cols-[1fr_auto_1fr] items-center gap-x-3 px-4 py-4 sm:px-6 ${
        ours ? "bg-acf-red/[0.08]" : ""
      }`}
    >
      <TeamLink slug={fixture.home.slug} side="home" />

      {result ? (
        <span className="whitespace-nowrap font-display text-xl font-medium leading-none tabular-nums text-white">
          <span className="sr-only">Resultado: </span>
          {result.home}
          <span className="mx-1 text-acf-dim">–</span>
          {result.away}
        </span>
      ) : (
        <span className="whitespace-nowrap text-[0.5625rem] font-semibold uppercase tracking-[0.1em] text-acf-dim">
          <span className="sr-only">Campo: </span>
          {field}
        </span>
      )}

      <TeamLink slug={fixture.away.slug} side="away" />
    </li>
  );
}

/** The fixtures of one round, drawn with the same row wherever the round sits. */
function FixtureList({ round }) {
  const matches = matchdayFixtures("league", round);

  return (
    <ul className="divide-y divide-acf-line-soft border-t border-acf-line-soft">
      {matches.map((fixture) => (
        <MatchRow key={`${fixture.home.slug}-${fixture.away.slug}`} fixture={fixture} />
      ))}
    </ul>
  );
}

/** The date and time of a round, taken from its first fixture, or an honest gap. */
const whenLabel = (round) => {
  const first = matchdayFixtures("league", round)[0];
  return first ? `${fixtureDateLabel(first)} · ${fixtureTimeLabel(first)}` : "Sin fecha publicada";
};

export default function LigaTab({ matchday: fromPath }) {
  const fromQuery = new URLSearchParams(window.location.search).get("jornada");
  const wanted = asRound(fromPath) ?? asRound(fromQuery);
  const round = ROUNDS.includes(wanted) ? wanted : defaultRound();
  const matches = round === null ? [] : matchdayFixtures("league", round);
  const neighbour = neighbourOf(round);
  const leagueData = leagueTable();

  /*
   * A pasted round that this season does not have lands on the round that does,
   * and the address is corrected with it: a link that shows a different round
   * from the one it names is worse than a corrected link.
   */
  useEffect(() => {
    if (fromPath != null && round !== null && asRound(fromPath) !== round) {
      navigate(`/competicion/liga/${round}`, { replace: true });
    }
  }, [fromPath, round]);

  return (
    /* Two columns from 1024: the table on the left, where a position is read, and
       the jornadas on the right, where a night is read. Under 1024 they stack in
       the order of the sentence above — table, then this round, then the one
       before it. The clubs are the full-width row after both of them, which is
       what `lg:col-span-2` says. */
    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
      <Card
        id="competicion-liga"
        title="Liga"
        hint={leagueData.competition?.name}
        icon={BarChart3}
        href={league.sources.table}
        linkLabel="Abrir la clasificación oficial de la liga en CEGARRAF"
        className="surface-deep"
        bodyClassName="flex flex-col"
      >
        <Table id="competicion-liga" rows={leagueData.rows} columns={LEAGUE_COLUMNS} />
        <p className="mt-auto border-t border-acf-line-soft px-4 py-3.5 text-micro font-semibold uppercase tracking-[0.16em] text-acf-dim sm:px-6">
          {leagueData.hasResults
            ? `${ROUNDS.length} jornadas · ${league.fixtures.length} partidos`
            : "La fuente oficial todavía no ha publicado resultados."}
        </p>
      </Card>

      <div className="flex flex-col gap-6">
        {round === null ? (
          <Card
            title="Sin jornadas"
            hint="La fuente oficial no publica partidos todavía"
            icon={CalendarDays}
          >
            <p className="px-6 pb-5 text-row text-acf-grey">
              Cuando el calendario oficial tenga partidos, aparecerán aquí.
            </p>
          </Card>
        ) : (
          <Card
            id="competicion-jornada"
            title={`Jornada ${round}`}
            hint={`${whenLabel(round)} · ${matches.length} partidos`}
            icon={CalendarDays}
            href={league.sources.calendar}
            linkLabel="Abrir el calendario oficial de la liga en CEGARRAF"
            bodyClassName="flex flex-col"
          >
            <FixtureList round={round} />

            {/* The way to another round, in the panel that shows this one: the
                reader moves between rounds without leaving the table. */}
            <div className="mt-auto border-t border-acf-line-soft px-4 py-4 sm:px-6">
              <p className="text-micro font-semibold uppercase tracking-[0.2em] text-acf-dim">
                Otra jornada
              </p>
              <nav aria-label="Elegir jornada" className="mt-2.5 flex flex-wrap gap-1.5">
                {ROUNDS.map((option) => {
                  const active = option === round;
                  return (
                    <a
                      key={option}
                      {...routeLink(`/competicion/liga/${option}`)}
                      aria-current={active ? "page" : undefined}
                      aria-label={`Jornada ${option}`}
                      className={`${PILL} ${active ? PILL_ACTIVE : PILL_IDLE}`}
                    >
                      {option}
                    </a>
                  );
                })}
              </nav>
            </div>
          </Card>
        )}

        {/* The jornada anterior, which is the whole of S15: the round that came
            before the one above, with its results, so the night has a before. */}
        {neighbour ? (
          <Card
            id="competicion-jornada-vecina"
            title={neighbour.kind === "previous" ? "La jornada anterior" : "La jornada siguiente"}
            hint={`Jornada ${neighbour.round} · ${whenLabel(neighbour.round)}`}
            icon={CalendarDays}
            bodyClassName="flex flex-col"
          >
            <FixtureList round={neighbour.round} />
          </Card>
        ) : null}
      </div>

      {/* The seven clubs of the table above, each one a way into its page and
          the list the old Equipos tab used to be (S22). */}
      <ClubList
        id="competicion-clubes-liga"
        title="Los clubes de la liga"
        hint={`${league.name} · ${leagueData.rows.length} clubes`}
        href={league.sources.table}
        linkLabel="Abrir la clasificación oficial de la liga en CEGARRAF"
        clubs={leagueClubs()}
        className="surface-deep lg:col-span-2"
      />
    </div>
  );
}
