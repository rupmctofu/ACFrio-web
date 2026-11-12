import { useEffect, useRef } from "react";
import { CalendarDays } from "lucide-react";
import {
  CLUB_SLUG,
  fixtureDateLabel,
  fixtureTimeLabel,
  nextFixtures,
  teamFullName,
  teamName,
} from "../../data/competition";
import Card from "./Card.jsx";
import { Crest } from "./Crest.jsx";

const COMPETITION_TAG = { league: "Liga", cup: "Copa" };

/**
 * Where the slider can still travel. The list snaps card by card, so it rests
 * one padding gutter in from each end instead of exactly at 0 / max: the ends
 * are measured from the live gutter, never from a magic number.
 */
function sliderBounds(node, gutter) {
  const max = Math.max(0, node.scrollWidth - node.clientWidth);
  const edge = Math.min(gutter, max);
  return { start: edge, end: Math.max(max - edge, 0) };
}

/** True when the slider can still move in the direction of the wheel. */
function canSlide(node, deltaY, gutter) {
  if (deltaY === 0) return false;
  const { start, end } = sliderBounds(node, gutter);
  if (end <= start) return false; // no travel left: never swallow the gesture
  return deltaY < 0 ? node.scrollLeft > start : node.scrollLeft < end;
}

/** Move the slider by one wheel step, clamped to its ends. */
function slideBy(node, deltaY) {
  const max = Math.max(0, node.scrollWidth - node.clientWidth);
  node.scrollLeft = Math.min(max, Math.max(0, node.scrollLeft + deltaY));
}

function FixtureSlide({ fixture }) {
  return (
    <li className="min-w-[13rem] snap-start rounded-tile border border-acf-line-soft bg-acf-panel-light/60 p-4">
      <p className="text-row font-extrabold uppercase leading-none tracking-[0.1em] text-white">
        {fixtureDateLabel(fixture)}
      </p>
      <p className="mt-2 text-micro font-semibold uppercase tracking-[0.14em] text-acf-dim">
        {fixtureTimeLabel(fixture)} · J{fixture.matchday} ·{" "}
        {COMPETITION_TAG[fixture.competitionKey] ?? fixture.competitionName}
      </p>

      <div className="mt-3 space-y-2">
        {[fixture.home, fixture.away].map((team) => (
          <div key={team.slug} className="flex items-center gap-2">
            <Crest slug={team.slug} size="sm" />
            <span
              title={teamFullName(team.slug)}
              className={`truncate text-[12px] font-bold uppercase tracking-[0.04em] ${
                team.slug === CLUB_SLUG ? "text-acf-red" : "text-acf-snow/60"
              }`}
            >
              {teamName(team.slug)}
            </span>
          </div>
        ))}
      </div>

      <p className="mt-3 truncate text-micro font-semibold uppercase tracking-[0.14em] text-acf-dim">
        {fixture.field ?? "Campo por confirmar"}
      </p>
    </li>
  );
}

/** Horizontal slider of the club's following fixtures with their real dates. */
export default function FixturesCard({ className = "" }) {
  const fixtures = nextFixtures(6);
  const slider = useRef(null);
  /* Leading gutter of the list, measured once: it is the rest offset of the end. */
  const gutter = useRef(0);

  /*
   * A plain vertical wheel over the slider moves it horizontally. React
   * registers `wheel` at the root as a passive listener, so `preventDefault()`
   * inside the JSX handler would be ignored: the handler only scrolls, and a
   * non-passive native listener owns the decision of whether the gesture
   * belongs to the slider or to the page.
   */
  const handleWheel = (event) => {
    const node = slider.current;
    if (node && canSlide(node, event.deltaY, gutter.current)) {
      slideBy(node, event.deltaY);
    }
  };

  useEffect(() => {
    const node = slider.current;
    if (!node) return undefined;
    gutter.current = parseFloat(getComputedStyle(node).paddingLeft) || 0;
    const claimGesture = (event) => {
      // Only swallow the gesture while the slider can still move: at either end
      // the page keeps scrolling normally, so the slider never traps the reader.
      if (canSlide(node, event.deltaY, gutter.current)) event.preventDefault();
    };
    node.addEventListener("wheel", claimGesture, { passive: false });
    return () => node.removeEventListener("wheel", claimGesture);
  }, []);

  return (
    <Card
      title="Calendario"
      hint={fixtures.length ? undefined : "Sin partidos programados"}
      icon={CalendarDays}
      className={className}
      bodyClassName="flex"
    >
      {fixtures.length ? (
        <ul
          ref={slider}
          tabIndex={0}
          aria-label="Siguientes partidos"
          onWheel={handleWheel}
          className="flex w-full snap-x snap-mandatory gap-3 overflow-x-auto px-6 pb-6 pt-1 squad-scrollbar focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-acf-red/60"
        >
          {fixtures.map((fixture) => (
            <FixtureSlide
              key={`${fixture.competitionKey}-${fixture.matchday}-${fixture.date}`}
              fixture={fixture}
            />
          ))}
        </ul>
      ) : (
        <p className="px-6 py-4 text-row text-acf-grey">
          La fuente oficial no publica más partidos programados.
        </p>
      )}
    </Card>
  );
}
