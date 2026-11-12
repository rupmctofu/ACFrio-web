import { useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import teamData from "../data/teamData.json";

const POSITIONS = ["Todos", "Portero", "Defensa", "Medio", "Delantero"];

const positionStyle = {
  Portero: { bg: "bg-yellow-600", text: "POR" },
  Defensa: { bg: "bg-blue-600", text: "DEF" },
  Medio: { bg: "bg-green-600", text: "MED" },
  Delantero: { bg: "bg-red-600", text: "DEL" },
};

function PlayerCard({ player }) {
  // Position and shirt number are shown only when the club has confirmed them.
  const pos = player.position ? positionStyle[player.position] : null;

  return (
    <article
      data-card
      className="group relative bg-acf-panel border border-acf-line hover:border-acf-red/60 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-red overflow-hidden clip-edge-tl shrink-0 snap-start min-w-[17rem] w-[78vw] max-w-[19rem]"
    >
      {/* Fondo del dorsal en marca de agua */}
      {player.number ? (
        <span className="absolute -right-4 bottom-0 font-display text-[10rem] leading-none text-white/[0.04] select-none pointer-events-none transition-all duration-500 group-hover:text-white/[0.07]">
          {player.number}
        </span>
      ) : null}

      {/* Cabecera con degradado posicional */}
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />

      <div className="relative flex items-center justify-between px-4 pt-3.5">
        {pos ? (
          <span className={`${pos.bg} text-white text-[10px] font-bold px-2 py-0.5 tracking-widest clip-edge`}>
            {pos.text}
          </span>
        ) : (
          <span />
        )}
        {player.number ? (
          <span className="font-display text-lg text-acf-grey">#{player.number}</span>
        ) : null}
      </div>

      {/* Foto de medio cuerpo con transparencia */}
      <div className="relative mt-1 flex items-center justify-center">
        <div className="relative h-64 sm:h-72 w-full">
          <img
            src={player.photo}
            alt={player.name}
            loading="lazy"
            className="relative h-full w-full object-cover object-top"
            onError={(e) => {
              e.currentTarget.src =
                "data:image/svg+xml," +
                encodeURIComponent(
                  `<svg xmlns='http://www.w3.org/2000/svg' width='160' height='200'><circle cx='80' cy='70' r='42' fill='%232a2a2a'/><rect y='120' width='160' height='80' fill='%23e61c24'/></svg>`
                );
            }}
          />
        </div>
      </div>

      <div className="relative px-4 pb-5">
        <h3 className="font-display text-2xl leading-tight tracking-wide text-white group-hover:text-acf-red transition-colors">
          {player.name}
        </h3>
        {player.nickname ? (
          <p className="text-xs text-acf-snow/60 italic">«{player.nickname}»</p>
        ) : null}
        {player.position ? (
          <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.2em] text-acf-grey">
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
    <section id="plantilla" className="relative scroll-mt-20 py-16 texture-grain">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-10">
          <div>
            <p className="text-acf-red font-display text-3xl tracking-widest">LA PLANTILLA</p>
            <h2 className="font-display text-4xl sm:text-5xl tracking-wide uppercase">
              Plantilla 2026/2027
            </h2>
          </div>
          <div className="text-center sm:text-right">
            <span className="font-display text-3xl text-acf-red">{squad.length}</span>
            <p className="text-[10px] font-bold uppercase tracking-widest text-acf-grey">Jugadores</p>
          </div>
        </div>

        {/* Filtro por posición */}
        {hasPositions ? (
          <div className="flex flex-wrap gap-2 mb-8">
          {POSITIONS.map((pos) => (
            <button
              key={pos}
              onClick={() => setFilter(pos)}
              className={`px-4 py-2 text-sm font-bold transition-all ${
                filter === pos
                  ? "bg-acf-red text-white shadow-red"
                  : "bg-acf-panel border border-acf-line text-acf-snow/60 hover:text-white hover:border-acf-line"
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
            className="flex gap-6 overflow-x-auto overscroll-x-contain scroll-smooth snap-x snap-mandatory pb-2 squad-scrollbar squad-fade-right"
          >
            {filtered.map((player) => (
              <PlayerCard key={player.id} player={player} />
            ))}
          </div>

          <button
            type="button"
            onClick={() => scrollByCards(-1)}
            aria-label="Anteriores"
            className="hidden md:flex absolute -left-4 top-1/2 -translate-y-1/2 items-center justify-center h-11 w-11 bg-acf-panel border border-acf-line text-acf-snow/70 hover:text-acf-red hover:border-acf-red transition-colors z-10"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => scrollByCards(1)}
            aria-label="Siguientes"
            className="hidden md:flex absolute -right-4 top-1/2 -translate-y-1/2 items-center justify-center h-11 w-11 bg-acf-panel border border-acf-line text-acf-snow/70 hover:text-acf-red hover:border-acf-red transition-colors z-10"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </section>
  );
}
