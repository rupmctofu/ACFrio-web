import teamData from "../data/teamData.json";
import { useIdentity } from "../lib/identity.js";

/**
 * "¿Quién eres?" — the passwordless door.
 *
 * Two states, both in place at the top of the grid so it is the first thing you
 * meet and never a modal fighting the club's fixed header:
 *   * nobody chosen — the whole squad as faces, one tap to answer;
 *   * somebody chosen — one line with the face, and a way to change user.
 *
 * The squad comes from teamData.json, the same file the squad section renders,
 * so a new signing appears here without touching this component.
 */

function Face({ player, onPick }) {
  return (
    <button
      type="button"
      onClick={() => onPick(player.id)}
      aria-label={`Soy ${player.name}`}
      className="group flex w-[4.5rem] shrink-0 flex-col items-center gap-2 rounded-tile border border-transparent px-1 py-2 transition-colors duration-200 hover:border-acf-line hover:bg-acf-panel-light focus-visible:border-acf-red focus-visible:outline-none sm:w-auto sm:shrink"
    >
      <span className="relative flex h-14 w-14 items-end justify-center overflow-hidden rounded-full border border-acf-line bg-acf-panel-light sm:h-20 sm:w-20">
        <img
          src={player.photo}
          alt=""
          loading="lazy"
          className="max-h-[92%] w-auto object-contain transition-transform duration-300 group-hover:scale-105"
          onError={(event) => {
            // Same fallback the squad cards use, so a missing portrait is a
            // silhouette instead of a broken image.
            event.currentTarget.src =
              "data:image/svg+xml," +
              encodeURIComponent(
                `<svg xmlns='http://www.w3.org/2000/svg' width='160' height='200'><circle cx='80' cy='70' r='42' fill='#1c1c1f'/><rect y='120' width='160' height='80' fill='#e61c24'/></svg>`,
              );
          }}
        />
      </span>
      <span className="text-micro font-semibold uppercase tracking-[0.12em] text-acf-snow/70 transition-colors duration-200 group-hover:text-white">
        {player.name}
      </span>
    </button>
  );
}

export default function WhoAreYou() {
  const { player, choose, forget } = useIdentity();

  if (player) {
    return (
      <div className="mb-6 flex items-center justify-between gap-4 rounded-card border border-acf-line bg-acf-panel px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-11 w-11 items-end justify-center overflow-hidden rounded-full border border-acf-line bg-acf-panel-light">
            <img src={player.photo} alt="" className="max-h-[92%] w-auto object-contain" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-row font-semibold text-white">
              Hola, {player.name}
            </p>
            <p className="text-micro font-semibold uppercase tracking-[0.18em] text-acf-dim">
              {player.number ? `#${player.number} · ` : ""}Vinculado a este dispositivo
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={forget}
          className="shrink-0 rounded-full border border-acf-line px-4 py-2 text-micro font-semibold uppercase tracking-[0.18em] text-acf-snow/70 transition-colors duration-200 hover:border-white/25 hover:text-white focus-visible:border-acf-red focus-visible:outline-none"
        >
          Cambiar
        </button>
      </div>
    );
  }

  return (
    <div className="mb-6 rounded-card border border-acf-line bg-acf-panel px-4 py-5 sm:px-5">
      <p className="text-micro font-semibold uppercase tracking-[0.3em] text-acf-red">
        ¿Quién eres?
      </p>
      <p className="mt-2 max-w-xl text-row text-acf-grey">
        Toca tu cara una vez. Sin contraseñas: este dispositivo te recuerda para
        apuntarte al próximo partido.
      </p>
      <div className="-mx-1 mt-4 flex gap-1 overflow-x-auto pb-1 no-scrollbar sm:mx-0 sm:grid sm:grid-cols-8 sm:gap-2 sm:overflow-visible sm:pb-0">
        {teamData.squad.map((member) => (
          <Face key={member.id} player={member} onPick={choose} />
        ))}
      </div>
    </div>
  );
}
