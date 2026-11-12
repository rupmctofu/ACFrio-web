import { ClipboardCheck } from "lucide-react";
import {
  clubSide,
  fixtureDateLabel,
  league,
  opponentOf,
  teamFullName,
  teamName,
} from "../../data/competition";
import {
  attendanceFor,
  hasAnyAttendance,
  totalAppearances,
} from "../../data/club-record";
import Card from "./Card.jsx";
import { Crest } from "./Crest.jsx";

/**
 * The played league matchdays of the club, oldest first. They are the rows the
 * club fills in by hand, one per match, and the only dates this card ever shows.
 */
const playedMatches = () =>
  league.fixtures
    .filter((fixture) => fixture.status === "played" && clubSide(fixture) !== null)
    .sort((a, b) => a.matchday - b.matchday);

/**
 * Who turned up to each played match, exactly as the club reports it. The club
 * keeps this list by hand, so an empty list means "not reported yet" and the
 * card says so instead of showing names nobody confirmed.
 */
export default function AttendanceCard({ className = "" }) {
  const matches = playedMatches();
  const hasData = hasAnyAttendance();
  const players = totalAppearances();

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
      className={className}
      bodyClassName="flex flex-col"
    >
      {hasData ? (
        <ul className="flex flex-col gap-2.5 px-6 pb-6 pt-1">
          {matches.map((fixture) => {
            const opponent = opponentOf(fixture);
            const names = attendanceFor(league.key, fixture.matchday);

            return (
              <li
                key={fixture.matchday}
                className="rounded-tile bg-acf-panel-light/70 px-4 py-3"
              >
                <div className="flex items-center gap-2">
                  <Crest slug={opponent.slug} size="sm" />
                  <span
                    title={teamFullName(opponent.slug)}
                    className="min-w-0 flex-1 truncate text-row font-bold uppercase tracking-[0.06em] text-acf-snow/80"
                  >
                    {teamName(opponent.slug)}
                  </span>
                </div>
                <p className="mt-1.5 text-micro font-semibold uppercase tracking-[0.18em] text-acf-dim">
                  J{fixture.matchday} · {fixtureDateLabel(fixture)}
                </p>

                {names.length ? (
                  <ul className="mt-2.5 flex flex-wrap gap-1.5">
                    {names.map((name) => (
                      <li
                        key={name}
                        className="max-w-full truncate rounded-full border border-acf-line px-2.5 py-1 text-micro font-bold uppercase tracking-[0.08em] text-acf-snow/80"
                      >
                        {name}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-micro font-semibold uppercase tracking-[0.14em] text-acf-dim">
                    Nombres no facilitados
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="px-6 pb-6 text-row leading-relaxed text-acf-grey">
          El club todavía no ha facilitado quién vino a cada partido.
        </p>
      )}
    </Card>
  );
}
