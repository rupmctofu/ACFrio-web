import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import teamData from "../data/teamData.json";

const navLinks = [
  { label: "Partidos", href: "#partidos" },
  { label: "Clasificación", href: "#clasificacion" },
  { label: "Copa", href: "#copa" },
  { label: "Plantilla", href: "#plantilla" },
];

/** Fixed header height plus a small breath: the line the sections cross. */
const HEADER_READ_LINE = 72;

const PILL_BASE =
  "block rounded-full px-3.5 py-1.5 text-[13px] font-bold tracking-tight transition-colors";
const PILL_ACTIVE = "bg-acf-red text-white";
const PILL_IDLE =
  "text-acf-snow/60 hover:text-white hover:bg-white/[0.06]";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeId, setActiveId] = useState(null);
  const { club } = teamData;

  // One listener drives both the header backdrop and the active nav pill: the
  // section whose top is closest above the header line is the one the reader
  // entered most recently, so the pill advances as the cards scroll by.
  useEffect(() => {
    const sections = navLinks
      .map((link) => document.getElementById(link.href.slice(1)))
      .filter(Boolean);

    const update = () => {
      setScrolled(window.scrollY > 24);
      let currentId = null;
      let currentTop = Number.POSITIVE_INFINITY;
      for (const section of sections) {
        const { top } = section.getBoundingClientRect();
        if (top <= HEADER_READ_LINE && top < currentTop) {
          currentTop = top;
          currentId = section.id;
        }
      }
      setActiveId(currentId);
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <header
      className={`fixed left-0 right-0 top-0 z-50 transition-colors duration-300 ${
        scrolled
          ? "border-b border-acf-line bg-acf-dark/85 backdrop-blur-md"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <nav className="wrap flex h-[4.5rem] items-center justify-between gap-4">
        <a href="#top" aria-label="Volver al inicio de la página" className="flex items-center gap-3">
          <img src={club.logo} alt={club.name} className="h-11 w-auto" />
          <span className="leading-none">
            <span className="block text-xl font-extrabold tracking-tight text-white">
              AC <span className="text-acf-red">FRÍO</span>
            </span>
            <span className="mt-1.5 block text-[10px] font-semibold uppercase tracking-[0.3em] text-acf-grey">
              FÚTBOL 7 · EST. 2026
            </span>
          </span>
        </a>

        <ul className="hidden items-center gap-0.5 rounded-full border border-acf-line bg-acf-panel/70 p-1 lg:flex">
          {navLinks.map((link) => {
            const active = activeId === link.href.slice(1);
            return (
              <li key={link.href}>
                <a
                  href={link.href}
                  aria-current={active ? "true" : undefined}
                  className={`${PILL_BASE} ${active ? PILL_ACTIVE : PILL_IDLE}`}
                >
                  {link.label}
                </a>
              </li>
            );
          })}
        </ul>

        <div className="flex items-center gap-3">
          <a
            href="#partidos"
            className="hidden items-center gap-2 rounded-full bg-acf-red px-4 py-2 text-row font-bold tracking-tight text-white transition-colors hover:bg-acf-red-dark sm:flex"
          >
            Próximo Partido
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
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
            {navLinks.map((link) => {
              const active = activeId === link.href.slice(1);
              return (
                <li key={link.href}>
                  <a
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    aria-current={active ? "true" : undefined}
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
