import { useEffect, useMemo, useState } from "react";
import { Clock, ExternalLink, MapPin } from "lucide-react";
import {
  CLUB_SLUG,
  fixtureDateLabel,
  fixtureKickoffIso,
  fixtureTimeLabel,
  homeAwayLabel,
  matchdayLabel,
  nextFixture,
  opponentOf,
  teamName,
} from "../../data/competition";
import { Crest } from "./Crest.jsx";

/** Seconds until the next kickoff. Nothing is rendered when there is no fixture. */
function useCountdown(targetIso) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!targetIso) return undefined;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [targetIso]);

  if (!targetIso) return null;
  const diff = Math.max(0, new Date(targetIso).getTime() - now);
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
  };
}

function CountdownUnit({ value, label, accent = false }) {
  return (
    <div className="flex flex-col items-center">
      <span
        className={`clip-edge px-2.5 py-1.5 font-display text-2xl leading-none tabular-nums sm:px-3.5 sm:text-3xl ${
          accent
            ? "bg-acf-red text-white"
            : "border border-acf-line bg-acf-panel text-white"
        }`}
      >
        {String(value).padStart(2, "0")}
      </span>
      <span className="mt-1.5 text-[9px] font-bold uppercase tracking-[0.3em] text-acf-grey">
        {label}
      </span>
    </div>
  );
}

function TeamSide({ slug, highlight = false }) {
  return (
    <div className="flex min-w-0 flex-col items-center gap-2 text-center">
      <Crest slug={slug} size="lg" />
      <p
        className={`line-clamp-2 text-[10px] font-bold uppercase leading-tight tracking-wide sm:text-xs ${
          highlight ? "text-acf-red" : "text-acf-snow/80"
        }`}
      >
        {teamName(slug)}
      </p>
    </div>
  );
}

function Detail({ label, children }) {
  return (
    <div className="min-w-0">
      <dt className="text-[9px] font-bold uppercase tracking-[0.25em] text-acf-grey">
        {label}
      </dt>
      <dd className="mt-1 truncate text-sm font-semibold text-acf-snow">{children}</dd>
    </div>
  );
}

export default function NextMatchCard({ className = "" }) {
  const next = useMemo(() => nextFixture(), []);
  const opponent = next ? opponentOf(next) : null;
  const countdown = useCountdown(next ? fixtureKickoffIso(next) : null);

  return (
    <article
      id="proximo-partido"
      className={`relative flex scroll-mt-24 flex-col overflow-hidden border border-acf-red/40 bg-gradient-to-br from-acf-panel-light to-acf-dark shadow-red clip-edge-tl ${className}`}
    >
      <header className="flex items-center gap-2 border-b border-acf-red/25 px-5 py-4">
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-acf-red opacity-75" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-acf-red" />
        </span>
        <span className="font-display text-xl leading-none tracking-[0.2em] text-white uppercase">
          Próximo partido
        </span>
      </header>

      {next ? (
        <div className="flex flex-1 flex-col p-5 sm:p-7">
          <p className="mb-4 text-center text-[10px] font-bold uppercase tracking-[0.22em] text-acf-red">
            {matchdayLabel(next)}
          </p>

          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 sm:gap-5">
            <TeamSide slug={CLUB_SLUG} highlight />
            <div className="text-center">
              <p className="font-display text-3xl leading-none text-acf-red sm:text-4xl">VS</p>
              <p className="mt-2 whitespace-nowrap text-[10px] font-bold uppercase tracking-[0.2em] text-acf-grey">
                {fixtureDateLabel(next)}
              </p>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-acf-grey">
                {fixtureTimeLabel(next)}
              </p>
            </div>
            <TeamSide slug={opponent.slug} />
          </div>

          {countdown ? (
            <div className="mt-7 flex items-start justify-center gap-1.5 border-t border-acf-line pt-6 sm:gap-3">
              <CountdownUnit value={countdown.days} label="Días" />
              <span className="pb-5 font-display text-xl text-acf-red sm:text-2xl">:</span>
              <CountdownUnit value={countdown.hours} label="Horas" />
              <span className="pb-5 font-display text-xl text-acf-red sm:text-2xl">:</span>
              <CountdownUnit value={countdown.minutes} label="Min" />
              <span className="pb-5 font-display text-xl text-acf-red sm:text-2xl">:</span>
              <CountdownUnit value={countdown.seconds} label="Seg" accent />
            </div>
          ) : null}

          <dl className="mt-6 mb-6 grid grid-cols-2 gap-x-4 gap-y-4 border-t border-acf-line pt-5">
            <Detail label="Fecha">
              {fixtureDateLabel(next)}
            </Detail>
            <Detail label="Hora">
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-acf-red" />
                {fixtureTimeLabel(next)}
              </span>
            </Detail>
            <Detail label="Campo">
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-acf-red" />
                <span className="truncate">{next.field ?? "Por confirmar"}</span>
              </span>
            </Detail>
            <Detail label="Condición">{homeAwayLabel(next)}</Detail>
          </dl>

          <a
            href={next.competitionSource}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-auto flex items-center justify-center gap-2 bg-acf-red px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-acf-red-dark"
          >
            Calendario oficial
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      ) : (
        <p className="p-6 text-sm text-acf-grey">
          La fuente oficial no publica más partidos programados.
        </p>
      )}
    </article>
  );
}
