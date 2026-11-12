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
      <span className="w-[3.25rem] rounded-tile bg-white/[0.07] py-2.5 text-center font-display text-3xl leading-none tabular-nums text-white sm:w-[3.75rem] sm:text-4xl">
        {String(value).padStart(2, "0")}
      </span>
      <span className="text-micro font-semibold uppercase tracking-[0.24em] text-acf-dim">
        {label}
      </span>
    </div>
  );
}

function TeamSide({ slug, highlight = false }) {
  return (
    <div className="flex min-w-0 flex-col items-center gap-3 text-center">
      <Crest slug={slug} size="lg" />
      <p
        className={`line-clamp-2 text-[11px] font-extrabold uppercase leading-tight tracking-[0.12em] sm:text-row ${
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
    <div className="min-w-0 rounded-tile bg-white/[0.05] px-4 py-3">
      <dt className="text-micro font-semibold uppercase tracking-[0.22em] text-acf-dim">
        {label}
      </dt>
      <dd className="mt-1.5 flex items-center gap-1.5 truncate text-row font-semibold text-white">
        {children}
      </dd>
    </div>
  );
}

/**
 * The centre card of the grid and the one hero-level surface of the page
 * (`.surface-hero`). It also carries the single inverted accent block of the
 * site: the red strip that opens the official calendar.
 */
export default function NextMatchCard({ className = "" }) {
  const next = useMemo(() => nextFixture(), []);
  const opponent = next ? opponentOf(next) : null;
  const countdown = useCountdown(next ? fixtureKickoffIso(next) : null);

  return (
    <article
      id="proximo-partido"
      className={`surface-hero relative flex scroll-mt-24 flex-col overflow-hidden rounded-card border shadow-acf ${className}`}
    >
      <header className="flex items-center gap-2 px-6 pb-3.5 pt-6">
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-acf-red" />
        <h2 className="text-title font-extrabold leading-tight tracking-tight text-white">
          Próximo partido
        </h2>
      </header>

      {next ? (
        <div className="flex flex-1 flex-col px-6 pb-6">
          {/* The pill, the matchup and the countdown take the free vertical space
              of the card and stay optically centred, so on the tall desktop column
              the hero breathes instead of leaving a gap above the details. */}
          <div className="mb-6 flex justify-center">
            <span className="rounded-full border border-acf-line px-3.5 py-1.5 text-micro font-semibold uppercase tracking-[0.16em] text-acf-grey">
              {matchdayLabel(next)}
            </span>
          </div>

          <div className="flex flex-1 flex-col justify-center">
            {/* The date and the kickoff time are already stated with their own labels
                in the details below, so the centre of the card only names the fixture. */}
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 sm:gap-5">
              <TeamSide slug={CLUB_SLUG} highlight />
              <div className="text-center">
                <p className="text-micro font-extrabold uppercase tracking-[0.3em] text-acf-dim">
                  VS
                </p>
              </div>
              <TeamSide slug={opponent.slug} />
            </div>

            {countdown ? (
              <div className="mt-7 flex items-start justify-center gap-1 border-t border-acf-line-soft pt-7 sm:gap-2">
                <CountdownUnit value={countdown.days} label="Días" />
                <span className="mt-2 text-lg font-semibold text-acf-dim">:</span>
                <CountdownUnit value={countdown.hours} label="Horas" />
                <span className="mt-2 text-lg font-semibold text-acf-dim">:</span>
                <CountdownUnit value={countdown.minutes} label="Min" />
                <span className="mt-2 text-lg font-semibold text-acf-dim">:</span>
                <CountdownUnit value={countdown.seconds} label="Seg" />
              </div>
            ) : null}
          </div>

          {/* One column on a phone: the field name is real data, so it never has
              to be squeezed into a half-width tile. */}
          <dl className="mb-6 mt-7 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
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
            className="mt-auto flex items-center justify-center gap-2 rounded-tile bg-acf-red px-6 py-4 text-[15px] font-extrabold tracking-tight text-acf-dark transition hover:brightness-110"
          >
            Calendario oficial
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      ) : (
        <p className="px-6 pb-6 text-row text-acf-grey">
          La fuente oficial no publica más partidos programados.
        </p>
      )}
    </article>
  );
}
