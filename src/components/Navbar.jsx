import { useEffect, useState } from "react";
import teamData from "../data/teamData.json";

const navLinks = [
  { label: "Inicio", href: "#inicio" },
  { label: "Partidos", href: "#partidos" },
  { label: "Clasificación", href: "#clasificacion" },
  { label: "Copa", href: "#copa" },
  { label: "Plantilla", href: "#plantilla" },
];

const PILL_BASE =
  "block rounded-full px-3.5 py-1.5 text-[12px] font-semibold tracking-tight transition-colors";
const PILL_ACTIVE = "bg-acf-red text-white";
const PILL_IDLE = "text-acf-snow/60 hover:text-white";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeId, setActiveId] = useState("inicio");
  const { club } = teamData;

  // One listener drives both the header backdrop and the active nav pill: the
  // last section whose top has passed the header is the one being read.
  useEffect(() => {
    const sections = navLinks
      .map((link) => document.getElementById(link.href.slice(1)))
      .filter(Boolean);

    const update = () => {
      setScrolled(window.scrollY > 24);
      let current = sections[0]?.id ?? "inicio";
      for (const section of sections) {
        if (section.getBoundingClientRect().top <= 120) current = section.id;
      }
      setActiveId(current);
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
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <a href="#inicio" className="flex items-center gap-2.5">
          <img src={club.logo} alt={club.name} className="h-9 w-auto" />
          <span className="leading-none">
            <span className="block text-[15px] font-extrabold tracking-tight text-white">
              AC <span className="text-acf-red">FRÍO</span>
            </span>
            <span className="mt-1 block text-[8px] font-semibold uppercase tracking-[0.26em] text-acf-dim">
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
            className="hidden items-center rounded-full bg-acf-red px-4 py-2 text-[12px] font-bold tracking-tight text-white transition-colors hover:bg-acf-red-dark sm:flex"
          >
            Próximo Partido
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
