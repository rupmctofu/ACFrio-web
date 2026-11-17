import { Goal } from "lucide-react";
import {
  cards,
  isComplete,
  playerPhoto,
  scorers,
  season,
  unassignedGoals,
} from "../../data/club-record";
import Card from "./Card.jsx";
import { VOICE } from "../../data/copy.js";

/**
 * The player's portrait, with an initials circle as the fallback. The owner asked
 * for faces here, so no rank number is drawn in their place.
 */
function PlayerAvatar({ name, size = "md" }) {
  const photo = playerPhoto(name);
  const box = size === "sm" ? "h-7 w-7" : "h-9 w-9";

  if (photo) {
    return (
      <img
        src={photo}
        alt=""
        className={`${box} shrink-0 rounded-full border border-acf-line object-cover`}
        loading="lazy"
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className={`${box} flex shrink-0 items-center justify-center rounded-full border border-acf-line bg-acf-panel-light text-[11px] font-bold text-acf-grey`}
    >
      {name.slice(0, 1).toUpperCase()}
    </span>
  );
}

const goalsLabel = (count) => (count === 1 ? "gol" : "goles");

/**
 * How many card rows the card shows. Two entries read fine as chips, but a
 * growing pile turns into a wall of pills, so the list stays a compact column
 * and the rest is summarised in one muted line.
 */
const MAX_CARD_ROWS = 6;

/** A count with its card colour: a small square, the number, and a spoken label. */
function CardPill({ tone, count, label }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span
        aria-hidden="true"
        className={`inline-block h-3 w-2 shrink-0 rounded-[1px] ${tone}`}
      />
      <span className="text-micro font-semibold tabular-nums text-acf-grey">
        <span className="sr-only">{label} </span>
        {count}
      </span>
    </span>
  );
}

/**
 * Goalscorers and cards exactly as the club reports them. The official source
 * publishes neither, so goals without a recorded scorer stay as pending: they
 * are never attributed to, or split between, the players already listed.
 * This is the one accent-level surface of the page (`.surface-accent`).
 */
export default function ScorersCard({ className = "" }) {
  const rows = scorers();
  const cardRows = cards();
  const pending = unassignedGoals();
  const complete = isComplete();

  return (
    <Card
      title="Goleadores"
      hint={`Temporada ${season} · ${VOICE.sections.scorers}`}
      icon={Goal}
      className={`surface-accent ${className}`}
      bodyClassName="flex flex-col"
    >
      {rows.length ? (
        <ul className="divide-y divide-acf-line-soft">
          {rows.map((scorer, index) => (
            <li key={scorer.player} className="flex items-center gap-3 px-6 py-3">
              {/* The rank comes back as a quiet Oswald figure: the mockup reads
                  the list top-down, and the number is what makes the order
                  legible without a trophy icon per row. */}
              <span
                aria-hidden="true"
                className={`w-4 shrink-0 text-center font-display text-lg font-medium leading-none tabular-nums ${
                  index === 0 ? "text-acf-red-soft" : "text-acf-grey"
                }`}
              >
                {index + 1}
              </span>
              <PlayerAvatar name={scorer.player} />
              <span className="min-w-0 flex-1 truncate text-row font-bold uppercase tracking-[0.1em] text-white">
                {scorer.player}
              </span>
              <span
                className={`shrink-0 font-display text-3xl font-medium leading-none tabular-nums ${
                  index === 0 ? "text-acf-red" : "text-white"
                }`}
              >
                {scorer.goals}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="px-6 py-4 text-row leading-relaxed text-acf-grey">
          El club todavía no ha facilitado ningún goleador.
        </p>
      )}

      {pending > 0 ? (
        <p className="border-t border-acf-line-soft px-6 py-3 text-micro font-semibold uppercase tracking-[0.16em] text-acf-dim">
          +{pending} {goalsLabel(pending)} sin asignar
        </p>
      ) : null}

      <div className="border-t border-acf-line-soft px-6 py-4">
        <p className="text-micro font-semibold uppercase tracking-[0.22em] text-acf-dim">
          Tarjetas
        </p>
        {cardRows.length ? (
          <>
            <ul className="mt-2.5 flex flex-col gap-1.5">
              {cardRows.slice(0, MAX_CARD_ROWS).map((entry) => (
                <li key={entry.player} className="flex items-center gap-2.5">
                  <PlayerAvatar name={entry.player} size="sm" />
                  <span className="min-w-0 flex-1 truncate text-row font-bold uppercase tracking-[0.08em] text-acf-snow/80">
                    {entry.player}
                  </span>
                  <span
                    className="flex shrink-0 items-center gap-2"
                    title={
                      entry.yellowAt ? `Amarilla en la jornada ${entry.yellowAt}` : undefined
                    }
                  >
                    {entry.yellow > 0 ? (
                      <CardPill tone="bg-yellow-400" count={entry.yellow} label="Amarillas" />
                    ) : null}
                    {entry.red > 0 ? (
                      <CardPill tone="bg-acf-red" count={entry.red} label="Rojas" />
                    ) : null}
                  </span>
                </li>
              ))}
            </ul>
            {cardRows.length > MAX_CARD_ROWS ? (
              <p className="mt-2.5 text-micro font-semibold uppercase tracking-[0.16em] text-acf-dim">
                +{cardRows.length - MAX_CARD_ROWS}{" "}
                {cardRows.length - MAX_CARD_ROWS === 1
                  ? "jugador con tarjeta"
                  : "jugadores con tarjeta"}
              </p>
            ) : null}
          </>
        ) : (
          <p className="mt-2 text-row text-acf-grey">Sin tarjetas reportadas.</p>
        )}
      </div>

      {/* The season hint under the title already dates the record, so the card
          carries no second provenance line; the partial notice only exists while
          the club is still confirming goals and cards. */}
      {complete ? null : (
        <footer className="mt-auto border-t border-acf-line-soft px-6 py-3.5">
          <p className="text-row leading-relaxed text-acf-grey">
            Lista parcial: el club está confirmando el resto de goles y tarjetas.
          </p>
        </footer>
      )}
    </Card>
  );
}
