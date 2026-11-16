import { useEffect, useMemo, useRef, useState } from "react";
import { playerPhoto } from "../../data/club-record";
import teamData from "../../data/teamData.json";

/** The ball leaves for another player every three seconds and rolls for 1.2s. */
const PASS_MS = 3000;
const ROLL_MS = 1200;

/**
 * How far below a marker's centre the ball sits: the avatar is 48-56px, so
 * ~26px lands on the boots and never on the face.
 */
const FEET_OFFSET = 26;

/**
 * Where each player stands, in percent of the pitch. The pitch is landscape, so
 * the eleven reads along the long side: Chepa on the left goal line, a
 * defensive line, a midfield band and a forward line near the rival area. Loose
 * on purpose — a formation graphic, not a tactical board.
 */
const SPOTS = {
  Chepa: { x: 7, y: 50 },
  Marcos: { x: 22, y: 22 },
  Geri: { x: 25, y: 42 },
  Cristo: { x: 23, y: 62 },
  Ander: { x: 26, y: 80 },
  Gio: { x: 44, y: 17 },
  Rup: { x: 48, y: 37 },
  Nil: { x: 45, y: 54 },
  Martí: { x: 49, y: 71 },
  Dani: { x: 46, y: 88 },
  Albert: { x: 69, y: 24 },
  Jonay: { x: 73, y: 43 },
  Pablo: { x: 70, y: 61 },
  Cristian: { x: 74, y: 79 },
  // Provisional: Genís has no confirmed position yet, so he sits in the empty
  // lane between the midfield band and the forward line. Move him once the
  // club says where he plays.
  Genís: { x: 60, y: 50 },
};

const markers = teamData.squad
  .map((player) => ({
    name: player.name,
    photo: playerPhoto(player.name),
    ...SPOTS[player.name],
  }))
  .filter((marker) => marker.photo && Number.isFinite(marker.x) && Number.isFinite(marker.y));

/** The centre spot: where the ball starts, and where it rests without motion. */
const CENTRE = { x: 50, y: 50 };

/**
 * A unique phase per player without randomising the layout: a 3-5s bob and a
 * negative delay, so no two markers ever move in lockstep.
 */
const bobOf = (index) => ({
  animationDuration: `${(3 + (index % 5) * 0.45).toFixed(2)}s`,
  animationDelay: `-${((index * 0.73) % 4.4).toFixed(2)}s`,
});

/** The ball: a white sphere with the dark patches that make it read as one. */
function Ball() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-full w-full">
      <circle cx="12" cy="12" r="11" fill="#f4f4f5" stroke="rgba(0,0,0,0.45)" strokeWidth="1" />
      <path d="M12 6.7l4.1 3-1.6 4.8H9.5L7.9 9.7z" fill="#0a0a0b" />
      <circle cx="12" cy="3.1" r="1.7" fill="#0a0a0b" />
      <circle cx="3.4" cy="8.6" r="1.5" fill="#0a0a0b" />
      <circle cx="20.6" cy="8.6" r="1.5" fill="#0a0a0b" />
      <circle cx="6.6" cy="20.4" r="1.5" fill="#0a0a0b" />
      <circle cx="17.4" cy="20.4" r="1.5" fill="#0a0a0b" />
    </svg>
  );
}

/** Reduced-motion readers get the same pitch with nobody moving. */
function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(
    () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false,
  );

  useEffect(() => {
    const query = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (!query) return undefined;
    const onChange = (event) => setReduced(event.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  return reduced;
}

/**
 * The pitch lines in pixels, measured from the live frame. Drawing in the
 * frame's own units (instead of stretching a fixed viewBox) keeps the centre
 * circle round and every stroke a true hairline at any card width.
 */
function usePitchGeometry() {
  const frame = useRef(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const node = frame.current;
    if (!node) return undefined;
    const measure = () => {
      const { width, height } = node.getBoundingClientRect();
      setSize({ width: Math.round(width), height: Math.round(height) });
    };
    measure();
    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", measure);
      return () => window.removeEventListener("resize", measure);
    }
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const lines = useMemo(() => {
    const { width, height } = size;
    if (width < 80 || height < 80) return null;

    const pad = 12;
    const left = pad;
    const right = width - pad;
    const top = pad;
    const bottom = height - pad;
    const midY = height / 2;
    const length = right - left;
    const widthSpan = bottom - top;

    // Real 7-a-side proportions, clamped so a phone keeps readable lines:
    // penalty area 16.5/100 deep and 40/64 wide, goal area 5.5/100 and 18/64.
    const boxDepth = Math.min(length * 0.16, 170);
    const boxHeight = widthSpan * 0.62;
    const goalDepth = Math.min(length * 0.055, 60);
    const goalHeight = widthSpan * 0.3;
    const centreRadius = Math.min(widthSpan * 0.145, length * 0.12);
    const spotRadius = 1.8;

    return {
      left,
      right,
      top,
      bottom,
      midY,
      centreX: (left + right) / 2,
      centreRadius,
      spotRadius,
      boxDepth,
      boxHeight,
      goalDepth,
      goalHeight,
      viewBox: `0 0 ${width} ${height}`,
    };
  }, [size]);

  return { frame, lines };
}

/**
 * The squad drawn on a line-only landscape pitch: the club's own cutouts
 * floating in their bands and a ball passing from boots to boots, so the
 * section opens with the team instead of a title. Decorative motion only; the
 * names stay in the markup and the ball never covers a face.
 */
export default function PitchCard({ className = "" }) {
  const [holder, setHolder] = useState(null);
  const reduced = usePrefersReducedMotion();
  const { frame, lines } = usePitchGeometry();

  useEffect(() => {
    if (reduced) {
      setHolder(null);
      return undefined;
    }
    const id = setInterval(() => {
      setHolder((current) => {
        if (markers.length < 2) return current;
        let next = current;
        while (next === current) next = Math.floor(Math.random() * markers.length);
        return next;
      });
    }, PASS_MS);
    return () => clearInterval(id);
  }, [reduced]);

  const target = holder === null ? CENTRE : markers[holder];
  /* Passes aim at the boots, so the ball rests at the feet of the last receiver. */
  const feet = holder === null ? 0 : FEET_OFFSET;
  const ballStyle = reduced
    ? { left: `${CENTRE.x}%`, top: `${CENTRE.y}%`, transition: "none" }
    : {
        left: `${target.x}%`,
        top: `calc(${target.y}% + ${feet}px)`,
        transition: `left ${ROLL_MS}ms ease-in-out, top ${ROLL_MS}ms ease-in-out`,
      };

  return (
    <figure
      aria-label="La plantilla sobre el campo"
      className={`card relative mb-10 overflow-hidden rounded-card border border-acf-line bg-acf-panel shadow-acf ${className}`}
    >
      <div
        ref={frame}
        className="relative h-[300px] w-full sm:h-[460px] lg:h-[500px]"
      >
        {lines ? (
          <svg
            viewBox={lines.viewBox}
            aria-hidden="true"
            className="absolute inset-0 h-full w-full"
          >
            <g fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeLinecap="square">
              {/* Outline and halfway line */}
              <rect
                x={lines.left}
                y={lines.top}
                width={lines.right - lines.left}
                height={lines.bottom - lines.top}
                rx="2"
              />
              <line
                x1={lines.centreX}
                y1={lines.top}
                x2={lines.centreX}
                y2={lines.bottom}
              />

              {/* Centre circle */}
              <circle cx={lines.centreX} cy={lines.midY} r={lines.centreRadius} />

              {/* Penalty and goal areas, one at each end */}
              <rect
                x={lines.left}
                y={lines.midY - lines.boxHeight / 2}
                width={lines.boxDepth}
                height={lines.boxHeight}
              />
              <rect
                x={lines.right - lines.boxDepth}
                y={lines.midY - lines.boxHeight / 2}
                width={lines.boxDepth}
                height={lines.boxHeight}
              />
              <rect
                x={lines.left}
                y={lines.midY - lines.goalHeight / 2}
                width={lines.goalDepth}
                height={lines.goalHeight}
              />
              <rect
                x={lines.right - lines.goalDepth}
                y={lines.midY - lines.goalHeight / 2}
                width={lines.goalDepth}
                height={lines.goalHeight}
              />
            </g>

            {/* Spots are filled: they are points, not lines. */}
            <g fill="rgba(255,255,255,0.32)">
              <circle cx={lines.centreX} cy={lines.midY} r={lines.spotRadius} />
              <circle
                cx={lines.left + lines.boxDepth * 0.68}
                cy={lines.midY}
                r={lines.spotRadius}
              />
              <circle
                cx={lines.right - lines.boxDepth * 0.68}
                cy={lines.midY}
                r={lines.spotRadius}
              />
            </g>
          </svg>
        ) : null}

        {markers.map((marker, index) => (
          <div
            key={marker.name}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{
              left: `${marker.x}%`,
              top: `${marker.y}%`,
              // The receiver greets the ball with a soft one-off pulse; it fires
              // on every holder change because the previous receiver's wrapper
              // drops back to no animation in between.
              animation:
                index === holder && !reduced ? "pitch-receive 900ms ease" : undefined,
            }}
          >
            <img
              src={marker.photo}
              alt={marker.name}
              loading="lazy"
              style={reduced ? undefined : bobOf(index)}
              className={`h-10 w-10 object-contain drop-shadow-[0_8px_12px_rgba(0,0,0,0.6)] sm:h-14 sm:w-14 ${
                reduced ? "" : "anim-sway"
              }`}
            />
          </div>
        ))}

        {/* The ball: one absolutely positioned element whose left/top transition
            is the pass. It starts on the centre spot. */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 sm:h-[18px] sm:w-[18px]"
          style={ballStyle}
        >
          <Ball />
        </span>
      </div>

      <figcaption className="sr-only">
        Los {markers.length} jugadores de la plantilla repartidos por el campo, con el balón
        pasando entre sus pies. Chepa está en la portería.
      </figcaption>
    </figure>
  );
}
