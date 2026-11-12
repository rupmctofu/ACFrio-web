import { BarChart3 } from "lucide-react";
import { CLUB_SLUG, leagueTable } from "../data/competition";
import Card from "./cards/Card.jsx";
import { Crest } from "./cards/Crest.jsx";

function Row({ row }) {
  const isAcf = row.slug === CLUB_SLUG;

  return (
    <tr
      className={`border-t border-acf-line transition-colors ${
        isAcf ? "bg-acf-red/15" : "hover:bg-acf-panel-light"
      }`}
    >
      <td
        className={`py-2 pl-2 pr-1 text-center font-display text-sm ${
          isAcf ? "border-l-2 border-l-acf-red text-acf-red" : "text-acf-grey"
        }`}
      >
        {row.rank ?? "—"}
      </td>
      <td className="py-2 pr-1">
        <span className="flex items-center gap-1.5">
          <Crest slug={row.slug} size="sm" />
          <span
            title={row.name}
            className={`truncate text-[11px] font-bold uppercase ${
              isAcf ? "text-acf-red" : "text-white"
            }`}
          >
            {row.name}
          </span>
        </span>
      </td>
      <td className="px-0.5 py-2 text-center text-[11px] text-acf-snow/60">{row.played}</td>
      <td className="px-0.5 py-2 text-center text-[11px] text-acf-snow/60">{row.won}</td>
      <td className="px-0.5 py-2 text-center text-[11px] text-acf-snow/60">{row.drawn}</td>
      <td className="px-0.5 py-2 text-center text-[11px] text-acf-snow/60">{row.lost}</td>
      <td className="px-0.5 py-2 text-center text-[11px] whitespace-nowrap text-acf-snow/60">
        {row.goalsFor}:{row.goalsAgainst}
      </td>
      <td
        className={`px-0.5 py-2 text-center text-[11px] font-bold ${
          row.goalDiff > 0 ? "text-green-400" : row.goalDiff < 0 ? "text-red-400" : "text-acf-grey"
        }`}
      >
        {row.goalDiff > 0 ? `+${row.goalDiff}` : row.goalDiff}
      </td>
      <td className="py-2 pl-1 pr-2 text-right font-display text-sm text-white">{row.points}</td>
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
            <tr className="bg-acf-dark/60 text-[9px] font-bold uppercase tracking-[0.08em] text-acf-grey">
              <th className="py-2 pl-2 pr-1 text-center font-bold">#</th>
              <th className="py-2 pr-1 text-left font-bold">Equipo</th>
              <th className="px-0.5 py-2 text-center font-bold">PJ</th>
              <th className="px-0.5 py-2 text-center font-bold">G</th>
              <th className="px-0.5 py-2 text-center font-bold">E</th>
              <th className="px-0.5 py-2 text-center font-bold">P</th>
              <th className="px-0.5 py-2 text-center font-bold">GF:GC</th>
              <th className="px-0.5 py-2 text-center font-bold">DG</th>
              <th className="py-2 pl-1 pr-2 text-right font-bold">Pts</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <Row key={row.slug} row={row} />
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-auto border-t border-acf-line px-5 py-3 text-[10px] uppercase tracking-[0.18em] text-acf-grey">
        {hasResults
          ? "3 puntos por victoria · 1 por empate"
          : "La fuente oficial todavía no ha publicado resultados."}
      </p>
    </Card>
  );
}
