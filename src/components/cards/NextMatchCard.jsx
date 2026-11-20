import { Fragment, useSyncExternalStore } from "react";
import {
  CLUB_SLUG,
  club,
  fixtureCardState,
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
 * independent timers could disagree for a moment and put the hero surface and
 * the headcount on two cards at once. The interval belongs to this module: it
 * starts with the first card that mounts, feeds every mounted card the same
 * instant, and stops when the last one unmounts. That also rolls the page over
 * to the following fixture without a reload the second a kickoff passes.
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

/**
 * How far away a match is, in words, for the cards that do not print the date
 * twice: the active card says when it is played, the quiet ones also say how
 * long is left (S7, S8).
 */
export function daysLabel(days) {
  if (days == null) return null;
  if (days <= 0) return "Hoy";
  return days === 1 ? "Queda 1 día" : `Quedan ${days} días`;
}

/* -------------------------------------------------------------------------
 * The fixture cards (owner's mockup, drawn in Photoshop).
 *
 * The owner drew the next fixture with less on it than the card had: one head,
 * one gradient, the two crests with the date between them, the headcount on
 * that same gradient, and a dark strip of the people who are not coming. The
 * countdown, the kickoff sentence, the field and the "El fútbol nos debe una"
 * line are gone from the active card because the drawing does not have them.
 * Everything the cards still print comes from the synced fixture and the shared
 * clock; nothing here decides which match is next (S10).
 * ---------------------------------------------------------------------- */

/**
 * The section's name and the competition wording.
 *
 * These are the only strings this file adds, in the language the owner dictated
 * (S8). The published name of the league ("3ª Divisió Grup B") is Catalan and
 * stays byte for byte in the data layer; the card prints the owner's Spanish
 * label instead. The cup keeps the name the source publishes, because the owner
 * never gave a short form for it.
 */
const SECTION_TITLE = "Próximo encuentro";
const LEAGUE_TAG = "3ª División";
const LEAGUE_GROUP = "3ª División Grupo B";
const CUP_TAG = "Copa";

/*
 * ===== The one surface of the active card =====
 *
 * The active fixture is the one card that carries a photograph: the owner's
 * night pitch, edge to edge, under a single red-to-black veil. Both layers are
 * children of the article and both are absolutely positioned, so the head, the
 * crests and the headcount all sit on the same painted element and there is no
 * boundary between them to line up — no padding, gap or wrapper can open the
 * seam the stacked-panel version used to show.
 *
 * The veil is the gradient the card already had, kept as one utility: brand red
 * at the very top behind the head, a long dissolve through near-dark in the
 * middle, and a nearly solid base at the foot so the headcount still reads. It
 * stops short of full opacity down there on purpose: the photograph has to
 * survive it, or it is not a photograph any more.
 */
const HERO_SURFACE = "border-acf-red/30 bg-acf-dark shadow-acf";

/**
 * The photograph and the two widths exported for it.
 *
 * `sizes` describes the card, not the viewport: the centre column holds it at
 * roughly 520 px on a desktop, a little less on a tablet, and full width on a
 * phone. A phone therefore picks the 900 export and a desktop the 1536 one,
 * which is the only reason two widths exist at all.
 */
const HERO_PHOTO = {
  src: "/assets/backgrounds/pitch-nocturno-900.webp",
  srcSet:
    "/assets/backgrounds/pitch-nocturno-900.webp 900w, /assets/backgrounds/pitch-nocturno-1536.webp 1536w",
  sizes: "(min-width: 1024px) 520px, 100vw",
};

const HERO_VEIL =
  "pointer-events-none absolute inset-0 bg-linear-to-b from-acf-red/70 via-acf-dark/45 via-42% to-acf-dark/92";

/** The dormant and the rested cards: the plain panel, no red, no photograph. */
const BASE_SURFACE = "border-acf-line bg-acf-panel shadow-acf";

/* Three formatters instead of one, joined by a space: the owner's line is
   "JUEVES 26 NOV" — no comma — while each part still comes from the browser's
   own Spanish table, so the month abbreviation follows the locale. */
const weekdayFormatter = new Intl.DateTimeFormat("es-ES", { weekday: "long" });
const dayFormatter = new Intl.DateTimeFormat("es-ES", { day: "numeric" });
const monthFormatter = new Intl.DateTimeFormat("es-ES", { month: "short" });

function fixtureDayOf(fixture) {
  if (!fixture?.date) return null;
  const when = new Date(`${fixture.date}T${fixture.time ?? "00:00"}:00`);
  if (Number.isNaN(when.getTime())) return null;
  return `${weekdayFormatter.format(when)} ${dayFormatter.format(when)} ${monthFormatter.format(when)}`;
}

/** "22:30" -> "22.30H", the hour as the owner writes it; anything else as published. */
function fixtureHourOf(fixture) {
  const time = fixture?.time;
  if (!time) return null;
  const parts = /^(\d{1,2}):(\d{2})$/.exec(time);
  return parts ? `${parts[1]}.${parts[2]}H` : time;
}

/** The date and the hour as the two tight white lines of the mockup. */
function DateLines({ fixture, align = "center", compact = false, muted = false }) {
  const day = fixtureDayOf(fixture);
  const hour = fixtureHourOf(fixture);
  if (!day && !hour) return null;

  /* The dormant card greys its whole face, date included: a white line is the
     one thing that keeps a switched-off card looking alive. */
  const ink = muted ? "text-acf-grey" : "text-white";

  /*
   * `compact` is the matchup's copy: it starts one step smaller and only grows
   * when the card itself is wide enough (the faces block is a container), which
   * is what keeps "MIÉRCOLES 16 DIC" on a single line in a 348 px card as well
   * as in a 520 px one.
   */
  const daySize = compact
    ? "text-[0.6875rem] @min-[24rem]:text-row"
    : "text-row";
  const hourSize = compact
    ? "text-[1rem] @min-[24rem]:text-[1.125rem]"
    : "text-[1.0625rem]";

  return (
    <p
      className={`flex flex-col gap-1 ${
        align === "center" ? "items-center text-center" : "items-start"
      }`}
    >
      {day ? (
        <span
          className={`${daySize} font-extrabold uppercase leading-none tracking-[0.02em] ${ink}`}
        >
          {day}
        </span>
      ) : null}
      {hour ? (
        <span
          className={`${hourSize} font-display font-medium leading-none tabular-nums ${ink}`}
        >
          {hour}
        </span>
      ) : null}
    </p>
  );
}

/**
 * The round this fixture belongs to, under the card's title.
 *
 * It reads the matchday from the fixture and the name from either the owner's
 * league label or the published cup name; the card never composes a competition
 * name of its own.
 */
function roundLineFor(fixture, competitionKey) {
  if (!fixture) return null;
  const name =
    competitionKey === "cup" ? (fixture.competitionName ?? CUP_TAG) : LEAGUE_GROUP;
  return fixture.matchday ? `Jornada ${fixture.matchday} · ${name}` : name;
}

/**
 * The head of the card, exactly as drawn: the section name in white, uppercase
 * and widely tracked, the competition chip on the right edge, and the round
 * under it. It carries no dot and no icon — the drawing has neither.
 */
function CardHead({ title, competitionKey, fixture, tone }) {
  const hero = tone === "hero";
  const dormant = tone === "dormant";
  const round = roundLineFor(fixture, competitionKey);

  return (
    /* `relative` because the active card paints a photograph under this head;
       on the other treatments it changes nothing. */
    <header className="relative flex flex-col gap-2 px-5 pb-4 pt-5 sm:px-6 sm:pt-6">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <h2
          className={`text-[0.8125rem] font-extrabold uppercase leading-none tracking-[0.2em] sm:text-row sm:tracking-[0.26em] ${
            dormant ? "text-acf-grey" : "text-white"
          }`}
        >
          {title}
        </h2>
        {fixture ? (
          // `ml-auto` keeps the chip on the card's right edge even when it
          // drops to its own line at very narrow widths.
          <span
            className={`ml-auto shrink-0 rounded-full border px-2.5 py-1 text-[0.5625rem] font-bold uppercase leading-none tracking-[0.16em] sm:text-micro ${
              hero
                ? "border-acf-snow/30 bg-acf-dark/35 text-white"
                : dormant
                  ? "border-acf-line bg-white/[0.02] text-acf-grey/70"
                  : "border-acf-line bg-white/[0.04] text-acf-grey"
            }`}
          >
            {competitionKey === "cup" ? CUP_TAG : LEAGUE_TAG}
          </span>
        ) : null}
      </div>
      {round ? (
        // Snow rather than grey on the red head: the grey token loses its
        // contrast the moment the gradient is at full strength under it.
        <p
          className={`text-[0.625rem] font-semibold uppercase leading-relaxed tracking-[0.16em] sm:text-micro ${
            hero ? "text-acf-snow/70" : dormant ? "text-acf-grey/70" : "text-acf-grey"
          }`}
        >
          {round}
        </p>
      ) : null}
    </header>
  );
}

const POSTER_NAME =
  "line-clamp-2 text-center text-[0.6875rem] font-extrabold uppercase leading-tight tracking-[0.12em]";

/**
 * The matchup as the owner drew it (S2, S6).
 *
 * Two crests at the edges with their club names under them, and one centred
 * column between them: the competition word in the brand red, "VS" in grey and
 * the date and hour as two tight white lines. The crests share the first grid
 * row and the names the second, while the middle column spans both, so a rival
 * name that wraps to two lines moves only its own name instead of pushing one
 * crest down against the other. Crests keep the artwork and the size they
 * already had — the club's own vector and the rival's published badge.
 *
 * The middle column is a container query, not a breakpoint: this card measured
 * 493 px wide in the centre column at 1440 and 382 px at 1024, so the viewport
 * says nothing about whether the date fits between two 112 px crests. The query
 * is `24rem` of card, the same threshold the date used before, and it is the
 * only threshold here.
 *
 * Above it the middle column is drawn exactly as in the mockup. Below it that
 * column cannot sit between the crests any more: pushed down it would leave a
 * dead gap under the club names and print a "VS" with nothing on either side of
 * it, which says nothing to anybody. So under 24rem the column is not rendered
 * at all and the competition, the date and the hour collapse into one meta line
 * directly under the names, where they still read in the order the owner writes
 * them. That is the only difference between the two layouts.
 */
function MatchupFaces({ fixture, competitionKey, tone }) {
  const hero = tone === "hero";
  const dormant = tone === "dormant";
  const rival = opponentOf(fixture);
  const crest = hero ? "xl" : "lg";

  const competitionWord = competitionKey === "cup" ? "Copa" : "Liga";
  /*
   * The meta line keeps the order of the column it replaces — competition, then
   * date, then hour — and drops a part the fixture does not publish instead of
   * printing an empty middot for it.
   */
  const metaParts = [
    competitionWord,
    fixtureDayOf(fixture),
    fixtureHourOf(fixture),
  ].filter(Boolean);

  return (
    <div className="@container">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-x-2 gap-y-2.5 sm:gap-x-4">
        <div
          className={`col-start-1 row-start-1 flex justify-center ${
            dormant ? "opacity-45 grayscale" : ""
          }`}
        >
          <Crest slug={CLUB_SLUG} size={crest} to={`/equipo/${CLUB_SLUG}`} />
        </div>
        {/*
         * Only rendered once the card is 24rem wide, because only then do the
         * crests leave room for it between them. Under that it is gone, not
         * restyled: a hidden block cannot open a gap.
         */}
        <div className="hidden flex-col items-center justify-center gap-1.5 text-center @min-[24rem]:col-span-1 @min-[24rem]:col-start-2 @min-[24rem]:row-span-2 @min-[24rem]:row-start-1 @min-[24rem]:flex">
          <p
            className={`text-micro font-bold uppercase leading-none tracking-[0.24em] ${
              dormant ? "text-acf-grey/80" : "text-acf-red"
            }`}
          >
            {competitionWord}
          </p>
          <p
            className={`font-display text-lg font-medium uppercase leading-none tracking-[0.18em] ${
              dormant ? "text-acf-grey/60" : "text-acf-grey"
            }`}
          >
            VS
          </p>
          <DateLines fixture={fixture} compact muted={dormant} />
        </div>
        {/*
         * The narrow-card replacement: one line under the club names, in the
         * same size and tracking as the names above it so the three of them
         * read as one block. It sits on grid row 3 with nothing added to the
         * grid gap, which is what removes the dead space the stacked column
         * used to leave behind. Separators are middots, and the competition
         * keeps the brand red it has on the wide card.
         */}
        <p className="col-span-3 col-start-1 row-start-3 text-balance text-center text-micro font-bold uppercase leading-relaxed tracking-[0.12em] text-white @min-[24rem]:hidden">
          {metaParts.map((part, index) => (
            <Fragment key={part}>
              {index === 0 ? null : (
                <span className="text-acf-grey"> · </span>
              )}
              <span
                className={
                  index === 0
                    ? dormant
                      ? "text-acf-grey/80"
                      : "text-acf-red"
                    : undefined
                }
              >
                {part}
              </span>
            </Fragment>
          ))}
        </p>
        <div
          className={`col-start-3 row-start-1 flex justify-center ${
            dormant ? "opacity-45 grayscale" : ""
          }`}
        >
          <Crest slug={rival.slug} size={crest} to={`/equipo/${rival.slug}`} />
        </div>
        <div className="col-start-1 row-start-2 px-0.5">
          <p
            title={teamFullName(CLUB_SLUG)}
            className={`${POSTER_NAME} ${dormant ? "text-acf-grey" : "text-white"}`}
          >
            {teamFullName(CLUB_SLUG)}
          </p>
        </div>
        <div className="col-start-3 row-start-2 px-0.5">
          <p
            title={teamFullName(rival.slug)}
            className={`${POSTER_NAME} ${
              dormant
                ? "text-acf-grey/80"
                : hero
                  ? "text-acf-snow/75"
                  : "text-acf-snow"
            }`}
          >
            {teamFullName(rival.slug)}
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * One fixture card. Both centre-column cards use this anatomy, so the cup card
 * and the league card can never drift apart. Three treatments:
 *
 *   hero    — the active card: the photograph and its veil, the crests with the
 *             date between them and the headcount of this match (S10).
 *   rest    — the league card when its next match is more than a week away
 *             (S7): no red at all, flat greys, a smaller body and the note that
 *             says so. Every line is a full-strength token, because a legible
 *             flat card is the point: fading it is what the owner asked to
 *             stop.
 *   dormant — the card that is not the next match. Everything on it goes grey,
 *             crests and names included, so the eye lands on the fixture the
 *             squad actually signs up for and the other one reads as switched
 *             off instead of merely quieter.
 */
export function FixtureCardView({
  id,
  title,
  competitionKey,
  state,
  className = "",
}) {
  const { fixture, active, resting, days } = state;
  const tone = active ? "hero" : resting ? "rest" : "dormant";
  const hero = tone === "hero";

  return (
    <article
      id={id}
      className={`card relative flex scroll-mt-24 flex-col overflow-hidden rounded-card border ${
        hero ? HERO_SURFACE : BASE_SURFACE
      } ${className}`}
    >
      {/* The photograph and the veil it sits under: content is positioned, so
          it always paints on top of both without a z-index anywhere. */}
      {hero ? (
        <>
          <img
            {...HERO_PHOTO}
            alt=""
            aria-hidden="true"
            decoding="async"
            className="pointer-events-none absolute inset-0 h-full w-full object-cover"
          />
          <div aria-hidden="true" className={HERO_VEIL} />
        </>
      ) : null}

      <CardHead
        title={title}
        competitionKey={competitionKey}
        fixture={fixture}
        tone={tone}
      />

      {!fixture ? (
        <div className="relative px-5 pb-6 pt-1 sm:px-6">
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
         * is: a reduced card is not a card without information. It keeps the
         * same structure — head, then the two lines of the date — set flush
         * left, because there is no matchup to centre it between.
         */
        <div className="relative flex flex-col gap-3 px-5 pb-5 pt-1 sm:px-6">
          <p className="text-[0.9375rem] font-extrabold uppercase leading-tight tracking-[0.04em] text-white">
            Esta semana no hay liga
          </p>
          <p className="text-row font-semibold leading-relaxed text-acf-snow">
            Próximo partido: {club.name} vs {teamFullName(opponentOf(fixture).slug)}
          </p>
          <DateLines fixture={fixture} align="start" />
          {days == null ? null : (
            <p className="text-micro font-semibold uppercase tracking-[0.16em] text-acf-grey">
              {daysLabel(days)}
            </p>
          )}
        </div>
      ) : (
        /* The body paints nothing: on the active card this is the sheet the
           gradient already laid down, and the headcount sits on it. */
        <div
          className={
            hero
              ? "relative flex flex-col gap-5 px-5 pb-6 pt-1 sm:px-6"
              : "relative flex flex-col gap-4 px-5 pb-5 pt-1 sm:px-6"
          }
        >
          <MatchupFaces fixture={fixture} competitionKey={competitionKey} tone={tone} />
          {hero || days == null ? null : (
            <p className="text-center text-micro font-semibold uppercase tracking-[0.16em] text-acf-grey">
              {daysLabel(days)}
            </p>
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

/**
 * The league fixture card, top of the centre column.
 *
 * While its match is the one being counted down it is the active card above;
 * otherwise it keeps the dormant or the reduced treatment, and both keep the
 * same head and the same matchup. Either way it is still the `proximo-partido`
 * anchor and it still rolls over to the following fixture on its own.
 */
export default function NextMatchCard({ className = "" }) {
  const now = useFixtureClock();
  const state = fixtureCardState("league", now);

  return (
    <FixtureCardView
      id="proximo-partido"
      title={SECTION_TITLE}
      competitionKey="league"
      state={state}
      className={className}
    />
  );
}
