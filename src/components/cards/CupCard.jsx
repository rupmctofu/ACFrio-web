import { Trophy } from "lucide-react";
import { cupTable, teamName } from "../../data/competition";
import Card from "./Card.jsx";
import { Crest } from "./Crest.jsx";

const HEAD_CELL =
  "py-2 text-[8px] font-semibold uppercase tracking-[0.14em] text-acf-dim";

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
                <th className={`${HEAD_CELL} pl-3 pr-1 text-center`}>#</th>
                <th className={`${HEAD_CELL} pr-1 text-left`}>Equipo</th>
                <th className={`${HEAD_CELL} px-0.5 text-center`}>PJ</th>
                <th className={`${HEAD_CELL} pl-1 pr-3 text-right`}>Pts</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.slug}
                  className="border-t border-acf-line-soft transition-colors hover:bg-white/[0.03]"
                >
                  <td className="py-2 pl-3 pr-1 text-center font-display text-base leading-none text-acf-dim">
                    {row.rank ?? "—"}
                  </td>
                  <td className="py-2 pr-1">
                    <span className="flex items-center gap-1.5">
                      <Crest slug={row.slug} size="sm" />
                      <span
                        title={row.name}
                        className="truncate text-[11px] font-bold uppercase tracking-[0.04em] text-acf-snow/80"
                      >
                        {row.name}
                      </span>
                    </span>
                  </td>
                  <td className="px-0.5 py-2 text-center text-[11px] tabular-nums text-acf-snow/50">
                    {row.played}
                  </td>
                  <td className="py-2 pl-1 pr-3 text-right font-display text-lg leading-none tabular-nums text-white">
                    {row.points}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <>
          <p className="px-5 pb-4 text-[11px] leading-relaxed text-acf-grey">
            <span className="font-bold text-acf-snow">
              {playedMatches} de {matchCount} partidos jugados.
            </span>{" "}
            La fuente oficial no publica puntos, goles ni posiciones hasta que se juegue
            la primera jornada.
          </p>
          <ul className="flex flex-wrap gap-1.5 px-5 pb-5">
            {rows.map((row) => (
              <li
                key={row.slug}
                className="flex max-w-full items-center gap-1.5 rounded-full border border-acf-line px-2.5 py-1"
              >
                <Crest slug={row.slug} size="sm" />
                <span
                  title={teamName(row.slug)}
                  className="min-w-0 truncate text-[9px] font-bold uppercase tracking-[0.06em] text-acf-snow/70"
                >
                  {teamName(row.slug)}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </Card>
  );
}
