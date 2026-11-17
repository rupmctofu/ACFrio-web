import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import {
  fixtureTimeLabel,
  homeAwayLabel,
  nextFixtures,
  opponentOf,
  teamFullName,
  teamName,
} from "../../data/competition";
import Card from "./Card.jsx";
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

/** Width of the floating card, in px. It is fixed, so the clamp below is exact. */
const PREVIEW_WIDTH = 240;
/** Margin kept from the viewport edge when the card has to be pushed in. */
const PREVIEW_MARGIN = 8;
/** Below this much room above the day, the card opens downwards instead. */
const PREVIEW_FLIP = 220;

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
  "flex h-8 w-8 items-center justify-center rounded-full border border-acf-line bg-acf-panel text-acf-grey transition-colors hover:text-white disabled:opacity-35 disabled:hover:text-acf-grey";

/**
 * One fixture spelled out: the day, who we play, which competition, when and
 * where. It is the content of both the panel under the grid and the card that
 * follows the pointer, so the two can never disagree.
 */
function FixtureInfo({ fixture }) {
  const date = localDay(fixture);
  const rival = opponentOf(fixture);
  const competition = COMPETITION_TAG[fixture.competitionKey] ?? fixture.competitionName;

  return (
    <>
      <p className="text-micro font-semibold uppercase tracking-[0.16em] text-acf-dim">
        {date ? LONG_DAY.format(date) : "Fecha por confirmar"}
      </p>

      <div className="mt-2 flex items-center gap-2.5">
        <Crest slug={rival.slug} size="sm" />
        <p
          title={teamFullName(rival.slug)}
          className="min-w-0 flex-1 text-row font-extrabold uppercase leading-tight tracking-[0.06em] text-white"
        >
          {teamName(rival.slug)}
        </p>
        <span className="shrink-0 rounded-full bg-acf-red px-2 py-0.5 text-micro font-bold uppercase tracking-[0.12em] text-acf-dark">
          {competition}
        </span>
      </div>

      <p className="mt-2 text-micro font-semibold uppercase tracking-[0.14em] text-acf-dim">
        {fixtureTimeLabel(fixture)} · {homeAwayLabel(fixture)} · J{fixture.matchday}
      </p>

      <p className="mt-1 text-micro font-semibold uppercase tracking-[0.14em] text-acf-dim">
        {fixture.field ?? "Campo por confirmar"}
      </p>
    </>
  );
}

/**
 * One month as the calendar people already know how to read: seven columns,
 * Monday first, a cell per day. Days with a fixture are buttons and carry the
 * club red; the chosen day is the filled one. Blank cells pad the first and last
 * week so the columns never shift.
 */
function MonthGrid({ month, selectedKey, onSelect, onPreview, onPreviewEnd }) {
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

        /* Hover, keyboard focus and a tap all raise the same small card: on a
           phone there is no hover, so the press is what opens it. */
        const reveal = (event) =>
          onPreview(fixture, event.currentTarget.getBoundingClientRect());

        return (
          <button
            key={key}
            type="button"
            onClick={(event) => {
              onSelect(key);
              reveal(event);
            }}
            onMouseEnter={reveal}
            onMouseLeave={onPreviewEnd}
            onFocus={reveal}
            onBlur={onPreviewEnd}
            aria-pressed={isSelected}
            aria-label={`${LONG_DAY.format(date)}: ${teamFullName(rival.slug)}, ${fixtureTimeLabel(fixture)}`}
            className={`flex h-9 flex-col items-center justify-center rounded-tile text-figure font-bold tabular-nums transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acf-red ${
              isSelected
                ? "bg-acf-red text-acf-dark"
                : "bg-acf-red/15 text-white hover:bg-acf-red/25"
            }`}
          >
            {day}
            <span
              aria-hidden="true"
              className={`mt-0.5 h-1 w-1 rounded-full ${
                isSelected ? "bg-acf-dark" : "bg-acf-red"
              }`}
            />
          </button>
        );
      })}
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
 * A marked day also raises the same information in a small card next to it
 * (owner, L22), on hover and on tap alike. The card is portalled to `body` and
 * pinned with `position: fixed`, so the card's `overflow-hidden` and any
 * transform above it cannot clip or displace it.
 */
export default function FixturesCard({ className = "" }) {
  const fixtures = useMemo(() => nextFixtures(null), []);
  const months = useMemo(() => buildMonths(fixtures), [fixtures]);

  // Open on the month of the next fixture: the date a player came looking for.
  const initialMonth = useMemo(() => {
    const date = fixtures[0] ? localDay(fixtures[0]) : null;
    if (!date) return 0;
    const index = months.findIndex(
      (month) =>
        month.first.getFullYear() === date.getFullYear() &&
        month.first.getMonth() === date.getMonth(),
    );
    return index < 0 ? 0 : index;
  }, [months, fixtures]);

  const [monthIndex, setMonthIndex] = useState(initialMonth);
  const [selectedKey, setSelectedKey] = useState(() => {
    const date = fixtures[0] ? localDay(fixtures[0]) : null;
    return date ? dayKey(date) : null;
  });
  const [preview, setPreview] = useState(null);

  const month = months[monthIndex] ?? null;

  const selected = useMemo(() => {
    for (const candidate of months) {
      const dayFixtures = candidate.days.get(selectedKey);
      if (dayFixtures?.length) return dayFixtures[0];
    }
    return null;
  }, [months, selectedKey]);

  /* A pinned card cannot follow the page: any scroll or resize closes it rather
     than letting it hang over the wrong row. */
  useEffect(() => {
    if (!preview) return undefined;
    const close = () => setPreview(null);
    window.addEventListener("scroll", close, { passive: true, capture: true });
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("scroll", close, { capture: true });
      window.removeEventListener("resize", close);
    };
  }, [preview]);

  const previewDay = (fixture, rect) => {
    const centered = rect.left + rect.width / 2 - PREVIEW_WIDTH / 2;
    const left = Math.min(
      Math.max(PREVIEW_MARGIN, centered),
      window.innerWidth - PREVIEW_WIDTH - PREVIEW_MARGIN,
    );
    const above = rect.top > PREVIEW_FLIP;

    setPreview({
      fixture,
      left,
      top: above ? rect.top - PREVIEW_MARGIN : rect.bottom + PREVIEW_MARGIN,
      transform: above ? "translateY(-100%)" : undefined,
    });
  };

  /* Moving months moves the selection with it, so the detail always belongs to
     the month on screen. */
  const goToMonth = (direction) => {
    const next = monthIndex + direction;
    if (next < 0 || next >= months.length) return;
    setMonthIndex(next);
    setSelectedKey([...months[next].days.keys()][0] ?? null);
    setPreview(null);
  };

  if (!fixtures.length) {
    return (
      <Card
        title="Calendario"
        hint="Sin partidos programados"
        icon={CalendarDays}
        className={className}
      >
        <p className="px-6 pb-5 text-row text-acf-grey">
          La fuente oficial no publica más partidos programados.
        </p>
      </Card>
    );
  }

  return (
    <Card title="Calendario" id="calendario" icon={CalendarDays} className={className} bodyClassName="flex flex-col">
      <div className="flex items-center justify-between gap-2 px-6 pb-3">
        <p className="text-micro font-bold uppercase tracking-[0.18em] text-white">
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
          onSelect={setSelectedKey}
          onPreview={previewDay}
          onPreviewEnd={() => setPreview(null)}
        />
      </div>

      {selected ? (
        <div className="mx-6 mb-6 mt-4 rounded-tile border border-acf-line-soft bg-white/[0.04] px-3 py-3">
          <FixtureInfo fixture={selected} />
        </div>
      ) : null}

      {/*
       * Decorative duplicate of the panel already on screen and of the button's
       * own label: nothing here is announced, so it never repeats itself to a
       * screen reader. It takes no pointer events either, so a pointer leaving
       * the day always closes it.
       */}
      {preview
        ? createPortal(
            <div
              aria-hidden="true"
              style={{
                top: preview.top,
                left: preview.left,
                transform: preview.transform,
                width: PREVIEW_WIDTH,
              }}
              className="pointer-events-none fixed z-50 rounded-tile border border-acf-line bg-acf-panel-light px-3 py-3 shadow-acf"
            >
              <FixtureInfo fixture={preview.fixture} />
            </div>,
            document.body,
          )
        : null}
    </Card>
  );
}
