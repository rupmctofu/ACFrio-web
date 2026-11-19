import { useEffect } from "react";
import Navbar from "./components/Navbar.jsx";
import PageBackdrop from "./components/PageBackdrop.jsx";
import teamData from "./data/teamData.json";
import { matchRoute, navigate, useRoute } from "./lib/router.js";
import HomeView from "./views/HomeView.jsx";
import JornadaView from "./views/JornadaView.jsx";
import EquiposView from "./views/EquiposView.jsx";
import ClasificacionView from "./views/ClasificacionView.jsx";
import CopaView from "./views/CopaView.jsx";
import EquipoView from "./views/EquipoView.jsx";

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
 * One view per section (S2), keyed by the name the router resolves.
 *
 * The five labels in the bar are five of the keys: Inicio, Jornada, Equipos,
 * Clasificación and Copa. `team` is the sixth and has no label of its own: it is
 * one of the eleven, opened from Equipos, and the bar keeps lighting Equipos
 * while a reader is on a club's page. Anything else is a fallback, below.
 */
const VIEWS = {
  home: HomeView,
  jornada: JornadaView,
  equipos: EquiposView,
  clasificacion: ClasificacionView,
  copa: CopaView,
  team: EquipoView,
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
              round a `/jornada` names, and the club a `/equipo` names. */}
          <View {...route.params} />
        </main>
        <Footer />
      </div>
    </div>
  );
}
