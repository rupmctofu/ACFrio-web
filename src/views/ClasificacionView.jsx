import { BarChart3, Trophy } from "lucide-react";
import {
  CLUB_SLUG,
  cup,
  cupTable,
  league,
  leagueTable,
  teamFullName,
  teamName,
} from "../data/competition.js";
import Card from "../components/cards/Card.jsx";
import { Crest } from "../components/cards/Crest.jsx";

/**
 * `/clasificacion` — the two tables, side by side in the same order as the
 * season (S2): the league first, because it is the one with results, and the cup
 * underneath, which says honestly what the source has not published yet.
 *
 * The rows are drawn here, from `leagueTable()` and `cupTable()`, with the same
 * anatomy the dashboard's standings use — the club's row tinted, its rank
 * carrying a red bar against the left edge and its points in red — so the table
 * reads as the same table wherever it is found. No row is a link: this page is
 * for reading, and the way into a club's own page is `/equipos`, which says so.
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

const CUP_COLUMNS = [{ label: "PJ", value: (row) => row.played }];

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

export default function ClasificacionView() {
  const leagueData = leagueTable();
  const cupData = cupTable();

  return (
    <section className="relative pb-16 pt-28">
      <div className="wrap">
        <header className="max-w-2xl">
          <p className="text-micro font-semibold uppercase tracking-[0.3em] text-acf-red-soft">
            La temporada
          </p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Clasificación
          </h1>
          <p className="mt-3 text-row leading-relaxed text-acf-snow/70">
            Dos competiciones, dos tablas. La liga ya habla; la copa todavía está
            aprendiendo a sumar.
          </p>
        </header>

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card
            id="clasificacion-liga"
            title="Liga"
            hint={leagueData.competition?.name}
            icon={BarChart3}
            href={league.sources.table}
            linkLabel="Abrir la clasificación oficial de la liga en CEGARRAF"
            className="surface-deep"
            bodyClassName="flex flex-col"
          >
            <Table id="clasificacion-liga" rows={leagueData.rows} columns={LEAGUE_COLUMNS} />
            {leagueData.hasResults ? null : (
              <p className="mt-auto border-t border-acf-line-soft px-6 py-3.5 text-micro font-semibold uppercase tracking-[0.16em] text-acf-dim">
                La fuente oficial todavía no ha publicado resultados.
              </p>
            )}
          </Card>

          <Card
            id="clasificacion-copa"
            title="Copa"
            hint={cupData.competition?.name}
            icon={Trophy}
            href={cup.sources.table}
            linkLabel="Abrir la clasificación oficial de la Copa en CEGARRAF"
            className="surface-deep"
            bodyClassName="flex flex-col"
          >
            {cupData.hasResults ? (
              <Table id="clasificacion-copa" rows={cupData.rows} columns={CUP_COLUMNS} />
            ) : (
              <>
                {/* Nothing is invented for a competition the source has not
                    scored yet: the count of what it has published is the whole
                    table until the first cup matchday is settled. */}
                <div className="flex items-baseline gap-2 px-6 pb-4">
                  <span className="font-display text-3xl font-medium leading-none tabular-nums text-acf-red">
                    {cupData.playedMatches}
                    <span className="text-acf-grey">/{cupData.matchCount}</span>
                  </span>
                  <span className="text-micro font-semibold uppercase tracking-[0.16em] text-acf-dim">
                    partidos jugados
                  </span>
                </div>
                <p className="px-6 pb-5 text-row leading-relaxed text-acf-grey">
                  La fuente oficial no publica puntos, goles ni posiciones hasta que se
                  juegue la primera jornada.
                </p>
              </>
            )}
            <p className="mt-auto border-t border-acf-line-soft px-6 py-3.5 text-micro font-semibold uppercase tracking-[0.16em] text-acf-dim">
              Una tabla se escribe sola. Esta, de momento, a lápiz.
            </p>
          </Card>
        </div>
      </div>
    </section>
  );
}
