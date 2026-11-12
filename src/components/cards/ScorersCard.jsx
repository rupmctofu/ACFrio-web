import { Goal } from "lucide-react";
import {
  cards,
  isComplete,
  playerPhoto,
  scorers,
  season,
  unassignedGoals,
  updatedAt,
} from "../../data/club-record";
import Card from "./Card.jsx";

/**
 * The player's portrait, with an initials circle as the fallback. The owner asked
 * for faces here, so no rank number is drawn in their place.
 */
function PlayerAvatar({ name, size = "md" }) {
  const photo = playerPhoto(name);
  const box = size === "sm" ? "h-5 w-5" : "h-7 w-7";

  if (photo) {
    return (
      <img
        src={photo}
        alt=""
        className={`${box} shrink-0 rounded-full object-cover`}
        loading="lazy"
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className={`${box} flex shrink-0 items-center justify-center rounded-full border border-acf-line bg-acf-panel-light text-[9px] font-bold text-acf-grey`}
    >
      {name.slice(0, 1).toUpperCase()}
    </span>
  );
}

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
        <ul className="divide-y divide-acf-line-soft">
          {rows.map((scorer, index) => (
            <li key={scorer.player} className="flex items-center gap-3 px-5 py-2.5">
              <PlayerAvatar name={scorer.player} />
              <span className="min-w-0 flex-1 truncate text-[11px] font-bold uppercase tracking-[0.1em] text-white">
                {scorer.player}
              </span>
              <span
                className={`shrink-0 font-display text-2xl leading-none tabular-nums ${
                  index === 0 ? "text-acf-red" : "text-white"
                }`}
              >
                {scorer.goals}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="px-5 py-4 text-[11px] leading-relaxed text-acf-grey">
          El club todavía no ha facilitado ningún goleador.
        </p>
      )}

      {pending > 0 ? (
        <p className="border-t border-acf-line-soft px-5 py-2.5 text-[9px] font-semibold uppercase tracking-[0.16em] text-acf-dim">
          +{pending} {goalsLabel(pending)} sin asignar
        </p>
      ) : null}

      <div className="border-t border-acf-line-soft px-5 py-3.5">
        <p className="text-[8px] font-semibold uppercase tracking-[0.22em] text-acf-dim">
          Tarjetas
        </p>
        {cardRows.length ? (
          <ul className="mt-2 flex flex-wrap items-center gap-1.5">
            {cardRows.map((entry) => (
              <li
                key={entry.player}
                className="flex items-center gap-1.5 rounded-full border border-acf-line py-1 pl-1 pr-2.5"
              >
                <PlayerAvatar name={entry.player} size="sm" />
                <span className="text-[9px] font-bold uppercase tracking-[0.08em] text-acf-snow/80">
                  {entry.player}
                </span>
                {entry.yellow > 0 ? (
                  <span className="flex items-center gap-1">
                    <span
                      className="inline-block h-2.5 w-1.5 shrink-0 rounded-[1px] bg-yellow-400"
                      aria-hidden="true"
                    />
                    <span className="text-[9px] font-semibold tabular-nums text-acf-grey">
                      {entry.yellow}
                    </span>
                  </span>
                ) : null}
                {entry.red > 0 ? (
                  <span className="flex items-center gap-1">
                    <span
                      className="inline-block h-2.5 w-1.5 shrink-0 rounded-[1px] bg-acf-red"
                      aria-hidden="true"
                    />
                    <span className="text-[9px] font-semibold tabular-nums text-acf-grey">
                      {entry.red}
                    </span>
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-[10px] text-acf-grey">Sin tarjetas reportadas.</p>
        )}
      </div>

      <footer className="mt-auto border-t border-acf-line-soft px-5 py-3">
        {complete ? null : (
          <p className="text-[10px] leading-relaxed text-acf-grey">
            Lista parcial: el club está confirmando el resto de goles y tarjetas.
          </p>
        )}
        <p
          className={`text-[8px] font-semibold uppercase tracking-[0.16em] text-acf-dim ${
            complete ? "" : "mt-1"
          }`}
        >
          Datos facilitados por el club · {updatedLabel(updatedAt)}
        </p>
      </footer>
    </Card>
  );
}
