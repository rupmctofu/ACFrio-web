import { useRef, useState } from "react";
import { Medal } from "lucide-react";
import { playerAchievements } from "../../data/achievements.js";
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
 * Honest limitation, stated rather than hidden: the evaluator decides each
 * player-scope entry for the squad as a whole ("un jugador llega a cinco
 * partidos"), not per player, so the grid shows the club's personal logros and
 * the name of the reader looking at them — it never claims a trophy is that
 * reader's alone. Per-player attribution does not exist in the data layer, and
 * this component does not invent it.
 */

/** Twelve at a time: three columns by four rows at the dashboard's width (S6). */
const PER_PAGE = 12;

function pagesOf(items, size) {
  const pages = [];
  for (let index = 0; index < items.length; index += size) {
    pages.push(items.slice(index, index + size));
  }
  return pages;
}

/* The catalogue never changes at run time, so the pages are cut once. */
const PAGES = pagesOf(playerAchievements, PER_PAGE);
export default function PersonalAchievementsCard({
  className = "",
  columns = "grid-cols-3",
}) {
  const { player } = useIdentity();
  const track = useRef(null);
  const [page, setPage] = useState(0);
  const scope = seasonAchievements.player;
  const total = playerAchievements.length;
  const earned = scope.unlocked.length;
  // The two end-of-season entries: locked today, and not a loss.
  const seasonUnfinished = scope.progress.seasonComplete === false;
  const hasPending = seasonUnfinished && playerAchievements.some((entry) => entry.seasonEnd);

  /* Reading the offset back rather than keeping the swipe state in a variable:
     a trackpad, a finger and the dots all end up in the same place. */
  const readPage = () => {
    const node = track.current;
    if (!node || node.clientWidth === 0) return;
    setPage(Math.round(node.scrollLeft / node.clientWidth));
  };

  const goTo = (index) => {
    const node = track.current;
    if (!node) return;
    node.scrollTo({ left: index * node.clientWidth, behavior: "smooth" });
    setPage(index);
  };

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
          <div
            ref={track}
            onScroll={readPage}
            role="group"
            aria-roledescription="carrusel"
            aria-label="Logros personales"
            className="flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {PAGES.map((slice, index) => (
              <div key={index} className="w-full shrink-0 snap-start px-6 pb-5">
                <AchievementsGrid
                  entries={slice}
                  scope={scope}
                  columns={`${columns} grid-rows-4`}
                  label={index === 0 ? undefined : `Logros personales, página ${index + 1}`}
                />
              </div>
            ))}
          </div>
          {PAGES.length > 1 ? (
            <div className="flex items-center justify-center gap-1.5 px-6 pb-5">
              {PAGES.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => goTo(index)}
                  aria-label={`Página ${index + 1} de ${PAGES.length}`}
                  aria-current={index === page ? "true" : undefined}
                  className={`h-1.5 rounded-full transition-all duration-200 ${
                    index === page
                      ? "w-5 bg-acf-red"
                      : "w-1.5 bg-white/25 hover:bg-white/50"
                  }`}
                />
              ))}
            </div>
          ) : null}
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
