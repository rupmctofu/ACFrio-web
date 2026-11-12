import { useEffect, useRef, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
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

/** Quiet time after the last wheel tick before the list settles onto a card. */
const SETTLE_MS = 180;

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

/**
 * The resting positions of the list, in its own scroll coordinates: one stop per
 * card, measured from the live rectangles so a resize needs no bookkeeping.
 */
function snapStops(node) {
  const origin = node.getBoundingClientRect().left;
  return [...node.children].map(
    (child) => child.getBoundingClientRect().left - origin + node.scrollLeft,
  );
}

/** One card of travel, measured from the stops rather than from a class name. */
function cardStep(node) {
  const stops = snapStops(node);
  const gap = stops.length > 1 ? stops[1] - stops[0] : 0;
  return gap > 0 ? gap : Math.max(1, Math.round(node.clientWidth * 0.8));
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

const ARROW_CLASS =
  "flex h-8 w-8 items-center justify-center rounded-full border border-acf-line bg-acf-panel text-acf-grey transition-colors hover:text-white disabled:opacity-35 disabled:hover:text-acf-grey";

/** Horizontal slider of the club's following fixtures with their real dates. */
export default function FixturesCard({ className = "" }) {
  const fixtures = nextFixtures(6);
  const slider = useRef(null);
  /* Leading gutter of the list, measured once: it is the rest offset of the end. */
  const gutter = useRef(0);
  /* Which way the current gesture is going, so the list settles that way. */
  const gesture = useRef(0);
  const settleTimer = useRef(0);
  const dragState = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [edges, setEdges] = useState({ back: false, forward: false });

  /*
   * The list snaps card by card, and a mandatory snap re-snaps every scroll the
   * slider makes. A single wheel notch is ~100px, the card step is ~220px, so
   * the snap used to pull the list straight back to the card it came from: the
   * gesture was consumed and nothing moved. Holding the snap off while a
   * gesture is live makes the list follow the pointer and the wheel pixel by
   * pixel; putting it back afterwards makes it land on a card, and settling in
   * the gesture's own direction means one notch always advances one card.
   */
  const holdSnap = (node) => {
    node.style.scrollSnapType = "none";
  };

  const settle = (node) => {
    window.clearTimeout(settleTimer.current);
    const direction = gesture.current;
    gesture.current = 0;

    if (direction !== 0) {
      const current = node.scrollLeft;
      const stops = snapStops(node);
      const reachable = direction > 0
        ? stops.find((stop) => stop > current + 1)
        : [...stops].reverse().find((stop) => stop < current - 1);
      if (reachable !== undefined) node.scrollLeft = reachable;
    }

    node.style.scrollSnapType = "";
  };

  const syncEdges = () => {
    const node = slider.current;
    if (!node) return;
    setEdges({
      back: canSlide(node, -1, gutter.current),
      forward: canSlide(node, 1, gutter.current),
    });
  };

  /*
   * A plain vertical wheel over the slider moves it horizontally. React
   * registers `wheel` at the root as a passive listener, so `preventDefault()`
   * inside the JSX handler would be ignored: the handler only scrolls, and a
   * non-passive native listener owns the decision of whether the gesture
   * belongs to the slider or to the page.
   */
  const handleWheel = (event) => {
    const node = slider.current;
    if (!node || !canSlide(node, event.deltaY, gutter.current)) return;

    holdSnap(node);
    gesture.current = event.deltaY > 0 ? 1 : -1;
    slideBy(node, event.deltaY);
    window.clearTimeout(settleTimer.current);
    settleTimer.current = window.setTimeout(() => settle(node), SETTLE_MS);
  };

  /* Pointer drag: the same held snap, with the list pinned to the pointer. */
  const handlePointerDown = (event) => {
    const node = slider.current;
    if (!node || event.pointerType === "touch") return; // touch already scrolls
    dragState.current = { x: event.clientX, left: node.scrollLeft };
    gesture.current = 0;
    holdSnap(node);
    setDragging(true);
    try {
      node.setPointerCapture?.(event.pointerId);
    } catch {
      // A stale or synthetic pointer id has nothing to capture: the drag still
      // works, it just may lose the pointer if it leaves the list.
    }
  };

  const handlePointerMove = (event) => {
    const node = slider.current;
    const state = dragState.current;
    if (!node || !state) return;
    const travelled = event.clientX - state.x;
    if (travelled === 0) return;
    gesture.current = travelled < 0 ? 1 : -1; // dragging left advances the list
    node.scrollLeft = state.left - travelled;
  };

  const endDrag = () => {
    const node = slider.current;
    if (!node || !dragState.current) return;
    dragState.current = null;
    setDragging(false);
    settle(node);
  };

  const moveByCard = (direction) => {
    const node = slider.current;
    if (!node) return;
    node.scrollBy({ left: direction * cardStep(node), behavior: "smooth" });
  };

  useEffect(() => {
    const node = slider.current;
    if (!node) return undefined;

    gutter.current = parseFloat(getComputedStyle(node).paddingLeft) || 0;
    syncEdges();

    const claimGesture = (event) => {
      // Only swallow the gesture while the slider can still move: at either end
      // the page keeps scrolling normally, so the slider never traps the reader.
      if (canSlide(node, event.deltaY, gutter.current)) event.preventDefault();
    };

    node.addEventListener("wheel", claimGesture, { passive: false });
    node.addEventListener("scroll", syncEdges, { passive: true });
    window.addEventListener("resize", syncEdges);

    return () => {
      node.removeEventListener("wheel", claimGesture);
      node.removeEventListener("scroll", syncEdges);
      window.removeEventListener("resize", syncEdges);
      window.clearTimeout(settleTimer.current);
    };
  }, []);

  return (
    <Card
      title="Calendario"
      hint={fixtures.length ? undefined : "Sin partidos programados"}
      icon={CalendarDays}
      className={className}
      bodyClassName="flex flex-col"
    >
      {fixtures.length ? (
        <>
          <ul
            ref={slider}
            tabIndex={0}
            aria-label="Siguientes partidos"
            onWheel={handleWheel}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            className={`flex w-full cursor-grab snap-x snap-mandatory gap-3 overflow-x-auto px-6 pb-4 pt-1 squad-scrollbar focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-acf-red/60 ${
              dragging ? "select-none active:cursor-grabbing" : ""
            }`}
          >
            {fixtures.map((fixture) => (
              <FixtureSlide
                key={`${fixture.competitionKey}-${fixture.matchday}-${fixture.date}`}
                fixture={fixture}
              />
            ))}
          </ul>

          <div className="mt-auto flex items-center justify-between gap-2 px-6 pb-5">
            <p className="text-micro font-semibold uppercase tracking-[0.16em] text-acf-dim">
              Desliza
            </p>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => moveByCard(-1)}
                disabled={!edges.back}
                aria-label="Partidos anteriores"
                className={ARROW_CLASS}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => moveByCard(1)}
                disabled={!edges.forward}
                aria-label="Partidos siguientes"
                className={ARROW_CLASS}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </>
      ) : (
        <p className="px-6 py-4 text-row text-acf-grey">
          La fuente oficial no publica más partidos programados.
        </p>
      )}
    </Card>
  );
}
