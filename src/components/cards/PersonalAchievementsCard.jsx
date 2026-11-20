import { Medal } from "lucide-react";
import { playerAchievements } from "../../data/achievements.js";
import { season } from "../../data/club-record.js";
import { useIdentity } from "../../lib/identity.js";
import Card from "./Card.jsx";
import AchievementsGrid, { seasonAchievements } from "../AchievementsGrid.jsx";

/**
 * The personal shelf: the twelve player-scope entries of the catalogue, in a
 * card.
 *
 * It is one component used twice on purpose — under Goleadores in the dashboard
 * and as the narrow left block of `/logros` — because the owner asked for the
 * same thing in both places, and two drawings of one block is how they start to
 * differ. The grid it draws is the same `AchievementsGrid` the team block uses;
 * only the column count is chosen by the caller, since here it is 20% of a page
 * and there it is a dashboard column.
 *
 * The scope is gated on identity. Without a bound device the card says so in one
 * line and shows no grid at all: an empty shelf would read as "you have nothing",
 * which is not the same statement as "we do not know who you are". With a device
 * bound, the player's name rides in the hint, so the reader knows whose shelf he
 * is looking at.
 *
 * Honest limitation, stated rather than hidden: the evaluator decides each
 * player-scope entry for the squad as a whole ("un jugador llega a cinco
 * partidos"), not per player, so the grid shows the club's personal logros and
 * the name of the reader looking at them — it never claims a trophy is that
 * reader's alone. Per-player attribution does not exist in the data layer, and
 * this component does not invent it.
 */
export default function PersonalAchievementsCard({
  className = "",
  columns = "grid-cols-3",
}) {
  const { player } = useIdentity();
  const scope = seasonAchievements.player;
  const total = playerAchievements.length;
  const earned = scope.unlocked.length;
  // The two end-of-season entries: locked today, and not a loss.
  const seasonUnfinished = scope.progress.seasonComplete === false;
  const hasPending = seasonUnfinished && playerAchievements.some((entry) => entry.seasonEnd);

  return (
    <Card
      id="logros-personales"
      title="Logros personales"
      hint={player ? `${player.name} · ${earned} de ${total}` : `Temporada ${season}`}
      icon={Medal}
      className={className}
      bodyClassName="flex flex-col"
    >
      {player ? (
        <>
          <AchievementsGrid
            entries={playerAchievements}
            scope={scope}
            columns={columns}
            label="Logros personales"
            className="px-6 pb-6"
          />
          <footer className="mt-auto border-t border-acf-line-soft px-6 py-3.5">
            <p className="text-micro font-semibold uppercase tracking-[0.16em] text-acf-dim">
              {earned} de {total} conseguidos
            </p>
            {hasPending ? (
              <p className="mt-1.5 text-row leading-relaxed text-acf-grey">
                Dos de estos logros solo se entregan cuando termina la temporada.
              </p>
            ) : null}
          </footer>
        </>
      ) : (
        /* One line, no grid: the shelf is not empty, it is unattended. */
        <p className="px-6 pb-6 text-row leading-relaxed text-acf-grey">
          Elige quién eres en la cabecera: sin jugador no hay logros personales.
        </p>
      )}
    </Card>
  );
}
