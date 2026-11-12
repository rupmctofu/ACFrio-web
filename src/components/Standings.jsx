import { useState } from "react";
import { BarChart3 } from "lucide-react";
import {
  CLUB_SLUG,
  league,
  teamName,
  teamCrest,
  clubRow,
  nextTargetRow,
} from "../data/competition";

function initialsOf(name) {
  const stop = ["FC", "CF", "CD", "UD", "SC", "C.F."];
  const initials = name
    .replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñ0-9 ]/g, " ")
    .split(" ")
    .filter(Boolean)
    .filter((w) => !stop.includes(w.toUpperCase()))
    .map((w) => w[0].toUpperCase())
    .join("")
    .slice(0, 3);
  return initials || name.slice(0, 2).toUpperCase();
}

/** Small crest with an initials fallback for clubs the source publishes none for. */
function Crest({ slug }) {
  const src = teamCrest(slug);
  const [failed, setFailed] = useState(false);
  const name = teamName(slug);

  if (!src || failed) {
    return (
      <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded bg-acf-dark border border-acf-line text-[9px] font-bold text-acf-grey">
        {initialsOf(name)}
      </span>
    );
  }
  return (
    <img
      src={src}
      alt=""
      className="h-6 w-6 shrink-0 object-contain"
      onError={() => setFailed(true)}
    />
  );
}

function Row({ row }) {
  const isAcf = row.slug === CLUB_SLUG;

  return (
    <tr
      className={`border-t border-acf-line transition-colors ${
        isAcf ? "bg-acf-red/15 hover:bg-acf-red/20" : "hover:bg-acf-panel-light"
      }`}
    >
      <td className="py-3 px-3 sm:px-4 font-display text-xl text-acf-grey">{row.rank}</td>
      <td className="py-3 px-3 sm:px-4">
        <span className="flex items-center gap-2.5">
          <Crest slug={row.slug} />
          <span className={`font-bold text-sm sm:text-base ${isAcf ? "text-acf-red" : "text-white"}`}>
            {row.name}
          </span>
          {isAcf && (
            <span className="text-[9px] font-bold uppercase tracking-wider bg-acf-red text-white px-1.5 py-0.5 rounded-sm">
              Nosotros
            </span>
          )}
        </span>
      </td>
      <td className="py-3 px-2 text-center text-sm text-acf-snow/60">{row.played}</td>
      <td className="py-3 px-2 text-center text-sm text-acf-snow/60 hidden sm:table-cell">{row.won}</td>
      <td className="py-3 px-2 text-center text-sm text-acf-snow/60 hidden sm:table-cell">{row.drawn}</td>
      <td className="py-3 px-2 text-center text-sm text-acf-snow/60 hidden sm:table-cell">{row.lost}</td>
      <td className="py-3 px-2 text-center text-sm text-acf-snow/60">
        {row.goalsFor}:{row.goalsAgainst}
      </td>
      <td
        className={`py-3 px-2 text-center text-sm font-bold ${
          row.goalDiff > 0 ? "text-green-400" : row.goalDiff < 0 ? "text-red-400" : "text-acf-grey"
        }`}
      >
        {row.goalDiff > 0 ? `+${row.goalDiff}` : row.goalDiff}
      </td>
      <td className="py-3 px-3 sm:px-4 text-right font-display text-lg text-white">{row.points}</td>
    </tr>
  );
}

export default function Standings() {
  const own = clubRow(league);
  const target = nextTargetRow(league);

  return (
    <section id="clasificacion" className="relative py-24 texture-grain bg-acf-panel/30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          <p className="text-acf-red font-display text-3xl tracking-widest">CLASIFICACIÓN</p>
          <h2 className="font-display text-4xl sm:text-5xl tracking-wide uppercase">{league.name}</h2>
        </div>

        <div className="bg-acf-panel border border-acf-line shadow-acf clip-edge-tl">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[460px]">
              <thead>
                <tr className="text-left text-[10px] font-bold uppercase tracking-[0.25em] text-acf-grey bg-acf-dark/60">
                  <th className="py-3.5 px-3 sm:px-4">#</th>
                  <th className="py-3.5 px-3 sm:px-4">Equipo</th>
                  <th className="py-3.5 px-2 text-center">PJ</th>
                  <th className="py-3.5 px-2 text-center hidden sm:table-cell">G</th>
                  <th className="py-3.5 px-2 text-center hidden sm:table-cell">E</th>
                  <th className="py-3.5 px-2 text-center hidden sm:table-cell">P</th>
                  <th className="py-3.5 px-2 text-center">GF:GC</th>
                  <th className="py-3.5 px-2 text-center">DF</th>
                  <th className="py-3.5 px-3 sm:px-4 text-right">Pts</th>
                </tr>
              </thead>
              <tbody className="text-white">
                {league.table.map((row) => (
                  <Row key={row.slug} row={row} />
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
          {own && target && (
            <span>
              Próximo objetivo:{" "}
              <span className="text-acf-red font-bold">
                alcanzar a {target.name} ({target.points} pts)
              </span>
            </span>
          )}
        </div>
      </div>
    </section>
  );
}
