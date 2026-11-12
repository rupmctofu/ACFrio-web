import { useMemo, useState } from "react";
import { MapPin, CalendarDays, Trophy, Zap, ExternalLink } from "lucide-react";
import teamData from "../data/teamData.json";
import {
  CLUB_SLUG,
  nextFixture,
  lastFixture,
  opponentOf,
  teamName,
  teamCrest,
  clubSide,
  fixtureDateLabel,
  fixtureTimeLabel,
  matchdayLabel,
  resultOf,
} from "../data/competition";

const club = teamData.club;

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

/** The club uses its own logo; rivals use the crest published by the source. */
function ClubBadge({ slug, name }) {
  const src = slug === CLUB_SLUG ? club.logo : teamCrest(slug);
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className="mx-auto h-16 w-16 rounded-xl bg-acf-dark border border-acf-line flex items-center justify-center mb-3">
        <span className="font-display text-xl text-acf-grey">
          {slug === CLUB_SLUG ? "ACF" : initialsOf(name)}
        </span>
      </div>
    );
  }
  return (
    <div className="mx-auto h-16 w-16 rounded-xl bg-acf-dark border border-acf-line flex items-center justify-center mb-3 overflow-hidden">
      <img
        src={src}
        alt={name}
        className="h-full w-full object-contain"
        onError={() => setFailed(true)}
      />
    </div>
  );
}

const RESULT_LABEL = { win: "VICTORIA", draw: "EMPATE", loss: "DERROTA" };

export default function MatchCenter() {
  const { squad } = teamData;
  const lastMatch = useMemo(() => lastFixture(), []);
  const nextMatch = useMemo(() => nextFixture(), []);

  const lastResult = lastMatch ? resultOf(lastMatch) : null;
  const nextOpponent = nextMatch ? opponentOf(nextMatch) : null;
  const ownSide = nextMatch ? clubSide(nextMatch) : null;

  return (
    <section id="partidos" className="relative py-24 texture-grain">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-12">
          <div>
            <p className="text-acf-red font-display text-3xl tracking-widest">MATCH CENTER</p>
            <h2 className="font-display text-4xl sm:text-5xl tracking-wide uppercase">
              Último Resultado vs Próximo Duelo
            </h2>
          </div>
          <div className="hidden sm:flex items-center gap-3">
            <Zap className="h-5 w-5 text-acf-red" />
            <span className="text-acf-grey text-sm font-semibold uppercase tracking-widest">
              {nextMatch ? nextMatch.competitionName : "Lliga Comarcal Futbol 7"}
            </span>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* ===== ÚLTIMO RESULTADO ===== */}
          <article className="relative overflow-hidden bg-acf-panel border border-acf-line shadow-acf clip-edge-tl">
            <div
              className="absolute inset-0 opacity-[0.04] pointer-events-none"
              style={{
                background: "repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 1px, transparent 12px)",
              }}
            />
            <div
              className={`absolute top-0 right-0 px-4 py-1.5 font-display text-lg tracking-[0.25em] ${
                lastResult === "win" ? "bg-acf-red text-white" : "bg-acf-grey text-black"
              }`}
            >
              {lastResult ? RESULT_LABEL[lastResult] : "SIN DATOS"}
            </div>

            <div className="p-7 sm:p-9">
              <div className="flex items-center gap-2 text-acf-grey text-xs font-bold uppercase tracking-[0.3em] mb-6">
                <Trophy className="h-4 w-4 text-acf-red" /> Último Resultado
              </div>

              {lastMatch ? (
                <>
                  <div className="flex items-center justify-center gap-4 sm:gap-6 md:gap-10">
                    <div className="flex-1 text-center min-w-0">
                      <ClubBadge slug={lastMatch.home.slug} name={teamName(lastMatch.home.slug)} />
                      <p className="font-bold text-xs sm:text-sm text-white uppercase truncate">
                        {teamName(lastMatch.home.slug)}
                      </p>
                    </div>

                    <div className="flex flex-col items-center shrink-0">
                      <span className="font-display text-5xl sm:text-6xl sm:text-7xl tabular-nums leading-none">
                        <span className="text-white">{lastMatch.score.home}</span>
                        <span className="text-acf-grey mx-2">—</span>
                        <span className="text-acf-red">{lastMatch.score.away}</span>
                      </span>
                      <span className="mt-2 text-[10px] font-bold tracking-[0.3em] text-acf-grey uppercase">
                        Final
                      </span>
                    </div>

                    <div className="flex-1 text-center min-w-0">
                      <ClubBadge slug={lastMatch.away.slug} name={teamName(lastMatch.away.slug)} />
                      <p className="font-bold text-xs sm:text-sm text-acf-snow/70 uppercase truncate">
                        {teamName(lastMatch.away.slug)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-7 border-t border-acf-line pt-5 space-y-2.5">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-acf-grey uppercase tracking-wider text-xs font-bold">Competición</span>
                      <span className="text-acf-snow">{matchdayLabel(lastMatch)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-acf-grey uppercase tracking-wider text-xs font-bold">Fecha</span>
                      <span className="text-acf-snow">
                        {fixtureDateLabel(lastMatch)} · {fixtureTimeLabel(lastMatch)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-acf-grey uppercase tracking-wider text-xs font-bold">Campo</span>
                      <span className="text-acf-snow">{lastMatch.field ?? "—"}</span>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-acf-grey text-sm py-10 text-center">
                  Todavía no hay ningún partido jugado en la fuente oficial.
                </p>
              )}
            </div>
          </article>

          {/* ===== PRÓXIMO PARTIDO ===== */}
          <article className="relative overflow-hidden border border-acf-red/40 bg-gradient-to-br from-acf-panel-light to-acf-dark shadow-red clip-edge-tl">
            <div className="absolute top-3 right-3 flex items-center gap-2 text-acf-red anim-pulse-red px-3 py-1 border border-acf-red/50 rounded-sm">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-acf-red opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-acf-red" />
              </span>
              <span className="text-[10px] font-bold uppercase tracking-[0.25em]">Próximo</span>
            </div>

            <div className="p-7 sm:p-9">
              <div className="flex items-center gap-2 text-acf-grey text-xs font-bold uppercase tracking-[0.3em] mb-6">
                <CalendarDays className="h-4 w-4 text-acf-red" />
                {nextMatch ? matchdayLabel(nextMatch) : "Calendario pendiente"}
              </div>

              {nextMatch ? (
                <>
                  <div className="flex items-center justify-center gap-4 sm:gap-6 md:gap-10">
                    <div className="flex-1 text-center min-w-0">
                      <ClubBadge slug={CLUB_SLUG} name={club.name} />
                      <p className="font-bold text-xs sm:text-sm text-white uppercase truncate">{club.name}</p>
                    </div>

                    <div className="flex flex-col items-center shrink-0">
                      <span className="font-display text-4xl sm:text-5xl md:text-6xl leading-none text-acf-red">VS</span>
                      <span className="mt-2 text-[10px] font-bold tracking-[0.3em] text-acf-grey uppercase">
                        {fixtureDateLabel(nextMatch)} · {fixtureTimeLabel(nextMatch)}
                      </span>
                    </div>

                    <div className="flex-1 text-center min-w-0">
                      <ClubBadge slug={nextOpponent.slug} name={teamName(nextOpponent.slug)} />
                      <p className="font-bold text-xs sm:text-sm text-white uppercase truncate">
                        {teamName(nextOpponent.slug)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-7 border-t border-acf-line pt-5 space-y-2.5">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-acf-grey uppercase tracking-wider text-xs font-bold">Campo</span>
                      <span className="text-acf-snow flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-acf-red" /> {nextMatch.field ?? "—"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-acf-grey uppercase tracking-wider text-xs font-bold">Condición</span>
                      <span className="text-acf-snow">
                        {ownSide === "home" ? "Local" : "Visitante"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-acf-grey uppercase tracking-wider text-xs font-bold">Alineación</span>
                      <span className="text-acf-snow">{squad.length} jugadores listos</span>
                    </div>
                  </div>

                  <a
                    href={nextMatch.competitionSource}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-7 flex items-center justify-center gap-2 bg-acf-red hover:bg-acf-red-dark text-white font-bold py-3 px-4 clip-edge transition-all hover:shadow-red"
                  >
                    <MapPin className="h-4 w-4" /> Calendario oficial <ExternalLink className="h-3.5 w-3.5 ml-1" />
                  </a>
                </>
              ) : (
                <p className="text-acf-grey text-sm py-10 text-center">
                  No hay más partidos programados en la fuente oficial.
                </p>
              )}
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
