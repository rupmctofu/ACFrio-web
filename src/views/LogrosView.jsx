import { Trophy } from "lucide-react";
import Card from "../components/cards/Card.jsx";
import PersonalAchievementsCard from "../components/cards/PersonalAchievementsCard.jsx";
import AchievementsGrid, { seasonAchievements } from "../components/AchievementsGrid.jsx";
import { teamAchievements } from "../data/achievements.js";
import { season } from "../data/club-record.js";

/**
 * `/logros` — the whole catalogue on one screen, at the owner's proportions:
 * the personal block on the left at about a fifth of the width and the team
 * block taking the remaining four fifths, so the team shelf is visibly the
 * bigger one. On a phone the two stack, personal first: the narrow block is the
 * reader's own shelf, and it should not be the one that arrives late.
 *
 * The split is a four-to-one grid and not two fixed widths, so the ratio holds at
 * every desktop width instead of falling apart between breakpoints. Both blocks
 * read the same `seasonAchievements` object, so the page cannot draw a trophy
 * that the dashboard leaves dark.
 */
export default function LogrosView() {
  const team = seasonAchievements.team;
  const total = teamAchievements.length;
  const earned = team.unlocked.length;

  return (
    <section className="relative pb-16 pt-28">
      <div className="wrap">
        <header className="max-w-2xl">
          <p className="text-micro font-semibold uppercase tracking-[0.3em] text-acf-red-soft">
            La temporada
          </p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Logros
          </h1>
          <p className="mt-3 text-row leading-relaxed text-acf-snow/70">
            Una placa se enciende cuando los datos la sostienen. Ni una más.
          </p>
        </header>

        {/* Both shelves share one height and scroll their own overflow: the
            owner asked for the personal block to stop being the long one, and a
            fixed row is the only way two catalogues of 49 and 58 entries can
            stand level. `items-stretch` is the default, so one height on the
            grid is enough for both cards. */}
        <div className="mt-8 grid grid-cols-1 gap-6 lg:h-[44rem] lg:grid-cols-[minmax(0,1fr)_minmax(0,4fr)]">
          {/* First in the DOM and first on a phone. Two columns only once the
              grid has given the block its 20%: before that the card is the full
              width of the screen and three plates fit. */}
          <PersonalAchievementsCard
            columns="grid-cols-3 lg:grid-cols-2"
            className="h-full"
          />

          <Card
            id="logros-equipo"
            title="Logros de equipo"
            hint={`Temporada ${season} · ${earned} de ${total}`}
            icon={Trophy}
            className="surface-deep h-full"
            bodyClassName="flex min-h-0 flex-col overflow-y-auto"
          >
            <AchievementsGrid
              entries={teamAchievements}
              scope={team}
              columns="grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
              label="Logros de equipo"
              className="px-6 pb-6"
            />
            <footer className="mt-auto border-t border-acf-line-soft px-6 py-3.5">
              <p className="text-micro font-semibold uppercase tracking-[0.16em] text-acf-dim">
                {earned} de {total} conseguidos
              </p>
              <p className="mt-1.5 text-row leading-relaxed text-acf-grey">
                Una placa apagada es un partido que todavía falta.
              </p>
            </footer>
          </Card>
        </div>
      </div>
    </section>
  );
}
