import { COMPETITION_TABS, routeLink } from "../lib/router.js";
import LigaTab from "./JornadaView.jsx";
import CopaTab from "./CopaView.jsx";

/**
 * `/competicion` — the competition pages as one section with two tabs (S14,
 * S22): Liga and Copa.
 *
 * The owner counted six pages in the bar and said so ("creo que son demasiadas");
 * the answer is not fewer facts but one door: jornada and clasificación are the
 * same subject read twice, and copa and the table are both the season. So there
 * is one heading here and the tabs under it, and each tab draws its own cards
 * without repeating the heading — the tab is a part of the page, not a page
 * inside it.
 *
 * There were three. The third listed the eleven clubs of the season, and the
 * owner did not want a section for the names alone: the clubs of the league sit
 * under Liga and the clubs of the cup under Copa, "cada uno con sus respectivos
 * equipos". That is why the tab strip has two pills and why neither tab is
 * missing the list.
 *
 * The tab is in the URL (`/competicion/liga`, `/competicion/copa`) so a link
 * pasted into the group opens the tab it names, and switching tab is a
 * `pushState`, never a reload. The liga tab also carries the round
 * (`/competicion/liga/3`): that is where `/jornada/3` lands, because the round is
 * the part of this section people actually share.
 *
 * What each tab draws lives in the view it came from — `JornadaView`,
 * `CopaView` — and those files export the tab rather than a whole page: one
 * drawing of each block, and the shell here, which is the only place a page title
 * exists. The club list both tabs end with is `ClubList`.
 */

/**
 * The tabs, in the order the section is read: the league is where the season is
 * won, and the cup is the second competition drawn on its own. `intro` is the
 * sentence the tab opens with.
 */
const TABS = [
  {
    tab: "liga",
    label: "Liga",
    intro:
      "La tabla, la jornada y los clubes de la liga. Los partidos de esta semana, y debajo los de la anterior.",
  },
  {
    tab: "copa",
    label: "Copa",
    intro:
      "Seis clubes, cinco jornadas y una pizarra vacía. El sorteo lo hace la federación; aquí se verá cuando lo publique. Abajo, los seis, cada uno con su ficha.",
  },
];

/* The tab strip is one segmented control: equal pills, the same shape the bar's
   pills have, one size up because this one is the page's own control. */
const TAB_BASE =
  "flex-1 rounded-full px-3 py-2 text-center text-row font-bold tracking-tight transition-colors";
const TAB_ACTIVE = "bg-acf-red text-white";
const TAB_IDLE = "text-acf-snow/60 hover:bg-white/[0.06] hover:text-white";

const TAB_VIEWS = { liga: LigaTab, copa: CopaTab };

export default function CompeticionView({ tab = COMPETITION_TABS[0], matchday = null }) {
  const active = TABS.find((entry) => entry.tab === tab) ?? TABS[0];
  const View = TAB_VIEWS[active.tab];

  /*
   * The liga pill keeps the round the reader is on. Clicking the tab you are
   * already inside should change nothing — sending someone from jornada 3 back
   * to the default round would read as the page losing their place.
   */
  const pathOf = (entry) =>
    entry.tab === "liga" && matchday ? `/competicion/liga/${matchday}` : `/competicion/${entry.tab}`;

  return (
    <section className="relative pb-16 pt-28">
      <div className="wrap">
        <header className="max-w-2xl">
          <p className="text-micro font-semibold uppercase tracking-[0.3em] text-acf-red-soft">
            La temporada
          </p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Competición
          </h1>
          <p className="mt-3 text-row leading-relaxed text-acf-snow/70">
            La liga y la copa, cada una con sus clubes. Todo lo que publica la
            federación, en un solo sitio.
          </p>
        </header>

        {/* A real link per tab: the address is the state, so the tab is
            shareable, the back button steps through tabs, and a phone that opens
            the link in a new tab still lands on the right one. */}
        <nav
          aria-label="Secciones de la competición"
          className="mt-7 flex w-full max-w-md items-center gap-1 rounded-full border border-acf-line bg-acf-panel/70 p-1"
        >
          {TABS.map((entry) => {
            const current = entry.tab === active.tab;
            return (
              <a
                key={entry.tab}
                {...routeLink(pathOf(entry))}
                aria-current={current ? "page" : undefined}
                className={`${TAB_BASE} ${current ? TAB_ACTIVE : TAB_IDLE}`}
              >
                {entry.label}
              </a>
            );
          })}
        </nav>

        <p className="mt-4 max-w-2xl text-row leading-relaxed text-acf-grey">{active.intro}</p>

        <div className="mt-6">
          <View matchday={active.tab === "liga" ? matchday : null} />
        </div>
      </div>
    </section>
  );
}
