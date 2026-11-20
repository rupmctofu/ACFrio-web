import { useEffect, useState } from "react";
import teamData from "../data/teamData.json";
import { matchRoute, routeLink, useRoute } from "../lib/router.js";
import { NavbarIdentity } from "./WhoAreYou.jsx";

/**
 * The three sections of the site (S14). Six pills were one row of labels with no
 * idea behind it; the owner's decision was the other way round: three, with the
 * three competition pages folded into one that carries its own tabs.
 *
 * `Competición` points at its first tab, which is what `/competicion` lands on
 * any way, so the pill is a real address and not a redirect.
 */
const NAV_LINKS = [
  { label: "Inicio", path: "/", name: "home" },
  { label: "Competición", path: "/competicion/liga", name: "competicion" },
  { label: "Logros", path: "/logros", name: "logros" },
];

/**
 * Which pill lights up for a route. The whole Competición section is one pill —
 * every `/competicion/*` path lights it, tabs included — and a club's own page
 * belongs to it too: it is one of the eleven, opened from the club list that
 * both tabs carry, and the bar should keep saying where the reader is rather
 * than going blank.
 */
const SECTION_OF_ROUTE = {
  home: "home",
  competicion: "competicion",
  team: "competicion",
  logros: "logros",
};

const PILL_BASE =
  "block rounded-full px-3.5 py-1.5 text-[0.8125rem] font-bold tracking-tight transition-colors";
const PILL_ACTIVE = "bg-acf-red text-white";
const PILL_IDLE =
  "text-acf-snow/60 hover:text-white hover:bg-white/[0.06]";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const path = useRoute();
  const route = matchRoute(path);
  const activeName = SECTION_OF_ROUTE[route.name] ?? null;
  const { club } = teamData;

  // The header gains its backdrop once the page has moved. This used to drive
  // the active pill too, by watching which section crossed the header line; the
  // pill now follows the path, so only the backdrop is left to the scroll.
  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 24);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  // A route change closes the phone menu, so the reader lands on the new view
  // instead of on a menu that is still open over it. It watches the path and not
  // the route name: switching tab inside Competición is a navigation too, and
  // the name stays the same across it.
  useEffect(() => {
    setMenuOpen(false);
  }, [path]);

  return (
    <header
      className={`fixed left-0 right-0 top-0 z-50 transition-colors duration-300 ${
        scrolled
          ? "border-b border-acf-line bg-acf-dark/85 backdrop-blur-md"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <nav className="wrap flex h-[4.5rem] items-center justify-between gap-4">
        <a
          {...routeLink("/")}
          aria-label="Ir al inicio"
          className="flex items-center gap-3"
        >
          <img src={club.logo} alt={club.name} className="h-11 w-auto" />
          <span className="leading-none">
            <span className="block text-xl font-extrabold tracking-tight text-white">
              AC <span className="text-acf-red">FRÍO</span>
            </span>
            <span className="mt-1.5 hidden text-[0.625rem] font-semibold uppercase tracking-[0.3em] text-acf-grey sm:block">
              FÚTBOL 7 · EST. 2026
            </span>
          </span>
        </a>

        <ul className="hidden items-center gap-0.5 rounded-full border border-acf-line bg-acf-panel/70 p-1 lg:flex">
          {NAV_LINKS.map((link) => {
            const active = activeName === link.name;
            return (
              <li key={link.path}>
                <a
                  {...routeLink(link.path)}
                  aria-current={active ? "page" : undefined}
                  className={`${PILL_BASE} ${active ? PILL_ACTIVE : PILL_IDLE}`}
                >
                  {link.label}
                </a>
              </li>
            );
          })}
        </ul>

        <div className="flex items-center gap-3">
          {/* The identity took the place of the "Próximo Partido" button: the bar
              navigates, so the one pill on the right answers who is looking, and
              now also changes it — it is the only identity surface in the app. */}
          <NavbarIdentity />
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="rounded-full border border-acf-line p-2 text-acf-snow transition-colors hover:text-white lg:hidden"
            aria-label="Abrir menú"
            aria-expanded={menuOpen}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </nav>

      {menuOpen && (
        <div className="border-t border-acf-line bg-acf-dark/95 backdrop-blur-md lg:hidden">
          <ul className="space-y-1 px-4 py-3">
            {NAV_LINKS.map((link) => {
              const active = activeName === link.name;
              const props = routeLink(link.path);
              return (
                <li key={link.path}>
                  <a
                    {...props}
                    onClick={(event) => {
                      props.onClick(event);
                      setMenuOpen(false);
                    }}
                    aria-current={active ? "page" : undefined}
                    className={`${PILL_BASE} ${active ? PILL_ACTIVE : PILL_IDLE}`}
                  >
                    {link.label}
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </header>
  );
}
