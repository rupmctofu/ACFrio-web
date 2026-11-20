import teamData from "../data/teamData.json";
import PitchCard from "./cards/PitchCard.jsx";

/**
 * The squad section, as the eleven on the pitch.
 *
 * It used to continue into a grid of fourteen large player cards, which made the
 * section the tallest thing on the page (about 2.700px at 1440) while repeating
 * the names and shirt numbers the pitch already carries. The owner dropped the
 * grid (L21): the pitch stays, the cards and their position filter are gone.
 *
 * The filter left with the grid on purpose: it only ever filtered those cards,
 * so keeping it would leave a control with nothing to control. If positions are
 * ever needed again, they belong on the pitch.
 */
export default function Squad() {
  const { squad } = teamData;

  return (
    <section id="plantilla" className="relative scroll-mt-20 py-16">
      <div className="wrap">
        <div className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-micro font-semibold uppercase tracking-[0.3em] text-acf-red-soft">
              La Plantilla
            </p>
            <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              Plantilla 2026/2027
            </h2>
            {/*
             * The count sits under the title, on the container's left edge, and
             * not in a right-hand slot: a number parked on the row's right end
             * started its line where nothing else starts (gate: edge-left asked
             * for the .wrap left line). It is a stat, not a heading, so it keeps
             * the h2 size and cannot outrank the title above it.
             */}
            <p className="mt-3 flex items-baseline gap-2">
              <span className="font-display text-2xl leading-none tabular-nums text-white sm:text-3xl">
                {squad.length}
              </span>
              <span className="text-micro font-semibold uppercase tracking-[0.22em] text-acf-dim">
                Jugadores
              </span>
            </p>
          </div>
        </div>

        {/* El once sobre el campo: la sección abre con la plantilla, no con un título. */}
        <PitchCard />
      </div>
    </section>
  );
}
