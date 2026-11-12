import { useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import teamData from "../data/teamData.json";
import PitchCard from "./cards/PitchCard.jsx";

const POSITIONS = ["Todos", "Portero", "Defensa", "Medio", "Delantero"];

/** Position chips stay neutral: the club red is the only accent in the system. */
const POSITION_LABEL = {
  Portero: "POR",
  Defensa: "DEF",
  Medio: "MED",
  Delantero: "DEL",
};

function PlayerCard({ player }) {
  // Position and shirt number are shown only when the club has confirmed them.
  const pos = player.position ? POSITION_LABEL[player.position] : null;

  return (
    <article
      data-card
      className="group relative shrink-0 snap-start min-w-[19rem] w-[78vw] max-w-[21rem] overflow-hidden rounded-card border border-acf-line bg-acf-panel transition-all duration-300 hover:-translate-y-1 hover:border-white/20 hover:shadow-acf"
    >
      {/* Shirt number as a watermark, only when the club has confirmed it */}
      {player.number ? (
        <span className="pointer-events-none absolute -right-3 bottom-0 select-none font-display text-[9rem] leading-none text-white/[0.04] transition-colors duration-500 group-hover:text-white/[0.07]">
          {player.number}
        </span>
      ) : null}

      <div className="relative flex items-center justify-between px-5 pt-5">
        {pos ? (
          <span className="rounded-full border border-acf-line px-3 py-1.5 text-micro font-semibold uppercase tracking-[0.18em] text-acf-snow/70">
            {pos}
          </span>
        ) : (
          <span />
        )}
        {player.number ? (
          <span className="font-display text-xl leading-none text-acf-dim">
            #{player.number}
          </span>
        ) : null}
      </div>

      <div className="relative mt-2 flex items-center justify-center">
        <div className="relative flex h-72 w-full items-end justify-center sm:h-80">
          <img
            src={player.photo}
            alt={player.name}
            loading="lazy"
            className="anim-bob relative max-h-full w-auto object-contain"
            style={{
              // Staggered per card so the row breathes out of phase, like the pitch.
              animationDuration: `${3 + (player.id % 4) * 0.45}s`,
              animationDelay: `${(player.id % 5) * -0.7}s`,
            }}
            onError={(e) => {
              e.currentTarget.src =
                "data:image/svg+xml," +
                encodeURIComponent(
                  `<svg xmlns='http://www.w3.org/2000/svg' width='160' height='200'><circle cx='80' cy='70' r='42' fill='%231c1c1f'/><rect y='120' width='160' height='80' fill='%23e61c24'/></svg>`
                );
            }}
          />
        </div>
      </div>

      <div className="relative px-5 pb-6 pt-5">
        <h3 className="text-xl font-extrabold leading-tight tracking-tight text-white">
          {player.name}
        </h3>
        {player.nickname ? (
          <p className="mt-1.5 text-row text-acf-dim">«{player.nickname}»</p>
        ) : null}
        {player.position ? (
          <p className="mt-3 text-micro font-semibold uppercase tracking-[0.22em] text-acf-dim">
            {player.position}
          </p>
        ) : null}
      </div>
    </article>
  );
}

export default function Squad() {
  const [filter, setFilter] = useState("Todos");
  const trackRef = useRef(null);
  const { squad } = teamData;

  const filtered = useMemo(
    () => (filter === "Todos" ? squad : squad.filter((p) => p.position === filter)),
    [filter, squad]
  );

  // The club has not given positions yet, so the filter only appears once some exist.
  const hasPositions = useMemo(() => squad.some((player) => player.position), [squad]);

  const scrollByCards = (dir) => {
    const track = trackRef.current;
    if (!track) return;
    const card = track.querySelector("[data-card]");
    const step = card ? card.offsetWidth + 24 : 320;
    track.scrollBy({ left: dir * step, behavior: "smooth" });
  };

  return (
    <section id="plantilla" className="relative scroll-mt-20 py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-micro font-semibold uppercase tracking-[0.3em] text-acf-red">
              La Plantilla
            </p>
            <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              Plantilla 2026/2027
            </h2>
          </div>
          <div className="text-center sm:text-right">
            <span className="font-display text-4xl leading-none tabular-nums text-white sm:text-5xl">
              {squad.length}
            </span>
            <p className="mt-1 text-micro font-semibold uppercase tracking-[0.22em] text-acf-dim">
              Jugadores
            </p>
          </div>
        </div>

        {/* El once sobre el campo: abre la sección con la plantilla, no con un título. */}
        <PitchCard />

        {/* Filtro por posición: sólo se ofrecen las posiciones con plantilla real,
            así el club va confirmando posiciones y el filtro las va mostrando. */}
        {hasPositions ? (
          <div className="mb-8 flex flex-wrap gap-2">
            {["Todos", ...new Set(squad.filter((p) => p.position).map((p) => p.position))].map(
              (pos) => (
              <button
                key={pos}
                onClick={() => setFilter(pos)}
                className={`rounded-full px-4 py-2.5 text-row font-semibold tracking-tight transition-colors ${
                  filter === pos
                    ? "bg-acf-red text-white"
                    : "border border-acf-line text-acf-snow/60 hover:text-white"
                }`}
              >
                {pos}
              </button>
            ))}
          </div>
        ) : null}

        {/* Slider horizontal de jugadores */}
        <div className="relative">
          <div
            ref={trackRef}
            className="flex snap-x snap-mandatory gap-5 overflow-x-auto overscroll-x-contain scroll-smooth pb-2 squad-scrollbar squad-fade-right"
          >
            {filtered.map((player) => (
              <PlayerCard key={player.id} player={player} />
            ))}
          </div>

          <button
            type="button"
            onClick={() => scrollByCards(-1)}
            aria-label="Anteriores"
            className="absolute -left-4 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-acf-line bg-acf-panel text-acf-grey transition-colors hover:text-white md:flex"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => scrollByCards(1)}
            aria-label="Siguientes"
            className="absolute -right-4 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-acf-line bg-acf-panel text-acf-grey transition-colors hover:text-white md:flex"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  );
}
