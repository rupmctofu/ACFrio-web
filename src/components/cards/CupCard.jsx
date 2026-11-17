import { Trophy } from "lucide-react";
import { CLUB_SLUG, cupTable, teamFullName, teamName } from "../../data/competition";
import Card from "./Card.jsx";
import { VOICE } from "../../data/copy.js";
import { Crest } from "./Crest.jsx";

const HEAD_CELL =
  "py-2.5 text-micro font-semibold uppercase tracking-[0.14em] text-acf-dim";

/**
 * The cup table. The source publishes the full cup calendar but no results yet,
 * so an all-zero table is shown as "no matchdays played" instead of a ranking.
 */
export default function CupCard({ className = "" }) {
  const { competition, rows, hasResults, playedMatches, matchCount } = cupTable();

  return (
    <Card
      id="copa"
      title="La Copa"
      hint={competition?.name}
      icon={Trophy}
      className={className}
      bodyClassName="flex flex-col"
    >
      {hasResults ? (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-acf-line">
                <th className={`${HEAD_CELL} pl-4 pr-1 text-center`}>#</th>
                <th className={`${HEAD_CELL} pr-1 text-left`}>Equipo</th>
                <th className={`${HEAD_CELL} px-0.5 text-center`}>PJ</th>
                <th className={`${HEAD_CELL} pl-1 pr-4 text-right`}>Pts</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.slug}
                  className="border-t border-acf-line-soft transition-colors hover:bg-white/[0.03]"
                >
                  <td className="py-3 pl-4 pr-1 text-center font-display text-lg leading-none text-acf-dim">
                    {row.rank ?? "—"}
                  </td>
                  <td className="py-3 pr-1">
                    <span className="flex items-center gap-2">
                      <Crest slug={row.slug} size="sm" />
                      <span
                        title={teamFullName(row.slug)}
                        className="truncate text-row font-bold uppercase tracking-[0.04em] text-acf-snow/80"
                      >
                        {teamName(row.slug)}
                      </span>
                    </span>
                  </td>
                  <td className="px-0.5 py-3 text-center text-figure tabular-nums text-acf-snow/50">
                    {row.played}
                  </td>
                  <td className="py-3 pl-1 pr-4 text-right font-display text-xl leading-none tabular-nums text-white">
                    {row.points}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <>
          {/* The competition module reads as one figure first: the share of the
              calendar already played, in the display face, then the explanation. */}
          <div className="flex items-baseline gap-2 px-6 pb-4">
            <span className="font-display text-3xl font-medium leading-none tabular-nums text-acf-red">
              {playedMatches}
              <span className="text-acf-grey">/{matchCount}</span>
            </span>
            <span className="text-micro font-semibold uppercase tracking-[0.16em] text-acf-dim">
              partidos jugados
            </span>
          </div>
          <p className="px-6 pb-3 text-row leading-relaxed text-acf-grey">
            La fuente oficial no publica puntos, goles ni posiciones hasta que se juegue
            la primera jornada.
          </p>
          <p className="px-6 pb-4 text-micro font-semibold uppercase tracking-[0.16em] text-acf-grey">
            Un sueño. {matchCount} partidos. Cero garantías.
          </p>
          <ul className="flex flex-wrap gap-2 px-6 pb-6">
            {rows.map((row) => {
              // Our team gets the accent tint so it stands out from the rivals at a glance.
              const isClub = row.slug === CLUB_SLUG;
              return (
              <li
                key={row.slug}
                className={`flex max-w-full items-center gap-2 rounded-full border py-1 pl-1 pr-3 transition-colors ${
                  isClub
                    ? "border-acf-red/40 bg-acf-red/12"
                    : "border-acf-line bg-white/[0.03] hover:border-white/20"
                }`}
              >
                <Crest slug={row.slug} size="sm" />
                <span
                  title={teamFullName(row.slug)}
                  className={`min-w-0 truncate text-[11px] font-bold uppercase tracking-[0.06em] ${
                    isClub ? "text-white" : "text-acf-snow/70"
                  }`}
                >
                  {teamName(row.slug)}
                </span>
              </li>
              );
            })}
          </ul>
        </>
      )}
    </Card>
  );
}
