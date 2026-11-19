import { useSyncExternalStore } from "react";
import { CalendarDays, MapPin, Shield, Trophy } from "lucide-react";
import {
  CLUB_SLUG,
  club,
  fixtureCardState,
  fixtureKickoffAt,
  matchdayLabel,
  opponentOf,
  teamFullName,
} from "../../data/competition";
import { Crest } from "./Crest.jsx";
import { VOICE } from "../../data/copy.js";
import MatchAttendance from "../MatchAttendance.jsx";

/*
 * One clock for both fixture cards.
 *
 * Which card is the active one is decided by comparing the two kickoffs, so two
 * independent one-second timers could disagree for a moment and put the hero
 * surface and the headcount on two cards at once. The interval belongs to this
 * module: it starts with the first card that mounts, feeds every mounted card
 * the same instant, and stops when the last one unmounts. That also rolls the
 * page over to the following fixture without a reload the second a countdown
 * reaches zero.
 */
const clockListeners = new Set();
let clockNow = Date.now();
let clockTimer = null;

function subscribeToClock(listener) {
  clockListeners.add(listener);
  if (clockTimer === null) {
    // The first card back after every card unmounted gets a fresh instant
    // instead of the one the clock stopped on.
    clockNow = Date.now();
    clockTimer = setInterval(() => {
      clockNow = Date.now();
      for (const notify of clockListeners) notify();
    }, 1000);
  }
  return () => {
    clockListeners.delete(listener);
    if (clockListeners.size === 0 && clockTimer !== null) {
      clearInterval(clockTimer);
      clockTimer = null;
    }
  };
}

const readClock = () => clockNow;

/** The current instant, re-read every second and shared by both fixture cards. */
export function useFixtureClock() {
  return useSyncExternalStore(subscribeToClock, readClock, readClock);
}

/** Days, hours, minutes and seconds left until the kickoff, never negative. */
function splitCountdown(fixture, now) {
  const at = fixtureKickoffAt(fixture);
  if (at === null) return null;
  const diff = Math.max(0, at - now);
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
  };
}

/**
 * The wait in words, for the cards that are not counting down in digits: the
 * active card measures the wait to the second, the quiet cards only have to say
 * how far away their match is (S7, S8).
 */
export function daysLabel(days) {
  if (days == null) return null;
  if (days <= 0) return "Hoy";
  return days === 1 ? "Queda 1 día" : `Quedan ${days} días`;
}

/**
 * Fixed-width tiles keep the digits from jumping while the clock ticks. The
 * tile carries the red the poster lives on: a red-washed charcoal module with
 * its own hairline, so the four units read as one instrument.
 */
function CountdownUnit({ value, label }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <span
        aria-hidden="true"
        className="w-[3.25rem] rounded-tile border border-acf-red/25 bg-acf-red/15 py-2.5 text-center font-display text-3xl font-medium leading-none tabular-nums text-white shadow-[inset_0_-18px_28px_-24px_rgba(230,28,36,0.55)] sm:w-[3.75rem] sm:text-4xl"
      >
        {String(value).padStart(2, "0")}
      </span>
      <span className="text-micro font-semibold uppercase tracking-[0.24em] text-acf-grey">
        {label}
      </span>
    </div>
  );
}

function Countdown({ countdown }) {
  return (
    <div className="flex items-start justify-center gap-1 border-t border-acf-line-soft pt-7 sm:gap-2">
      <CountdownUnit value={countdown.days} label="Días" />
      <span className="mt-2 text-lg font-semibold text-acf-dim">:</span>
      <CountdownUnit value={countdown.hours} label="Horas" />
      <span className="mt-2 text-lg font-semibold text-acf-dim">:</span>
      <CountdownUnit value={countdown.minutes} label="Min" />
      <span className="mt-2 text-lg font-semibold text-acf-dim">:</span>
      <CountdownUnit value={countdown.seconds} label="Seg" />
    </div>
  );
}

/**
 * One side of the fixture. The active card gives the two faces the poster size;
 * the quiet cards shrink them, because their job is to be read, not to headline
 * the column. Names are the source's full official names: an abbreviation hides
 * which club is coming.
 */
function TeamSide({ slug, tone, highlight = false }) {
  const hero = tone === "hero";
  const nameClass = hero
    ? `line-clamp-2 text-[0.6875rem] font-extrabold uppercase leading-tight tracking-[0.12em] sm:text-row ${
        highlight ? "text-white" : "text-acf-snow/70"
      }`
    : `line-clamp-2 text-[0.6875rem] font-extrabold uppercase leading-tight tracking-[0.1em] ${
        highlight ? "text-white" : "text-acf-snow"
      }`;

  return (
    <div className={`flex min-w-0 flex-col items-center text-center ${hero ? "gap-3" : "gap-2"}`}>
      {/* Both faces open their club's page: the card lives on the dashboard, so
          neither crest is a link to where the reader already is. */}
      <Crest slug={slug} size={hero ? "xl" : "lg"} ink={!hero} to={`/equipo/${slug}`} />
      <p title={teamFullName(slug)} className={nameClass}>
        {teamFullName(slug)}
      </p>
    </div>
  );
}

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

/**
 * When and where the fixture is played, as one sentence instead of four tiles.
 * The date keeps the Spanish long form the site reads out ("martes, 17 de
 * noviembre"), with the stand-alone capital a sentence needs. The home/away
 * condition is deliberately absent: every team is from the same town, so it
 * told the reader nothing.
 */
function KickoffSentence({ fixture, tone }) {
  const day = fixtureSentence(fixture);
  if (!day) return null;

  return (
    <p
      className={`text-balance text-center text-row leading-relaxed ${
        tone === "hero" ? "text-acf-snow" : "text-acf-grey"
      }`}
    >
      <Strong>{day}</Strong>
      {fixture.time ? <> a las <Strong>{fixture.time}</Strong></> : null}
      {fixture.field ? <> en el <Strong>{fixture.field}</Strong></> : null}
    </p>
  );
}

/**
 * The competition badge names the competition and gives it a mark of its own:
 * a cup for the cup, a shield for the league. It is solid red only on the active
 * card; on the quiet ones it keeps its outline, so the red on the column says
 * "this is the next match" without another word.
 */
function CompetitionBadge({ competitionKey, tone }) {
  const isCup = competitionKey === "cup";
  const Icon = isCup ? Trophy : Shield;
  const shell =
    tone === "hero"
      ? "bg-acf-red text-white"
      : "border border-acf-line bg-white/[0.04] text-acf-grey";

  return (
    <span
      className={`ml-auto flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-micro font-bold uppercase tracking-[0.16em] ${shell}`}
    >
      <Icon className="h-3 w-3" aria-hidden="true" />
      {isCup ? "Copa" : "Liga"}
    </span>
  );
}

/** The two faces of the fixture, side by side, at the size the tone allows. */
function Faces({ fixture, tone }) {
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 sm:gap-5">
      <TeamSide slug={CLUB_SLUG} tone={tone} highlight />
      <div className="text-center">
        <p
          className={`font-display font-medium uppercase tracking-[0.2em] ${
            tone === "hero" ? "text-xl text-acf-grey" : "text-lg text-acf-grey"
          }`}
        >
          VS
        </p>
      </div>
      <TeamSide slug={opponentOf(fixture).slug} tone={tone} />
    </div>
  );
}

/**
 * One fixture card. Both centre-column cards use this anatomy — crest, rival
 * name, competition chip, date and time, field, days remaining and, only while
 * it is the active card, the attendance block (S10). Three treatments:
 *
 *   hero  — the active card: the red hero surface, the big countdown and the
 *           headcount, exactly the poster the column already had.
 *   rest  — the league card when its next match is more than a week away (S7):
 *           no red at all, flat greys, a smaller body and the note that says so.
 *           Every line is a full-strength token, because a legible flat card is
 *           the point: fading it is what the owner asked to stop.
 *   quiet — the cup card when the league card is the active one: same anatomy,
 *           panel surface, smaller, no headcount.
 */
export function FixtureCardView({ id, title, competitionKey, state, now, className = "" }) {
  const { fixture, active, resting, days } = state;
  const tone = active ? "hero" : resting ? "rest" : "quiet";
  const hero = tone === "hero";
  const countdown = hero ? splitCountdown(fixture, now) : null;

  return (
    <article
      id={id}
      className={`card relative flex scroll-mt-24 flex-col overflow-hidden rounded-card border ${
        hero ? "surface-hero shadow-acf" : "border-acf-line bg-acf-panel shadow-acf"
      } ${className}`}
    >
      {hero ? (
        // The poster's diagonal: the crest motif crossing the top of the card,
        // under the header row, so the surface never reads as a flat panel.
        <div
          aria-hidden="true"
          className="acf-streaks pointer-events-none absolute inset-x-0 top-0 h-32 opacity-60"
        />
      ) : null}

      <header
        className={`flex items-center gap-2 ${hero ? "px-6 pb-3.5 pt-6" : "px-5 pb-3 pt-5"}`}
      >
        <span
          className={`h-1.5 w-1.5 shrink-0 rounded-full ${hero ? "bg-acf-red" : "bg-acf-grey"}`}
        />
        <h2
          className={`font-extrabold leading-tight tracking-tight text-white ${
            hero ? "text-title" : "text-[1rem]"
          }`}
        >
          {title}
        </h2>
        {fixture ? (
          // The competition badge sits on the header row so the card names its
          // competition without spending a line on it.
          <CompetitionBadge competitionKey={competitionKey} tone={tone} />
        ) : null}
      </header>

      {!fixture ? (
        <div className="px-6 pb-6">
          <p className="text-row text-acf-grey">
            La fuente oficial no publica más partidos programados.
          </p>
          <p className="mt-1.5 text-row font-semibold text-acf-snow/80">
            {VOICE.states.noFixtures}
          </p>
        </div>
      ) : tone === "rest" ? (
        /*
         * No league this week (S7). The card shrinks and loses the red on
         * purpose, and it still says which match is coming and how far away it
         * is: a reduced card is not a card without information.
         */
        <div className="flex flex-col gap-3 px-5 pb-5">
          <p className="text-[0.9375rem] font-extrabold uppercase leading-tight tracking-[0.04em] text-white">
            Esta semana no hay liga
          </p>
          <p className="text-row font-semibold leading-relaxed text-acf-snow">
            Próximo partido: {club.name} vs {teamFullName(opponentOf(fixture).slug)}
          </p>
          <KickoffSentence fixture={fixture} tone={tone} />
          {days == null ? null : (
            <p className="text-micro font-semibold uppercase tracking-[0.16em] text-acf-grey">
              {daysLabel(days)}
            </p>
          )}
        </div>
      ) : (
        <div className={`flex flex-col ${hero ? "gap-7 px-6 pb-6" : "gap-5 px-5 pb-5"}`}>
          {hero ? (
            <div className="flex justify-center">
              <span className="rounded-full border border-acf-red/30 bg-acf-red/10 px-3.5 py-1.5 text-micro font-semibold uppercase tracking-[0.16em] text-acf-snow/85">
                {matchdayLabel(fixture)}
              </span>
            </div>
          ) : null}

          <div className={hero ? "" : "flex flex-col gap-3"}>
            <Faces fixture={fixture} tone={tone} />
            {countdown ? <Countdown countdown={countdown} /> : null}
          </div>

          {hero ? (
            /* One readable line replaces the four detail tiles the owner asked
               to drop, and it ends the hero's own rhythm instead of a tile grid. */
            <div className="flex flex-col items-center gap-2">
              <KickoffSentence fixture={fixture} tone={tone} />
              <p className="text-micro font-semibold uppercase tracking-[0.16em] text-acf-grey">
                {VOICE.sections.nextMatch}
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 border-t border-acf-line-soft pt-3">
              <KickoffSentence fixture={fixture} tone={tone} />
              {days == null ? null : (
                <p className="text-micro font-semibold uppercase tracking-[0.16em] text-acf-grey">
                  {daysLabel(days)}
                </p>
              )}
            </div>
          )}

          {/*
           * The headcount lives on the active fixture and on nothing else: the
           * list has to be about the match being played next, or a player signs
           * up for the wrong one (S10).
           */}
          {hero ? <MatchAttendance fixture={fixture} /> : null}
        </div>
      )}
    </article>
  );
}

/* -------------------------------------------------------------------------
 * The encounter poster (owner, restyle S1-S6).
 *
 * The active league fixture stops borrowing the shared fixture anatomy and is
 * set as a match poster: the header drops to a label so the two crests can be
 * the loudest thing in the column, the date, hour and field read as one compact
 * block, and the countdown gets a band of its own. Everything it prints still
 * comes from the synced fixture and the shared clock; nothing here decides which
 * match is next, and the shared card below is left exactly as it was (S7).
 * ---------------------------------------------------------------------- */

/**
 * The section's name and its competition wording.
 *
 * These three are the only strings this restyle adds, and they are written in
 * the language the owner dictated (S8). The published name of the competition
 * ("3ª Divisió Grup B") is Catalan and stays byte for byte in the data layer and
 * in every other view, so nothing here reads it back or rewrites it.
 */
const SECTION_TITLE = "Próximo encuentro";
const LEAGUE_TAG = "3ª División";
const LEAGUE_GROUP = "3ª División Grupo B";

const POSTER_NAME =
  "line-clamp-2 text-center text-[0.6875rem] font-extrabold uppercase leading-tight tracking-[0.12em]";

/**
 * The matchup, set so the two sides cannot fall out of line (S2, S6).
 *
 * The crests share the first grid row and the names the second, and the VS sits
 * on the crest row: a rival name that wraps to two lines moves only its own name
 * instead of pushing one crest down against the other. Crests keep the size and
 * the artwork they already had — the club's own vector and the rival's published
 * badge, never a redrawn mark.
 */
function PosterFaces({ fixture }) {
  const rival = opponentOf(fixture);

  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-x-1 gap-y-2.5 sm:gap-x-4">
      <div className="col-start-1 row-start-1 flex justify-center">
        <Crest slug={CLUB_SLUG} size="xl" to={`/equipo/${CLUB_SLUG}`} />
      </div>
      <p className="col-start-2 row-start-1 font-display text-lg uppercase leading-none tracking-[0.18em] text-white/40 sm:text-xl">
        VS
      </p>
      <div className="col-start-3 row-start-1 flex justify-center">
        <Crest slug={rival.slug} size="xl" to={`/equipo/${rival.slug}`} />
      </div>
      <div className="col-start-1 row-start-2 px-0.5">
        <p title={teamFullName(CLUB_SLUG)} className={`${POSTER_NAME} text-white`}>
          {teamFullName(CLUB_SLUG)}
        </p>
      </div>
      <div className="col-start-3 row-start-2 px-0.5">
        <p title={teamFullName(rival.slug)} className={`${POSTER_NAME} text-acf-snow/75`}>
          {teamFullName(rival.slug)}
        </p>
      </div>
    </div>
  );
}

/**
 * When and where, as one compact block instead of a sentence with the date, the
 * hour and the field all at the same volume (S3). The two icons name the two
 * kinds of fact without another label; the hour takes the display face because
 * it is a numeral.
 *
 * The field is plain text, deliberately: the season data carries a field name
 * and nothing else — no street, no coordinates — and the project has no map
 * utility, so an address to open would have to be invented (S9).
 */
function MatchFacts({ fixture }) {
  const day = fixtureSentence(fixture);
  if (!day) return null;

  return (
    <div className="flex flex-col items-center gap-1.5 border-t border-white/10 pt-4">
      <p className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-row">
        <CalendarDays className="h-3.5 w-3.5 shrink-0 text-acf-red" aria-hidden="true" />
        <span className="font-semibold text-white">{day}</span>
        {fixture.time ? (
          <>
            <span aria-hidden="true" className="text-acf-dim">
              ·
            </span>
            <span className="font-display text-lg leading-none tabular-nums text-white">
              {fixture.time}
            </span>
          </>
        ) : null}
      </p>
      {fixture.field ? (
        <p className="flex items-center justify-center gap-2 text-row text-acf-snow/85">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-acf-red" aria-hidden="true" />
          <span>{fixture.field}</span>
        </p>
      ) : null}
    </div>
  );
}

/**
 * The clock in a band of its own (S4).
 *
 * A slightly darker ground with a hairline above and below separates the wait
 * from the poster without putting a card inside a card (S5), and the negative
 * margins run the band to the card's edges so it reads as a band, not a tile.
 * Four equal columns with a hairline between them keep one rhythm at 390, where
 * separators between units used to cost more width than the numbers (S6). The
 * closing line the owner asked for ends the band, and the quote itself is still
 * the club's own `VOICE` line, only set in capitals.
 */
function CountdownBand({ countdown }) {
  const units = [
    { key: "days", value: countdown.days, label: "Días" },
    { key: "hours", value: countdown.hours, label: "Horas" },
    { key: "minutes", value: countdown.minutes, label: "Min" },
    { key: "seconds", value: countdown.seconds, label: "Seg" },
  ];

  return (
    <div className="-mx-5 border-y border-white/10 bg-black/35 px-3 py-4 sm:-mx-6 sm:px-4">
      <div className="grid grid-cols-4 divide-x divide-white/10">
        {units.map((unit) => (
          <div key={unit.key} className="flex flex-col items-center gap-1 px-1">
            <span className="font-display text-[1.75rem] font-medium leading-none tabular-nums text-white sm:text-4xl">
              {String(unit.value).padStart(2, "0")}
            </span>
            <span className="text-[0.5625rem] font-semibold uppercase tracking-[0.2em] text-acf-grey sm:text-micro">
              {unit.label}
            </span>
          </div>
        ))}
      </div>
      <p className="mt-4 border-t border-white/10 pt-3 text-center text-[0.625rem] font-semibold uppercase leading-relaxed tracking-[0.2em] text-acf-snow/80 sm:text-micro">
        {VOICE.sections.nextMatch}
      </p>
    </div>
  );
}

/**
 * The active league fixture, as the poster the section is now about.
 *
 * It keeps every obligation the shared card carried: the `proximo-partido`
 * anchor the navbar points at, the headcount of the active match and nobody
 * else's (S10), the same shared clock, and the same roll-over to the following
 * fixture the second this one kicks off.
 */
function EncounterPoster({ fixture, now, className = "" }) {
  const countdown = splitCountdown(fixture, now);

  return (
    <article
      id="proximo-partido"
      className={`card surface-hero relative flex scroll-mt-24 flex-col overflow-hidden rounded-card border shadow-acf ${className}`}
    >
      {/* The poster's diagonal stays where the brand put it, quieter than before
          so it decorates the header instead of competing with the crests (S5). */}
      <div
        aria-hidden="true"
        className="acf-streaks pointer-events-none absolute inset-x-0 top-0 h-24 opacity-50"
      />

      <header className="relative flex flex-col gap-2 px-5 pt-5 sm:px-6 sm:pt-6">
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
          <h2 className="text-[0.8125rem] font-extrabold uppercase leading-none tracking-[0.18em] text-white sm:text-row sm:tracking-[0.24em]">
            {SECTION_TITLE}
          </h2>
          {/* `ml-auto` keeps the tag on the card's right edge even when it drops
              to its own line at very narrow widths, so the header keeps equal
              edges instead of spilling a chip to the left of the card. */}
          <span className="ml-auto shrink-0 rounded-full border border-acf-red/40 bg-acf-red/10 px-2.5 py-1 text-[0.5625rem] font-bold uppercase leading-none tracking-[0.16em] text-acf-snow sm:text-micro">
            {LEAGUE_TAG}
          </span>
        </div>
        <p className="text-[0.625rem] font-semibold uppercase leading-relaxed tracking-[0.16em] text-acf-grey sm:text-micro">
          {fixture.matchday ? `Jornada ${fixture.matchday} · ${LEAGUE_GROUP}` : LEAGUE_GROUP}
        </p>
      </header>

      <div className="relative flex flex-col gap-5 px-5 pb-5 pt-5 sm:px-6 sm:pb-6">
        <PosterFaces fixture={fixture} />
        <MatchFacts fixture={fixture} />
        {countdown ? <CountdownBand countdown={countdown} /> : null}
        <MatchAttendance fixture={fixture} />
      </div>
    </article>
  );
}

/**
 * The league fixture card, top of the centre column.
 *
 * While its match is the one being counted down, it is the encounter poster
 * above. Otherwise it keeps the shared anatomy the cup card also uses: the
 * reduced "esta semana no hay liga" card, or the quiet card under an active cup
 * match. Either way it is still the `proximo-partido` anchor and it still rolls
 * over to the following fixture on its own.
 */
export default function NextMatchCard({ className = "" }) {
  const now = useFixtureClock();
  const state = fixtureCardState("league", now);

  if (state.active && state.fixture) {
    return <EncounterPoster fixture={state.fixture} now={now} className={className} />;
  }

  return (
    <FixtureCardView
      id="proximo-partido"
      title={SECTION_TITLE}
      competitionKey="league"
      state={state}
      now={now}
      className={className}
    />
  );
}
