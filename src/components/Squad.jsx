import { useMemo, useState } from "react";
import { Users, Trophy, Flame } from "lucide-react";
import teamData from "../data/teamData.json";

const POSITIONS = ["Todos", "Portero", "Defensa", "Medio", "Delantero"];

const positionStyle = {
  Portero: { bg: "bg-yellow-600", text: "POR" },
  Defensa: { bg: "bg-blue-600", text: "DEF" },
  Medio: { bg: "bg-green-600", text: "MED" },
  Delantero: { bg: "bg-red-600", text: "DEL" },
};

function ColdMeter({ value }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-acf-grey">
          Nivel de Frío
        </span>
        <span className="text-xs font-bold text-sky-300">{value}°</span>
      </div>
      <div className="h-1.5 bg-acf-dark rounded-full overflow-hidden">
        <div
          className="cold-bar h-full rounded-full"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function StatChip({ label, value }) {
  return (
    <div className="flex flex-col items-center bg-acf-dark/60 rounded-md py-1.5 px-2">
      <span className="font-display text-xl leading-none text-white">{value}</span>
      <span className="text-[8px] font-bold uppercase tracking-wider text-acf-grey mt-0.5">
        {label}
      </span>
    </div>
  );
}

function PlayerCard({ player, isMvp, isIce }) {
  const pos = positionStyle[player.position];

  return (
    <article className="group relative bg-acf-panel border border-acf-line hover:border-acf-red/60 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-red overflow-hidden clip-edge-tl">
      {/* Fondo del dorsal en marca de agua */}
      <span className="absolute -right-4 -bottom-8 font-display text-[10rem] leading-none text-white/[0.04] select-none pointer-events-none transition-all duration-500 group-hover:text-white/[0.07]">
        {player.number}
      </span>

      {/* Cabecera con degradado posicional */}
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />

      {/* Etiquetas superiores */}
      <div className="relative flex items-center justify-between px-4 pt-3.5">
        <span className={`${pos.bg} text-white text-[10px] font-bold px-2 py-0.5 tracking-widest clip-edge`}>
          {pos.text}
        </span>
        <div className="flex gap-1.5">
          {isMvp && (
            <span className="flex items-center gap-1 bg-acf-red text-white text-[9px] font-bold px-1.5 py-0.5 rounded-sm">
              <Trophy className="h-2.5 w-2.5" /> MVP
            </span>
          )}
          {isIce && (
            <span className="flex items-center gap-1 bg-sky-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-sm">
              <Flame className="h-2.5 w-2.5" /> ICE
            </span>
          )}
        </div>
      </div>

      {/* Foto */}
      <div className="relative mt-1 flex flex-col items-center">
        <div className="relative h-36 w-32">
          <div className="absolute inset-0 bg-gradient-to-t from-acf-panel via-transparent to-transparent" />
          <img
            src={player.photo}
            alt={player.name}
            className="relative h-full w-full object-cover object-top rounded-lg border border-acf-line bg-acf-panel-light"
            onError={(e) => {
              e.currentTarget.src =
                "data:image/svg+xml," +
                encodeURIComponent(
                  `<svg xmlns='http://www.w3.org/2000/svg' width='128' height='144'><rect width='128' height='144' fill='%23161616'/><circle cx='64' cy='52' r='28' fill='%232a2a2a'/><rect y='90' width='128' height='54' fill='%23e61c24'/></svg>`
                );
            }}
          />
          {/* Dorsal sobre la foto */}
          <span className="absolute bottom-0 right-1 font-display text-6xl text-white/25 leading-none group-hover:text-white/40 transition-colors">
            {player.number}
          </span>
        </div>
      </div>

      {/* Nombre */}
      <div className="relative px-4 pb-5">
        <h3 className="font-display text-2xl leading-tight tracking-wide text-white group-hover:text-acf-red transition-colors">
          {player.name}
        </h3>
        <p className="text-xs text-acf-snow/60 italic mb-4">«{player.nickname}»</p>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-1.5 mb-4">
          <StatChip label="PJ" value={player.stats.matches} />
          <StatChip label="GOL" value={player.stats.goals} />
          <StatChip label="ASI" value={player.stats.assists} />
          <StatChip label="TARJ" value={player.stats.yellowCards} />
        </div>

        <ColdMeter value={player.stats.coldMeter} />
      </div>
    </article>
  );
}

export default function Squad() {
  const [filter, setFilter] = useState("Todos");
  const { squad, fanZone } = teamData;

  const mvpId = fanZone.mvpLastMatch.playerId;
  const iceId = fanZone.iceOfTheWeek.playerId;

  const filtered = useMemo(
    () => (filter === "Todos" ? squad : squad.filter((p) => p.position === filter)),
    [filter, squad]
  );

  const totalGoals = squad.reduce((acc, p) => acc + p.stats.goals, 0);
  const totalAssists = squad.reduce((acc, p) => acc + p.stats.assists, 0);

  return (
    <section id="plantilla" className="relative py-24 texture-grain bg-acf-panel/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-12">
          <div>
            <p className="text-acf-red font-display text-3xl tracking-widest">LA PLANTILLA</p>
            <h2 className="font-display text-4xl sm:text-5xl tracking-wide uppercase">
              Los 12 del Frío
            </h2>
          </div>
          <div className="flex items-center gap-6 text-center">
            <div>
              <span className="font-display text-3xl text-acf-red">{totalGoals}</span>
              <p className="text-[10px] font-bold uppercase tracking-widest text-acf-grey">Goles</p>
            </div>
            <div>
              <span className="font-display text-3xl text-white">{totalAssists}</span>
              <p className="text-[10px] font-bold uppercase tracking-widest text-acf-grey">Asistencias</p>
            </div>
            <div>
              <span className="font-display text-3xl text-white">{squad.length}</span>
              <p className="text-[10px] font-bold uppercase tracking-widest text-acf-grey">Jugadores</p>
            </div>
          </div>
        </div>

        {/* Filtro por posición */}
        <div className="flex flex-wrap gap-2 mb-10">
          {POSITIONS.map((pos) => (
            <button
              key={pos}
              onClick={() => setFilter(pos)}
              className={`px-4 py-2 text-sm font-bold clip-edge transition-all ${
                filter === pos
                  ? "bg-acf-red text-white shadow-red"
                  : "bg-acf-panel border border-acf-line text-acf-snow/60 hover:text-white hover:border-acf-line"
              }`}
            >
              {pos}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map((player) => (
            <PlayerCard
              key={player.id}
              player={player}
              isMvp={player.id === mvpId}
              isIce={player.id === iceId}
            />
          ))}
        </div>
      </div>
    </section>
  );
}