import { Trophy } from "lucide-react";
import { cupTable, teamName } from "../../data/competition";
import Card from "./Card.jsx";
import { Crest } from "./Crest.jsx";

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
              <tr className="bg-acf-dark/60 text-[9px] font-bold uppercase tracking-[0.08em] text-acf-grey">
                <th className="py-2 pl-2 pr-1 text-center font-bold">#</th>
                <th className="py-2 pr-1 text-left font-bold">Equipo</th>
                <th className="px-0.5 py-2 text-center font-bold">PJ</th>
                <th className="py-2 pl-1 pr-2 text-right font-bold">Pts</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.slug} className="border-t border-acf-line">
                  <td className="py-2 pl-2 pr-1 text-center font-display text-sm text-acf-grey">
                    {row.rank ?? "—"}
                  </td>
                  <td className="py-2 pr-1">
                    <span className="flex items-center gap-1.5">
                      <Crest slug={row.slug} size="sm" />
                      <span
                        title={row.name}
                        className="truncate text-[11px] font-bold uppercase text-white"
                      >
                        {row.name}
                      </span>
                    </span>
                  </td>
                  <td className="px-0.5 py-2 text-center text-[11px] text-acf-snow/60">
                    {row.played}
                  </td>
                  <td className="py-2 pl-1 pr-2 text-right font-display text-sm text-white">
                    {row.points}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <>
          <p className="border-b border-acf-line px-4 py-3 text-[11px] leading-relaxed text-acf-grey">
            <span className="font-bold text-acf-snow">
              {playedMatches} de {matchCount} partidos jugados.
            </span>{" "}
            La fuente oficial no publica puntos, goles ni posiciones hasta que se juegue
            la primera jornada.
          </p>
          <ul className="divide-y divide-acf-line">
            {rows.map((row) => (
              <li key={row.slug} className="flex items-center gap-2 px-4 py-2">
                <Crest slug={row.slug} size="sm" />
                <span
                  title={teamName(row.slug)}
                  className="truncate text-[11px] font-bold uppercase text-acf-snow/80"
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
