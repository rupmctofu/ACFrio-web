import { useMemo, useState } from "react";
import { MapPin, CalendarDays, Trophy, Zap, ExternalLink } from "lucide-react";
import teamData from "../data/teamData.json";
import matchData from "../data/matchData.json";

const positionLabels = {
  Portero: "POR",
  Defensa: "DEF",
  Medio: "MED",
  Delantero: "DEL",
};

function formatMatchDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString("es-ES", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
}

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

function ClubBadge({ name, badge }) {
  const isAcf = name.toUpperCase() === club.name.toUpperCase();
  const src = isAcf ? club.logo : badge;
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <div className="mx-auto h-16 w-16 rounded-xl bg-acf-dark border border-acf-line flex items-center justify-center mb-3">
        <span className="font-display text-xl text-acf-grey">
          {isAcf ? "ACF" : initialsOf(name)}
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

export default function MatchCenter() {
  const { squad } = teamData;
  const { nextMatch, lastMatch } = matchData;

  const scorerNames = useMemo(() => {
    return lastMatch.scorers
      .map((s) => {
        const player = squad.find((p) => p.id === s.playerId);
        const base = player ? player.nickname : "?";
        return s.goals > 1 ? `${base} ×${s.goals}` : base;
      })
      .join(" · ");
  }, [lastMatch, squad]);

  const mvpPlayer = useMemo(
    () => squad.find((p) => p.id === lastMatch.mvp),
    [lastMatch.mvp, squad]
  );

  const win = lastMatch.homeScore > lastMatch.awayScore;
  const resultLabel = win ? "VICTORIA" : lastMatch.homeScore === lastMatch.awayScore ? "EMPATE" : "DERROTA";

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
              Jugado en la Pachanga Arena
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
                win ? "bg-acf-red text-white" : "bg-acf-grey text-black"
              }`}
            >
              {resultLabel}
            </div>

            <div className="p-7 sm:p-9">
              <div className="flex items-center gap-2 text-acf-grey text-xs font-bold uppercase tracking-[0.3em] mb-6">
                <Trophy className="h-4 w-4 text-acf-red" /> Último Resultado
              </div>

              <div className="flex items-center justify-center gap-6 sm:gap-10">
                <div className="flex-1 text-center">
                  <ClubBadge name={lastMatch.homeTeam} badge={lastMatch.homeBadge} />
                  <p className="font-bold text-sm text-white uppercase">{lastMatch.homeTeam}</p>
                </div>

                <div className="flex flex-col items-center">
                  <span className="font-display text-6xl sm:text-7xl tabular-nums leading-none">
                    <span className="text-white">{lastMatch.homeScore}</span>
                    <span className="text-acf-grey mx-2">—</span>
                    <span className="text-acf-red">{lastMatch.awayScore}</span>
                  </span>
                  <span className="mt-2 text-[10px] font-bold tracking-[0.3em] text-acf-grey uppercase">
                    Final
                  </span>
                </div>

                <div className="flex-1 text-center">
                  <ClubBadge name={lastMatch.awayTeam} badge={lastMatch.awayBadge} />
                  <p className="font-bold text-sm text-acf-snow/70 uppercase">{lastMatch.awayTeam}</p>
                </div>
              </div>

              <div className="mt-7 border-t border-acf-line pt-5 space-y-2.5">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-acf-grey uppercase tracking-wider text-xs font-bold">Goleadores</span>
                  <span className="text-acf-snow">{scorerNames}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-acf-grey uppercase tracking-wider text-xs font-bold">MVP</span>
                  <span className="text-acf-red font-bold">
                    {mvpPlayer ? `${mvpPlayer.name} · ${mvpPlayer.nickname}` : "—"}
                  </span>
                </div>
              </div>
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
                <CalendarDays className="h-4 w-4 text-acf-red" /> {nextMatch.round}
              </div>

              <div className="flex items-center justify-center gap-6 sm:gap-10">
                <div className="flex-1 text-center">
                  <ClubBadge name={club.name} />
                  <p className="font-bold text-sm text-white uppercase">{club.name}</p>
                </div>

                <div className="flex flex-col items-center">
                  <span className="font-display text-5xl sm:text-6xl leading-none text-acf-red">VS</span>
                  <span className="mt-2 text-[10px] font-bold tracking-[0.3em] text-acf-grey uppercase">
                    {formatMatchDate(nextMatch.date)} · {formatTime(nextMatch.date)}
                  </span>
                </div>

                <div className="flex-1 text-center">
                  <ClubBadge name={nextMatch.rivalName} badge={nextMatch.rivalBadge} />
                  <p className="font-bold text-sm text-white uppercase">{nextMatch.rivalName}</p>
                </div>
              </div>

              <div className="mt-7 border-t border-acf-line pt-5 space-y-2.5">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-acf-grey uppercase tracking-wider text-xs font-bold">Campo</span>
                  <span className="text-acf-snow flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-acf-red" /> {nextMatch.field}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-acf-grey uppercase tracking-wider text-xs font-bold">Alineación</span>
                  <span className="text-acf-snow">
                    {squad.length} jugadores listos
                  </span>
                </div>
              </div>

              <a
                href={nextMatch.fieldLocationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-7 flex items-center justify-center gap-2 bg-acf-red hover:bg-acf-red-dark text-white font-bold py-3 clip-edge transition-all hover:shadow-red"
              >
                <MapPin className="h-4 w-4" /> Cómo llegar <ExternalLink className="h-3.5 w-3.5 ml-1" />
              </a>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}