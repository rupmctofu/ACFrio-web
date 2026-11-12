import { BarChart3 } from "lucide-react";
import { CLUB_SLUG, leagueTable } from "../data/competition";
import Card from "./cards/Card.jsx";
import { Crest } from "./cards/Crest.jsx";

const HEAD_CELL =
  "py-2 text-[8px] font-semibold uppercase tracking-[0.14em] text-acf-dim";

function Row({ row }) {
  const isAcf = row.slug === CLUB_SLUG;

  return (
    <tr
      className={`border-t border-acf-line-soft transition-colors ${
        isAcf ? "bg-acf-red/[0.09]" : "hover:bg-white/[0.03]"
      }`}
    >
      <td
        className={`py-2 pl-3 pr-1 text-center font-display text-lg leading-none tabular-nums ${
          isAcf ? "text-acf-red" : "text-acf-snow/40"
        }`}
      >
        {row.rank ?? "—"}
      </td>
      <td className="py-2 pr-1">
        <span className="flex items-center gap-1.5">
          <Crest slug={row.slug} size="sm" />
          <span
            title={row.name}
            className={`truncate text-[11px] font-bold uppercase tracking-[0.04em] ${
              isAcf ? "text-white" : "text-acf-snow/80"
            }`}
          >
            {row.name}
          </span>
        </span>
      </td>
      <td className="px-0.5 py-2 text-center text-[11px] tabular-nums text-acf-snow/50">
        {row.played}
      </td>
      <td className="px-0.5 py-2 text-center text-[11px] tabular-nums text-acf-snow/50">
        {row.won}
      </td>
      <td className="px-0.5 py-2 text-center text-[11px] tabular-nums text-acf-snow/50">
        {row.drawn}
      </td>
      <td className="px-0.5 py-2 text-center text-[11px] tabular-nums text-acf-snow/50">
        {row.lost}
      </td>
      <td className="whitespace-nowrap px-0.5 py-2 text-center text-[11px] tabular-nums text-acf-snow/50">
        {row.goalsFor}:{row.goalsAgainst}
      </td>
      <td className="px-0.5 py-2 text-center text-[11px] tabular-nums text-acf-snow/50">
        {row.goalDiff > 0 ? `+${row.goalDiff}` : row.goalDiff}
      </td>
      <td
        className={`py-2 pl-1 pr-3 text-right font-display text-lg leading-none tabular-nums ${
          isAcf ? "text-acf-red" : "text-white"
        }`}
      >
        {row.points}
      </td>
    </tr>
  );
}

/** The real 3ª Divisió Grup B table, as a card in the home grid. */
export default function Standings({ className = "" }) {
  const { competition, rows, hasResults } = leagueTable();

  return (
    <Card
      id="clasificacion"
      title="Clasificación"
      hint={competition?.name}
      icon={BarChart3}
      className={className}
      bodyClassName="flex flex-col"
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[20rem] border-collapse">
          <thead>
            <tr className="border-b border-acf-line">
              <th className={`${HEAD_CELL} pl-3 pr-1 text-center`}>#</th>
              <th className={`${HEAD_CELL} pr-1 text-left`}>Equipo</th>
              <th className={`${HEAD_CELL} px-0.5 text-center`}>PJ</th>
              <th className={`${HEAD_CELL} px-0.5 text-center`}>G</th>
              <th className={`${HEAD_CELL} px-0.5 text-center`}>E</th>
              <th className={`${HEAD_CELL} px-0.5 text-center`}>P</th>
              <th className={`${HEAD_CELL} px-0.5 text-center`}>GF:GC</th>
              <th className={`${HEAD_CELL} px-0.5 text-center`}>DG</th>
              <th className={`${HEAD_CELL} pl-1 pr-3 text-right`}>Pts</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <Row key={row.slug} row={row} />
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-auto border-t border-acf-line-soft px-5 py-3 text-[9px] font-semibold uppercase tracking-[0.16em] text-acf-dim">
        {hasResults
          ? "3 puntos por victoria · 1 por empate"
          : "La fuente oficial todavía no ha publicado resultados."}
      </p>
    </Card>
  );
}
