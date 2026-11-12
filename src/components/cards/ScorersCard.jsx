import { Goal } from "lucide-react";
import {
  cards,
  isComplete,
  scorers,
  season,
  unassignedGoals,
  updatedAt,
} from "../../data/club-record";
import Card from "./Card.jsx";

/** dd/mm/yyyy out of the record's ISO date, without adding a date dependency. */
function updatedLabel(iso) {
  const [year, month, day] = iso.split("-");
  return `${day}/${month}/${year}`;
}

const goalsLabel = (count) => (count === 1 ? "gol" : "goles");

/**
 * Goalscorers and cards exactly as the club reports them. The official source
 * publishes neither, so goals without a recorded scorer stay as pending: they
 * are never attributed to, or split between, the players already listed.
 */
export default function ScorersCard({ className = "" }) {
  const rows = scorers();
  const cardRows = cards();
  const pending = unassignedGoals();
  const complete = isComplete();

  return (
    <Card
      title="Goleadores"
      hint={`Temporada ${season}`}
      icon={Goal}
      className={className}
      bodyClassName="flex flex-col"
    >
      {rows.length ? (
        <ul className="divide-y divide-acf-line">
          {rows.map((scorer, index) => (
            <li key={scorer.player} className="flex items-center gap-3 px-4 py-2.5">
              <span className="w-4 shrink-0 font-display text-sm leading-none tabular-nums text-acf-red">
                {index + 1}
              </span>
              <span className="min-w-0 flex-1 truncate text-[11px] font-bold uppercase tracking-[0.08em] text-white">
                {scorer.player}
              </span>
              <span className="shrink-0 font-display text-lg leading-none tabular-nums text-white">
                {scorer.goals}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="p-4 text-[11px] leading-relaxed text-acf-grey">
          El club todavía no ha facilitado ningún goleador.
        </p>
      )}

      {pending > 0 ? (
        <p className="border-t border-acf-line px-4 py-2.5 text-[10px] uppercase tracking-[0.15em] text-acf-grey">
          +{pending} {goalsLabel(pending)} sin asignar
        </p>
      ) : null}

      <div className="border-t border-acf-line px-4 py-2.5">
        <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-acf-grey">Tarjetas</p>
        {cardRows.length ? (
          <ul className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1.5">
            {cardRows.map((entry) => (
              <li key={entry.player} className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase text-acf-snow/80">
                  {entry.player}
                </span>
                {entry.yellow > 0 ? (
                  <span className="flex items-center gap-1">
                    <span
                      className="inline-block h-3 w-2 shrink-0 bg-yellow-400"
                      aria-hidden="true"
                    />
                    <span className="text-[10px] tabular-nums text-acf-grey">{entry.yellow}</span>
                  </span>
                ) : null}
                {entry.red > 0 ? (
                  <span className="flex items-center gap-1">
                    <span className="inline-block h-3 w-2 shrink-0 bg-acf-red" aria-hidden="true" />
                    <span className="text-[10px] tabular-nums text-acf-grey">{entry.red}</span>
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-1.5 text-[10px] text-acf-grey">Sin tarjetas reportadas.</p>
        )}
      </div>

      <footer className="mt-auto border-t border-acf-line px-4 py-3">
        {complete ? null : (
          <p className="text-[10px] leading-relaxed text-acf-grey">
            Lista parcial: el club está confirmando el resto de goles y tarjetas.
          </p>
        )}
        <p
          className={`text-[9px] uppercase tracking-[0.15em] text-acf-grey ${
            complete ? "" : "mt-1"
          }`}
        >
          Datos facilitados por el club · {updatedLabel(updatedAt)}
        </p>
      </footer>
    </Card>
  );
}
