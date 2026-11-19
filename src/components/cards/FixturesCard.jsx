import { useMemo, useState } from "react";
import { flushSync } from "react-dom";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import {
  calendarFixtures,
  clubSide,
  fixtureTimeLabel,
  homeAwayLabel,
  league,
  matchdayFixtures,
  nextFixtures,
  opponentOf,
  resultOf,
  scoreLabel,
  teamFullName,
  teamName,
} from "../../data/competition";
import Card from "./Card.jsx";
import { VOICE } from "../../data/copy.js";
import { Crest } from "./Crest.jsx";

const COMPETITION_TAG = { league: "Liga", cup: "Copa" };

/** Monday first: the week the squad actually lives in. */
const WEEKDAYS = ["L", "M", "X", "J", "V", "S", "D"];

const MONTH_FORMAT = new Intl.DateTimeFormat("es-ES", { month: "long", year: "numeric" });
const LONG_DAY = new Intl.DateTimeFormat("es-ES", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

/**
 * The fixture's own calendar day, read from the date string in local time.
 * `new Date("2026-11-17")` would parse as UTC midnight and can land on the day
 * before in a negative offset, so the parts are the authority here.
 */
function localDay(fixture) {
  const [year, month, day] = String(fixture.date ?? "").split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

const dayKey = (date) => `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;

/** A fixture has a result to read only when the source published both numbers. */
const isPlayed = (fixture) => fixture.status === "played" && Boolean(fixture.score);

/**
 * The months that hold at least one fixture, oldest first, each with its days.
 * A calendar only travels where there is something to read: an empty month is
 * not a place to navigate to.
 */
function buildMonths(fixtures) {
  const months = new Map();

  for (const fixture of fixtures) {
    const date = localDay(fixture);
    if (!date) continue;

    const key = `${date.getFullYear()}-${date.getMonth()}`;
    if (!months.has(key)) {
      months.set(key, {
        key,
        first: new Date(date.getFullYear(), date.getMonth(), 1),
        days: new Map(),
      });
    }

    const month = months.get(key);
    const k = dayKey(date);
    if (!month.days.has(k)) month.days.set(k, []);
    month.days.get(k).push(fixture);
  }

  return [...months.values()].sort((a, b) => a.first - b.first);
}

const ARROW_CLASS =
  "flex h-8 w-8 items-center justify-center rounded-full border border-acf-line bg-acf-panel text-acf-grey transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-acf-red disabled:opacity-35 disabled:hover:text-acf-grey";

/**
 * One fixture spelled out: the day, who we play, which competition, when and
 * where. This is the single place a fixture is spelled out — the chosen day
 * updates it and nothing else repeats it.
 *
 * A played day cannot say "when" as if the game were still to come, so the
 * kickoff line gives way to the result: both crests and the score, home on the
 * left so the numbers read in the same order as the badges. The club's side is
 * unknown to this panel once a match has a result — what matters is what the
 * report says.
 */
function FixtureInfo({ fixture }) {
  const date = localDay(fixture);
  const rival = opponentOf(fixture);
  const competition = COMPETITION_TAG[fixture.competitionKey] ?? fixture.competitionName;
  const played = isPlayed(fixture);

  return (
    <>
      <p className="text-micro font-semibold uppercase tracking-[0.16em] text-acf-dim">
        {date ? LONG_DAY.format(date) : "Fecha por confirmar"}
      </p>

      <div className="mt-2 flex items-center gap-2.5">
        {/* Each crest in this panel is the way into that club's page; the panel
            is a description, so the crest is the only thing to press here. */}
        <Crest slug={rival.slug} size="sm" to={`/equipo/${rival.slug}`} />
        <p
          title={teamFullName(rival.slug)}
          className="min-w-0 flex-1 text-row font-extrabold uppercase leading-tight tracking-[0.06em] text-white"
        >
          {teamName(rival.slug)}
        </p>
        <span className="shrink-0 rounded-full bg-acf-red px-2 py-0.5 text-micro font-bold uppercase tracking-[0.12em] text-white">
          {competition}
        </span>
      </div>

      {played ? (
        <>
          {/* Home crest, score, away crest: the report's own order, so the
              numbers are not read against the wrong badge. */}
          <div className="mt-2.5 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
            <div className="flex justify-start">
              <Crest slug={fixture.home.slug} size="sm" to={`/equipo/${fixture.home.slug}`} />
            </div>
            <span
              className={`whitespace-nowrap font-display text-2xl font-medium leading-none tabular-nums ${
                resultOf(fixture) === "win" ? "text-acf-red" : "text-white"
              }`}
            >
              {fixture.score.home}
              <span className="mx-1 text-acf-dim">–</span>
              {fixture.score.away}
            </span>
            <div className="flex justify-end">
              <Crest slug={fixture.away.slug} size="sm" to={`/equipo/${fixture.away.slug}`} />
            </div>
          </div>

          <p className="mt-2 text-micro font-semibold uppercase tracking-[0.14em] text-acf-dim">
            Resultado final · {homeAwayLabel(fixture)} · J{fixture.matchday}
          </p>
        </>
      ) : (
        <p className="mt-2 text-micro font-semibold uppercase tracking-[0.14em] text-acf-dim">
          {fixtureTimeLabel(fixture)} · {homeAwayLabel(fixture)} · J{fixture.matchday}
        </p>
      )}

      <p className="mt-1 text-micro font-semibold uppercase tracking-[0.14em] text-acf-dim">
        {fixture.field ?? "Campo por confirmar"}
      </p>
    </>
  );
}

/**
 * One month as the calendar people already know how to read: seven columns,
 * Monday first, a cell per day. Days with a fixture are buttons; the ones still
 * to come carry the club red, the ones already played sit on the darkest grey
 * the palette has, so a day with a result reads as done at a glance instead of
 * asking for attention it no longer needs. The chosen day is the filled one.
 * Blank cells pad the first and last week so the columns never shift.
 */
function MonthGrid({ month, selectedKey, onSelect }) {
  const year = month.first.getFullYear();
  const monthIndex = month.first.getMonth();
  const length = new Date(year, monthIndex + 1, 0).getDate();
  const lead = (month.first.getDay() + 6) % 7; // Monday-first offset
  const cells = Math.ceil((lead + length) / 7) * 7;
  const today = dayKey(new Date());

  return (
    <div className="grid grid-cols-7 gap-1">
      {WEEKDAYS.map((label) => (
        <span
          key={label}
          aria-hidden="true"
          className="pb-1 text-center text-micro font-semibold uppercase tracking-[0.1em] text-acf-dim"
        >
          {label}
        </span>
      ))}

      {Array.from({ length: cells }, (_, index) => {
        const day = index - lead + 1;
        if (day < 1 || day > length) return <span key={`pad-${index}`} />;

        const date = new Date(year, monthIndex, day);
        const key = dayKey(date);
        const dayFixtures = month.days.get(key) ?? [];
        const isToday = key === today;

        if (!dayFixtures.length) {
          return (
            <span
              key={key}
              className={`flex h-9 items-center justify-center rounded-tile text-figure tabular-nums ${
                isToday ? "font-bold text-white" : "text-acf-grey"
              }`}
            >
              {day}
            </span>
          );
        }

        const fixture = dayFixtures[0];
        const rival = opponentOf(fixture);
        const isSelected = key === selectedKey;
        const played = isPlayed(fixture);

        /*
         * Two weights of the same cell: red while the match is still ahead,
         * dark grey once it has a result. Selecting a played day cannot lift it
         * back to red — the day is over, so the selection only steps it up to
         * the next grey, and only the upcoming days can glow.
         */
        const cellTone = played
          ? isSelected
            ? "bg-acf-panel-light text-white"
            : "bg-acf-dark text-acf-grey hover:bg-acf-panel-light/70 hover:text-white"
          : isSelected
            ? "bg-acf-red text-white"
            : "bg-acf-red/20 text-white hover:bg-acf-red/35";

        const dotTone = played
          ? isSelected
            ? "bg-acf-grey"
            : "bg-acf-dim"
          : isSelected
            ? "bg-acf-dark"
            : "bg-acf-red-soft";

        /* The chosen day drives the panel under the grid; the day carries the
           fixture in its own label, so nothing else has to appear over the
           calendar to say what was pressed. A played day names its result
           there too, the one number a screen reader cannot see in a colour. */
        return (
          <button
            key={key}
            type="button"
            onClick={() => onSelect(key)}
            aria-pressed={isSelected}
            aria-label={`${LONG_DAY.format(date)}: ${teamFullName(rival.slug)}, ${
              played ? scoreLabel(fixture) : fixtureTimeLabel(fixture)
            }`}
            className={`flex h-9 flex-col items-center justify-center rounded-tile text-figure font-bold tabular-nums transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acf-red ${cellTone}`}
          >
            {day}
            <span aria-hidden="true" className={`mt-0.5 h-1 w-1 rounded-full ${dotTone}`} />
          </button>
        );
      })}
    </div>
  );
}

/**
 * The rest of the round, under our own fixture.
 *
 * The league is seven teams, so a matchday is three matches on the same night:
 * small enough to live in the panel the calendar already has, which keeps the
 * reader in one place instead of sending them to a second page. Our match is
 * left out on purpose — it is right above, spelled out in full.
 *
 * A row carries the score when the match is played and the pitch when it is not,
 * because on these nights all three kick off at 22:30 and the time tells nobody
 * anything.
 */
function MatchdayList({ fixture }) {
  const matches = useMemo(() => {
    const round = matchdayFixtures(fixture.competitionKey, fixture.matchday);
    return round.filter((match) => clubSide(match) === null);
  }, [fixture.competitionKey, fixture.matchday]);

  if (!matches.length) return null;

  return (
    <div className="mt-3 border-t border-acf-line-soft pt-2.5">
      <p className="text-[0.625rem] font-semibold uppercase tracking-[0.16em] text-acf-dim">
        Resto de la jornada
      </p>
      <ul className="mt-1.5 divide-y divide-acf-line-soft">
        {matches.map((match) => {
          const played = match.status === "played" && Boolean(match.score);
          return (
            <li
              key={`${match.home.slug}-${match.away.slug}`}
              className="grid grid-cols-[auto_1fr_auto] items-center gap-x-2 gap-y-0.5 py-2"
            >
              <Crest slug={match.home.slug} size="sm" to={`/equipo/${match.home.slug}`} />
              <span
                title={teamFullName(match.home.slug)}
                className="min-w-0 truncate text-row font-semibold text-acf-snow/85"
              >
                {teamName(match.home.slug)}
              </span>
              {/* One score for the pair, spanning both lines, so a name never
                  has to be cut to make room for a figure. */}
              <span
                className={`row-span-2 ${
                  played
                    ? "font-display text-figure leading-none tabular-nums text-white"
                    : "text-[0.5625rem] font-semibold uppercase tracking-[0.1em] text-acf-dim"
                }`}
              >
                {played
                  ? `${match.score.home}–${match.score.away}`
                  : (match.field ?? "Camp").replace("Camp ", "")}
              </span>
              <Crest slug={match.away.slug} size="sm" to={`/equipo/${match.away.slug}`} />
              <span
                title={teamFullName(match.away.slug)}
                className="min-w-0 truncate text-row font-semibold text-acf-snow/85"
              >
                {teamName(match.away.slug)}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/**
 * The club's coming fixtures as a real month calendar.
 *
 * It used to be a horizontal slider of six cards, which read as a list of dates
 * and never showed the shape of the month. The owner asked for the calendar a
 * person already knows how to read (L20): weeks and days, the matchdays marked,
 * and the chosen day spelled out underneath.
 *
 * That panel is now the only place the fixture is spelled out: the floating
 * card that used to follow the pointer over the calendar is gone (owner, L26).
 * A chosen day already rewrites the panel under the grid, and a second copy
 * hanging over the calendar said the same thing twice.
 */
export default function FixturesCard({ className = "" }) {
  /*
   * The calendar draws the season, not only its future (see `calendarFixtures`):
   * a played matchday keeps its day on the grid and its result in the panel.
   */
  const fixtures = useMemo(() => calendarFixtures(), []);
  const months = useMemo(() => buildMonths(fixtures), [fixtures]);

  /*
   * With the played matches in, the first fixture is the oldest one of the
   * season, which is not where anybody starts reading. The anchor is still the
   * next match; once the season has nothing ahead, it is the last one played.
   */
  const anchor = useMemo(
    () => nextFixtures(1)[0] ?? fixtures.at(-1) ?? null,
    [fixtures],
  );

  // Open on the month of the anchor fixture: the date a player came looking for.
  const initialMonth = useMemo(() => {
    const date = anchor ? localDay(anchor) : null;
    if (!date) return 0;
    const index = months.findIndex(
      (month) =>
        month.first.getFullYear() === date.getFullYear() &&
        month.first.getMonth() === date.getMonth(),
    );
    return index < 0 ? 0 : index;
  }, [months, anchor]);

  const [monthIndex, setMonthIndex] = useState(initialMonth);
  const [selectedKey, setSelectedKey] = useState(() => {
    const date = anchor ? localDay(anchor) : null;
    return date ? dayKey(date) : null;
  });

  const month = months[monthIndex] ?? null;

  const selected = useMemo(() => {
    for (const candidate of months) {
      const dayFixtures = candidate.days.get(selectedKey);
      if (dayFixtures?.length) return dayFixtures[0];
    }
    return null;
  }, [months, selectedKey]);

  /*
   * Picking a day rewrites the panel under the grid, and the panel is the thing
   * that changes. Handing that swap to the browser's own view transition lets
   * the old and new panel morph instead of blinking, with no animation library
   * and no timers to clean up. The root is excluded in index.css, so only the
   * panel travels; and the CSS drops the motion when the reader asks for less.
   * Browsers without the API take the plain update.
   */
  const selectDay = (key) => {
    if (typeof document.startViewTransition !== "function") {
      setSelectedKey(key);
      return;
    }
    document.startViewTransition(() => {
      flushSync(() => setSelectedKey(key));
    });
  };

  /* Moving months moves the selection with it, so the detail always belongs to
     the month on screen. */
  const goToMonth = (direction) => {
    const next = monthIndex + direction;
    if (next < 0 || next >= months.length) return;
    setMonthIndex(next);
    setSelectedKey([...months[next].days.keys()][0] ?? null);
  };

  if (!fixtures.length) {
    return (
      <Card
        title="Calendario"
        hint={`Sin partidos programados · ${VOICE.states.noFixtures}`}
        icon={CalendarDays}
        href={league.sources.calendar}
        linkLabel="Abrir el calendario oficial de la liga en CEGARRAF"
        className={className}
      >
        <p className="px-6 pb-5 text-row text-acf-grey">
          La fuente oficial no publica más partidos programados.
        </p>
      </Card>
    );
  }

  return (
    <Card
      title="Calendario"
      hint={VOICE.sections.calendar}
      id="calendario"
      icon={CalendarDays}
      href={league.sources.calendar}
      linkLabel="Abrir el calendario oficial de la liga en CEGARRAF"
      className={className}
      bodyClassName="flex flex-col"
    >
      <div className="flex items-center justify-between gap-2 px-6 pb-3">
        <p className="font-display text-[0.9375rem] font-medium uppercase tracking-[0.14em] text-white">
          {MONTH_FORMAT.format(month.first)}
        </p>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => goToMonth(-1)}
            disabled={monthIndex === 0}
            aria-label="Mes anterior"
            className={ARROW_CLASS}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => goToMonth(1)}
            disabled={monthIndex === months.length - 1}
            aria-label="Mes siguiente"
            className={ARROW_CLASS}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="px-6">
        <MonthGrid
          month={month}
          selectedKey={selectedKey}
          onSelect={selectDay}
        />
      </div>

      {selected ? (
        <div
          style={{ viewTransitionName: "fixture-panel" }}
          className="mx-6 mb-6 mt-4 rounded-tile border border-acf-line-soft bg-white/[0.04] px-3 py-3"
        >
          <FixtureInfo fixture={selected} />
          <MatchdayList fixture={selected} />
        </div>
      ) : null}
    </Card>
  );
}
