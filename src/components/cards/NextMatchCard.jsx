import { useEffect, useMemo, useState } from "react";
import { Shield, Trophy } from "lucide-react";
import {
  CLUB_SLUG,
  fixtureKickoffIso,
  matchdayLabel,
  nextFixture,
  opponentOf,
  teamName,
} from "../../data/competition";
import { Crest } from "./Crest.jsx";
import MatchAttendance from "../MatchAttendance.jsx";

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
 * When and where the fixture is played, as one sentence instead of four tiles.
 * The date keeps the Spanish long form the site reads out ("martes, 17 de
 * noviembre"), with the stand-alone capital a sentence needs. The home/away
 * condition is deliberately absent: every team is from the same town, so it
 * told the reader nothing.
 */
const longDate = new Intl.DateTimeFormat("es-ES", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

function fixtureSentence(fixture) {
  const date = fixture?.date
    ? new Date(`${fixture.date}T${fixture.time ?? "00:00"}:00`)
    : null;
  if (!date || Number.isNaN(date.getTime())) return null;

  const label = longDate.format(date);
  return label.charAt(0).toUpperCase() + label.slice(1).replace(",", "");
}

/** A piece of the sentence the reader should not miss: the real date, hour or field. */
function Strong({ children }) {
  return <strong className="font-bold text-white">{children}</strong>;
}

function KickoffSentence({ fixture }) {
  const day = fixtureSentence(fixture);
  if (!day) return null;

  return (
    <p className="text-balance text-center text-row leading-relaxed text-acf-snow">
      <Strong>{day}</Strong>
      {fixture.time ? <> a las <Strong>{fixture.time}</Strong></> : null}
      {fixture.field ? <> en el <Strong>{fixture.field}</Strong></> : null}
    </p>
  );
}

/**
 * The centre card of the grid and the one hero-level surface of the page
 * (`.surface-hero`).
 *
 * It used to close with the red "Calendario oficial" button, the only inverted
 * accent block of the site. The owner removed it (L16): the calendar card in the
 * grid already opens the same source, and the hero now ends on the headcount,
 * which is what a player actually came here to do.
 */
/**
 * The competition badge names the competition and gives it a mark of its own:
 * a cup for the cup, a shield for the league. Two different symbols, because
 * the badge is the only thing on the card that says which one is being played.
 */
function CompetitionBadge({ competitionKey }) {
  const isCup = competitionKey === "cup";
  const Icon = isCup ? Trophy : Shield;

  return (
    <span className="ml-auto flex shrink-0 items-center gap-1.5 rounded-full bg-acf-red px-2.5 py-1 text-micro font-bold uppercase tracking-[0.16em] text-acf-dark">
      <Icon className="h-3 w-3" aria-hidden="true" />
      {isCup ? "Copa" : "Liga"}
    </span>
  );
}

export default function NextMatchCard({ className = "" }) {
  const next = useMemo(() => nextFixture(), []);
  const opponent = next ? opponentOf(next) : null;
  const countdown = useCountdown(next ? fixtureKickoffIso(next) : null);

  return (
    <article
      id="proximo-partido"
      className={`card surface-hero relative flex scroll-mt-24 flex-col overflow-hidden rounded-card border shadow-acf ${className}`}
    >
      <header className="flex items-center gap-2 px-6 pb-3.5 pt-6">
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-acf-red" />
        <h2 className="text-title font-extrabold leading-tight tracking-tight text-white">
          Próximo partido
        </h2>
        {next ? (
          // The competition badge sits on the header row so the card names its
          // competition without spending a line on it.
          <CompetitionBadge competitionKey={next.competitionKey} />
        ) : null}
      </header>

      {next ? (
        <div className="flex flex-col gap-7 px-6 pb-6">
          {/* The hero stretches to the column height, so its five blocks are
              distributed evenly instead of gathering around one dead band. */}
          <div className="flex justify-center">
            <span className="rounded-full border border-acf-line px-3.5 py-1.5 text-micro font-semibold uppercase tracking-[0.16em] text-acf-grey">
              {matchdayLabel(next)}
            </span>
          </div>

          <div>
            {/* The date, the hour and the field are stated once, in the sentence
                below the countdown, so the centre of the card only names the
                fixture. */}
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
              <div className="flex items-start justify-center gap-1 border-t border-acf-line-soft pt-7 sm:gap-2">
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

          {/* One readable line replaces the four detail tiles the owner asked to
              drop, and it ends the hero's own rhythm instead of a tile grid. */}
          <KickoffSentence fixture={next} />

          {/* The headcount lives on the fixture itself: this is the one card a
              player opens on a Tuesday to say whether he is coming. */}
          <MatchAttendance fixture={next} />
        </div>
      ) : (
        <p className="px-6 pb-6 text-row text-acf-grey">
          La fuente oficial no publica más partidos programados.
        </p>
      )}
    </article>
  );
}
