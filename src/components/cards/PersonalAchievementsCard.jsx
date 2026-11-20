import { Medal } from "lucide-react";
import { playerAchievements, playerScopeFor } from "../../data/achievements.js";
import { season } from "../../data/club-record.js";
import { useIdentity } from "../../lib/identity.js";
import Card from "./Card.jsx";
import AchievementsGrid, { seasonAchievements } from "../AchievementsGrid.jsx";

/**
 * The personal shelf: the player-scope entries of the catalogue, twelve at a
 * time, in a card.
 *
 * It is one component used twice on purpose — under Goleadores in the dashboard
 * and as the narrow left block of `/logros` — because the owner asked for the
 * same thing in both places, and two drawings of one block is how they start to
 * differ. The grid it draws is the same `AchievementsGrid` the team block uses;
 * only the column count is chosen by the caller, since here it is 20% of a page
 * and there it is a dashboard column.
 *
 * The catalogue is 49 entries, and drawn in one grid it was seventeen rows tall
 * — a page, not a shelf (S6). So the entries are cut into pages of twelve (three
 * columns by four rows at the dashboard's width) and the pages slide sideways
 * with snap points, one dot per page underneath. Twelve is the number the owner
 * asked to see at once; the rest is a swipe, not a scroll past the card.
 *
 * The height of every page is the height of the tallest one, because they are
 * flex children of the same track: sliding never resizes the card.
 *
 * The scope is gated on identity. Without a bound device the card says so in one
 * line and shows no grid at all: an empty shelf would read as "you have nothing",
 * which is not the same statement as "we do not know who you are". With a device
 * bound, the player's name rides in the hint, so the reader knows whose shelf he
 * is looking at.
 *
 * And that name is now true. The grid draws the scope of the reader — his own
 * figures, decided one entry at a time — and never the squad-wide scope the
 * evaluator also publishes: `playerScopeFor(playerScope, player)` picks the row
 * for this player out of `seasonAchievements.player.byPlayer`. Before that
 * change the tiles were the club's personal logros drawn under the reader's
 * name, and the owner, who has no card in the club record while Albert and Jonay
 * do, read that he had a yellow (S13). A tile the squad earned and this man did
 * not is dark here, which is the only honest way to draw it.
 */

/**
 * One shelf, whatever the caller's width.
 *
 * The entries are drawn in a single grid that scrolls normally, because the
 * pager this card used to carry was a worse toy on a desktop than it was on a
 * phone (S21). The card never grows past the height its caller gives it: the
 * dashboard bounds it and `/logros` makes it as tall as the team shelf, and in
 * both the grid scrolls inside.
 */
export default function PersonalAchievementsCard({
  className = "",
  bodyClassName = "",
  columns = "grid-cols-3",
}) {
  const { player } = useIdentity();
  /* The reader's own shelf. `null` only before a device is bound. */
  const scope = player ? playerScopeFor(seasonAchievements.player, player) : null;
  const total = playerAchievements.length;
  const earned = scope?.unlocked.length ?? 0;
  // The two end-of-season entries: locked today, and not a loss.
  const seasonUnfinished = scope?.progress?.seasonComplete === false;
  const hasPending = seasonUnfinished && playerAchievements.some((entry) => entry.seasonEnd);

  return (
    <Card
      id="logros-personales"
      title="Logros personales"
      hint={player ? `${player.name} · ${earned} de ${total}` : `Temporada ${season}`}
      icon={Medal}
      className={className}
      bodyClassName={`flex min-h-0 flex-col ${bodyClassName}`}
    >
      {player && scope ? (
        <>
          {/* The grid scrolls, not the card: the count below stays where it is. */}
          <div className="min-h-0 flex-1 overflow-y-auto">
            <AchievementsGrid
              entries={playerAchievements}
              scope={scope}
              columns={columns}
              label="Logros personales"
              className="px-6 pb-5"
            />
          </div>
          <footer className="border-t border-acf-line-soft px-6 py-3.5">
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
