import { ClipboardCheck } from "lucide-react";
import {
  hasAnyAttendance,
  perPlayerAttendance,
  playerPhoto,
  totalAppearances,
} from "../../data/club-record";
import Card from "./Card.jsx";

/**
 * The player's own portrait at the size a ranked row can afford. The club
 * record already resolves the photo, so a missing one is the only case that
 * needs a fallback: the initial, never an invented face.
 */
function Face({ name, photo }) {
  const box = "h-8 w-8";

  if (photo) {
    return (
      <img
        src={photo}
        alt=""
        loading="lazy"
        className={`${box} shrink-0 rounded-full object-cover object-top`}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className={`${box} flex shrink-0 items-center justify-center rounded-full border border-acf-line bg-acf-panel-light text-[0.6875rem] font-bold text-acf-grey`}
    >
      {name.slice(0, 1).toUpperCase()}
    </span>
  );
}

/**
 * Who turned up, as a ranked list of players instead of a per-match roster.
 * The order and the percentage come from the club record: every row carries its
 * own denominator (the matches that player could have played), so the bar is
 * arithmetic (count / of), never a guess, and a player who joined mid-season is
 * measured from his first match instead of against matches he never saw. The
 * club keeps the list by hand, so an empty list means "not reported yet" and
 * the card says so.
 */
export default function AttendanceCard({ className = "" }) {
  const hasData = hasAnyAttendance();
  const players = totalAppearances();
  const rows = perPlayerAttendance();

  return (
    <Card
      id="asistencias"
      title="Asistencias"
      hint={
        hasData
          ? `${players} ${players === 1 ? "jugador" : "jugadores"} al menos a un partido`
          : "Se actualiza a mano"
      }
      icon={ClipboardCheck}
      className={`surface-deep ${className}`}
      bodyClassName="flex flex-col"
    >
      {hasData ? (
        /*
         * Seven rows at a time. The list used to grow with the squad and turned
         * the right column into a page of its own (owner, L21); a fixed window
         * with its own scroll keeps the card the same size every matchday.
         *
         * 20.75rem is seven rows measured, not assumed: a row is 36.5px tall
         * (a 2.25rem face plus two lines) and the gutters are 0.75rem, so seven
         * of them need 7 x 36.5 + 6 x 12 + the 4px top padding = 332px. The old
         * 18.5rem took the row for a clean 2rem and showed six rows plus a sliver
         * of the seventh, which read as clipped text (gate: cut-text on the 75%).
         * A window that ends exactly on a row's edge shows whole rows only.
         *
         * It also shrinks with the card: this card is a flex item in a column and
         * the browser may shrink it, and min-h-0 lets the flex layout take the
         * room back so the list scrolls inside whatever the card ended up with.
         */
        <div className="min-h-0 max-h-[20.75rem] flex-1 overflow-y-auto overscroll-contain px-6 pb-6 pt-1">
          <ul className="flex flex-col gap-3">
            {rows.map((row, index) => (
              <li key={row.name} className="flex items-center gap-3">
                <Face name={row.name} photo={row.photo} />

                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="min-w-0 truncate text-row font-bold uppercase tracking-[0.06em] text-acf-snow/80">
                      {row.name}
                    </span>
                    {/* The percentage is the number the eye comes for: display
                        face on the right edge, the raw count as its quiet label. */}
                    <span className="flex shrink-0 items-baseline gap-1.5">
                      <span className="text-micro font-semibold tabular-nums tracking-[0.06em] text-acf-grey">
                        {row.count}/{row.of}
                      </span>
                      <span className="font-display text-xl font-medium leading-none tabular-nums text-acf-red-soft">
                        {row.pct}%
                      </span>
                    </span>
                  </div>

                  {/* The bar is exactly pct% wide; the numbers beside it are the
                      accessible reading, so the track itself is decorative. */}
                  <div
                    aria-hidden="true"
                    className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/[0.06]"
                  >
                    <div
                      className={`h-full rounded-full ${
                        index === 0 ? "bg-acf-red" : "bg-acf-red/70"
                      }`}
                      style={{ width: `${row.pct}%` }}
                    />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="px-6 pb-6 text-row leading-relaxed text-acf-grey">
          El club todavía no ha facilitado quién vino a cada partido.
        </p>
      )}
    </Card>
  );
}
