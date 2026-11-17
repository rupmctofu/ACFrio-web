import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Images } from "lucide-react";
import Card from "./Card.jsx";
import { VOICE } from "../../data/copy.js";

/** One photo every five seconds: long enough to look at it. */
const SLIDE_MS = 5000;

/**
 * The album the club handed over: ten candid photographs, numbered by the club
 * itself. Nobody is named on them, so the gallery carries one neutral label
 * instead of guessing who is who.
 */
const SHOTS = Array.from({ length: 10 }, (_, index) => ({
  src: `/assets/gallery/galeria-${String(index + 1).padStart(2, "0")}.jpg`,
}));

const LABEL = "El equipo";

/** Reduced-motion readers get no auto-advance: the gallery becomes manual only. */
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
 * The squad album, one photo at a time with a crossfade. It pauses while the
 * reader is on it, and reduced-motion readers keep full control: the same two
 * buttons, no clock behind them.
 */
export default function GalleryCard({ className = "" }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (reduced || paused) return undefined;
    const id = setInterval(() => setIndex((current) => (current + 1) % SHOTS.length), SLIDE_MS);
    return () => clearInterval(id);
  }, [reduced, paused]);

  const step = (direction) =>
    setIndex((current) => (current + direction + SHOTS.length) % SHOTS.length);

  return (
    <Card
      id="galeria"
      title="Galería"
      hint={VOICE.sections.gallery}
      icon={Images}
      className={className}
      bodyClassName="flex flex-col"
    >
      <figure
        aria-label="Galería de fotos del equipo"
        className="relative mt-1 h-[360px] overflow-hidden sm:h-[400px]"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={() => setPaused(false)}
      >
        {SHOTS.map((shot, photoIndex) => (
          <img
            key={shot.src}
            src={shot.src}
            alt=""
            loading={photoIndex === 0 ? "eager" : "lazy"}
            aria-hidden={photoIndex === index ? undefined : true}
            className={`absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-700 ease-out ${
              photoIndex === index ? "opacity-100" : "opacity-0"
            }`}
          />
        ))}

        {/* Scrim: the label and the buttons sit on a photo, so they get their own
            dark ground instead of hoping the shirt behind them is dark. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/85 via-black/35 to-transparent"
        />
        <span className="absolute right-4 top-4 rounded-full bg-black/75 px-2.5 py-1 text-micro font-semibold tabular-nums text-white">
          {index + 1} / {SHOTS.length}
        </span>

        {/* Position dots: ten photographs, ten stops. The active one is the
            only red; the rest follow the pointer only. */}
        <div aria-hidden="true" className="absolute left-4 top-4 flex items-center gap-1.5">
          {SHOTS.map((shot, dotIndex) => (
            <span
              key={shot.src}
              className={`h-1 rounded-full transition-all duration-300 ${
                dotIndex === index ? "w-4 bg-acf-red" : "w-1 bg-white/40"
              }`}
            />
          ))}
        </div>

        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4">
          <p className="min-w-0 truncate text-row font-extrabold uppercase tracking-[0.08em] text-white">
            {LABEL}
          </p>
          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={() => step(-1)}
              aria-label="Foto anterior"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-white/25 bg-black/60 text-white transition-colors hover:bg-black/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-acf-red"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => step(1)}
              aria-label="Foto siguiente"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-white/25 bg-black/60 text-white transition-colors hover:bg-black/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-acf-red"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

      </figure>
    </Card>
  );
}
