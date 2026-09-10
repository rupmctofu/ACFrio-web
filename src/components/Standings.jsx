import { useMemo } from "react";
import { BarChart3 } from "lucide-react";

const rawStandings = [
  { pos: 1, team: "Los Charcos FC", played: 8, won: 6, drawn: 1, lost: 1, goalsFor: 28, goalsAgainst: 14 },
  { pos: 2, team: "AC FRÍO", played: 8, won: 6, drawn: 0, lost: 2, goalsFor: 26, goalsAgainst: 18 },
  { pos: 3, team: "Pibes de Barrio", played: 8, won: 5, drawn: 1, lost: 2, goalsFor: 24, goalsAgainst: 17 },
  { pos: 4, team: "Pachanga Boys", played: 8, won: 4, drawn: 1, lost: 3, goalsFor: 19, goalsAgainst: 18 },
  { pos: 5, team: "Tornados United", played: 8, won: 3, drawn: 0, lost: 5, goalsFor: 18, goalsAgainst: 25 },
  { pos: 6, team: "Centuriones CF", played: 8, won: 2, drawn: 2, lost: 4, goalsFor: 15, goalsAgainst: 22 },
  { pos: 7, team: "Real Esparta", played: 8, won: 2, drawn: 1, lost: 5, goalsFor: 14, goalsAgainst: 19 },
  { pos: 8, team: "Los Elegantes", played: 8, won: 0, drawn: 2, lost: 6, goalsFor: 12, goalsAgainst: 27 },
];

function Row({ team, index }) {
  const isAcf = team.team === "AC FRÍO";
  const diff = team.goalsFor - team.goalsAgainst;

  return (
    <tr
      className={`border-t border-acf-line transition-colors ${
        isAcf
          ? "bg-acf-red/15 hover:bg-acf-red/20"
          : "hover:bg-acf-panel-light"
      }`}
    >
      <td className="py-3 px-3 sm:px-4 font-display text-xl text-acf-grey">
        {team.pos}
      </td>
      <td className="py-3 px-3 sm:px-4">
        <span className={`font-bold text-sm sm:text-base ${isAcf ? "text-acf-red" : "text-white"}`}>
          {team.team}
        </span>
        {isAcf && (
          <span className="ml-2 text-[9px] font-bold uppercase tracking-wider bg-acf-red text-white px-1.5 py-0.5 rounded-sm">
            Nosotros
          </span>
        )}
      </td>
      <td className="py-3 px-2 text-center text-sm text-acf-snow/60">{team.played}</td>
      <td className="py-3 px-2 text-center text-sm text-acf-snow/60 hidden sm:table-cell">{team.won}</td>
      <td className="py-3 px-2 text-center text-sm text-acf-snow/60 hidden sm:table-cell">{team.drawn}</td>
      <td className="py-3 px-2 text-center text-sm text-acf-snow/60 hidden sm:table-cell">{team.lost}</td>
      <td className="py-3 px-2 text-center text-sm text-acf-snow/60">
        {team.goalsFor}:{team.goalsAgainst}
      </td>
      <td className={`py-3 px-3 sm:px-4 text-right text-sm font-bold ${
        diff > 0 ? "text-green-400" : diff < 0 ? "text-red-400" : "text-acf-grey"
      }`}>
        {diff > 0 ? `+${diff}` : diff}
      </td>
    </tr>
  );
}

export default function Standings() {
  const standings = useMemo(() => {
    return [...rawStandings]
      .sort((a, b) => {
        const ap = a.won * 3 + a.drawn;
        const bp = b.won * 3 + b.drawn;
        if (bp !== ap) return bp - ap;
        const ad = a.goalsFor - a.goalsAgainst;
        const bd = b.goalsFor - b.goalsAgainst;
        return bd - ad;
      })
      .map((team, idx) => ({ ...team, pos: idx + 1 }));
  }, []);

  return (
    <section id="clasificacion" className="relative py-24 texture-grain bg-acf-panel/30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          <p className="text-acf-red font-display text-3xl tracking-widest">CLASIFICACIÓN</p>
          <h2 className="font-display text-4xl sm:text-5xl tracking-wide uppercase">
            La Liga de la Pachanga
          </h2>
        </div>

        <div className="bg-acf-panel border border-acf-line shadow-acf clip-edge-tl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px]">
              <thead>
                <tr className="text-left text-[10px] font-bold uppercase tracking-[0.25em] text-acf-grey bg-acf-dark/60">
                  <th className="py-3.5 px-3 sm:px-4">#</th>
                  <th className="py-3.5 px-3 sm:px-4">Equipo</th>
                  <th className="py-3.5 px-2 text-center">PJ</th>
                  <th className="py-3.5 px-2 text-center hidden sm:table-cell">G</th>
                  <th className="py-3.5 px-2 text-center hidden sm:table-cell">E</th>
                  <th className="py-3.5 px-2 text-center hidden sm:table-cell">P</th>
                  <th className="py-3.5 px-2 text-center">GF:GC</th>
                  <th className="py-3.5 px-3 sm:px-4 text-right">DF</th>
                </tr>
              </thead>
              <tbody className="text-white">
                {standings.map((team) => (
                  <Row key={team.pos} team={team} />
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-3 text-xs text-acf-grey">
          <span className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-acf-red" />
            Puntuación: 3 puntos por victoria · 1 por empate
          </span>
          <span>
            Próximo objetivo: <span className="text-acf-red font-bold">desbancar a Los Charcos FC</span>
          </span>
        </div>
      </div>
    </section>
  );
}