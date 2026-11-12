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

/** Fixed-width tiles keep the digits from jumping while the clock ticks. */
function CountdownUnit({ value, label }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <span className="w-[3.25rem] rounded-tile bg-acf-panel-light py-2 text-center font-display text-3xl leading-none tabular-nums text-white sm:w-[3.75rem] sm:text-4xl">
        {String(value).padStart(2, "0")}
      </span>
      <span className="text-[8px] font-semibold uppercase tracking-[0.24em] text-acf-dim">
        {label}
      </span>
    </div>
  );
}

function TeamSide({ slug, highlight = false }) {
  return (
    <div className="flex min-w-0 flex-col items-center gap-2.5 text-center">
      <Crest slug={slug} size="lg" />
      <p
        className={`line-clamp-2 text-[10px] font-extrabold uppercase leading-tight tracking-[0.12em] sm:text-[11px] ${
          highlight ? "text-white" : "text-acf-snow/60"
        }`}
      >
        {teamName(slug)}
      </p>
    </div>
  );
}

function Detail({ label, children }) {
  return (
    <div className="min-w-0 rounded-tile bg-acf-panel-light/70 px-3 py-2.5">
      <dt className="text-[8px] font-semibold uppercase tracking-[0.22em] text-acf-dim">
        {label}
      </dt>
      <dd className="mt-1 flex items-center gap-1.5 truncate text-[13px] font-semibold text-white">
        {children}
      </dd>
    </div>
  );
}

/**
 * The centre card of the grid. It carries the single inverted accent block of
 * the page: the red strip that opens the official calendar.
 */
export default function NextMatchCard({ className = "" }) {
  const next = useMemo(() => nextFixture(), []);
  const opponent = next ? opponentOf(next) : null;
  const countdown = useCountdown(next ? fixtureKickoffIso(next) : null);

  return (
    <article
      id="proximo-partido"
      className={`relative flex scroll-mt-24 flex-col overflow-hidden rounded-card border border-acf-line bg-acf-panel shadow-acf ${className}`}
    >
      <header className="flex items-center gap-2 px-5 pb-3 pt-5">
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-acf-red" />
        <h2 className="text-[15px] font-extrabold leading-tight tracking-tight text-white">
          Próximo partido
        </h2>
      </header>

      {next ? (
        <div className="flex flex-1 flex-col px-5 pb-5">
          <div className="mb-5 flex justify-center">
            <span className="rounded-full border border-acf-line px-3 py-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-acf-grey">
              {matchdayLabel(next)}
            </span>
          </div>

          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 sm:gap-5">
            <TeamSide slug={CLUB_SLUG} highlight />
            <div className="text-center">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.3em] text-acf-dim">
                VS
              </p>
              <p className="mt-2 whitespace-nowrap text-[10px] font-bold uppercase tracking-[0.12em] text-acf-snow/70">
                {fixtureDateLabel(next)}
              </p>
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-acf-grey">
                {fixtureTimeLabel(next)}
              </p>
            </div>
            <TeamSide slug={opponent.slug} />
          </div>

          {countdown ? (
            <div className="mt-6 flex items-start justify-center gap-1 border-t border-acf-line-soft pt-6 sm:gap-2">
              <CountdownUnit value={countdown.days} label="Días" />
              <span className="mt-2 text-lg font-semibold text-acf-dim">:</span>
              <CountdownUnit value={countdown.hours} label="Horas" />
              <span className="mt-2 text-lg font-semibold text-acf-dim">:</span>
              <CountdownUnit value={countdown.minutes} label="Min" />
              <span className="mt-2 text-lg font-semibold text-acf-dim">:</span>
              <CountdownUnit value={countdown.seconds} label="Seg" />
            </div>
          ) : null}

          <dl className="mb-5 mt-6 grid grid-cols-2 gap-2">
            <Detail label="Fecha">{fixtureDateLabel(next)}</Detail>
            <Detail label="Hora">
              <Clock className="h-3.5 w-3.5 shrink-0 text-acf-grey" />
              {fixtureTimeLabel(next)}
            </Detail>
            <Detail label="Campo">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-acf-grey" />
              <span className="truncate">{next.field ?? "Por confirmar"}</span>
            </Detail>
            <Detail label="Condición">{homeAwayLabel(next)}</Detail>
          </dl>

          <a
            href={next.competitionSource}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-auto flex items-center justify-center gap-2 rounded-tile bg-acf-red px-5 py-3.5 text-sm font-extrabold tracking-tight text-acf-dark transition hover:brightness-110"
          >
            Calendario oficial
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      ) : (
        <p className="px-5 pb-5 text-sm text-acf-grey">
          La fuente oficial no publica más partidos programados.
        </p>
      )}
    </article>
  );
}
