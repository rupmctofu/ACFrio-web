import { useEffect } from "react";
import Navbar from "./components/Navbar.jsx";
import PageBackdrop from "./components/PageBackdrop.jsx";
import teamData from "./data/teamData.json";
import { matchRoute, navigate, routeLink, useRoute } from "./lib/router.js";
import HomeView from "./views/HomeView.jsx";
import CompeticionView from "./views/CompeticionView.jsx";
import EquipoView from "./views/EquipoView.jsx";
import LogrosView from "./views/LogrosView.jsx";
import ReglamentoView from "./views/ReglamentoView.jsx";

function Footer() {
  const { club } = teamData;
  return (
    <footer className="border-t border-acf-line">
      <div className="wrap py-12">
        <div className="flex flex-col items-center justify-between gap-8 md:flex-row">
          <div className="flex items-center gap-3">
            <img src={club.logo} alt={club.name} className="h-10 w-auto" />
            <div>
              <p className="text-lg font-extrabold leading-none tracking-tight text-white">
                AC <span className="text-acf-red">FRÍO</span>
              </p>
              <p className="mt-2 text-micro font-semibold uppercase tracking-[0.26em] text-acf-dim">
                {club.tagline}
              </p>
            </div>
          </div>

          <p className="text-center text-row text-acf-grey">
            © 2026 {club.name}
            {club.founded ? ` · Fundado en ${club.founded}` : ""}
            {/* The rules live outside the bar, so the footer is the second door
                to them: a reader who has scrolled to the bottom of the site is
                looking for exactly this and cannot get it from the pills. */}
            <a
              {...routeLink("/reglamento")}
              className="mx-auto mt-2 block w-fit text-micro font-semibold uppercase tracking-[0.22em] text-acf-grey transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acf-red"
            >
              Reglamento
            </a>
          </p>

          <p className="text-center text-micro font-semibold uppercase tracking-[0.22em] text-acf-dim">
            0°C ES TEMPERATURA AMBIENTE
          </p>
        </div>
      </div>
    </footer>
  );
}

/**
 * One view per route, keyed by the name the router resolves.
 *
 * The site is three pills and four views (S14): Inicio, Competición — one page
 * with the liga, the copa and the club list as tabs, and the tab in the URL —
 * and Logros. `competicion` is therefore the whole old quarter (jornada,
 * clasificación, equipos, copa): the router hands it the tab and the round.
 * `team` has no label of its own: it is one of the eleven, opened from the
 * Equipos tab, and the bar keeps lighting Competición while a reader is on a
 * club's page. `reglamento` has no label either, on purpose — three pills fill
 * the bar — and is opened from the dashboard's rules card and from the footer.
 * Anything else is a fallback, below.
 */
const VIEWS = {
  home: HomeView,
  competicion: CompeticionView,
  logros: LogrosView,
  team: EquipoView,
  reglamento: ReglamentoView,
};

export default function App() {
  const route = matchRoute(useRoute());
  const known = Object.hasOwn(VIEWS, route.name);
  const View = known ? VIEWS[route.name] : HomeView;

  /*
   * A path the site does not have — a typo, a level deeper than one dynamic
   * segment — shows the dashboard and corrects the address bar. Rendering the
   * home page under a URL that names another page would be a page that lies
   * about where it is, and S7 is about URLs people paste into the group.
   *
   * A `/equipo/<slug>` is not one of these: it matches, and the view answers for
   * the slug — a club of this season, or an honest "no conocemos ese club" with
   * the way back to the list. Correcting the address instead would land a mistyped
   * link on our dashboard, which is not the page it named.
   */
  useEffect(() => {
    if (!known) navigate("/", { replace: true });
  }, [known]);

  /*
   * A path the fold retired is served as the tab it became, and the address is
   * corrected in place — `replace`, so the back button does not walk through an
   * alias on the way out. The reader keeps their place: the view has already
   * rendered the right tab from the same match, so nothing flickers.
   */
  useEffect(() => {
    if (route.redirect) navigate(route.redirect, { replace: true });
  }, [route.redirect]);

  return (
    <div className="acf-ambience relative min-h-screen bg-acf-dark text-acf-snow">
      {/*
       * The photograph is the page's ground now, not a band: it sits behind the
       * header and the top of the view, out of focus, and fades into the canvas
       * before the cards get dense (owner, L28).
       */}
      <div className="relative z-10">
        <PageBackdrop />
        <Navbar />
        <main>
          {/* The router's params are handed to whichever view asked for them: the
              tab and the round of `/competicion`, and the club an `/equipo` names. */}
          <View {...route.params} />
        </main>
        <Footer />
      </div>
    </div>
  );
}
