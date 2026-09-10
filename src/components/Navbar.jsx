import { useEffect, useState } from "react";
import teamData from "../data/teamData.json";
import matchData from "../data/matchData.json";

const navLinks = [
  { label: "Inicio", href: "#inicio" },
  { label: "Partidos", href: "#partidos" },
  { label: "Plantilla", href: "#plantilla" },
  { label: "La Armadura", href: "#armadura" },
  { label: "Clasificación", href: "#clasificacion" },
  { label: "El Vestuario", href: "#vestuario" },
];

function formatKickoff(iso) {
  const date = new Date(iso);
  const day = date.toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short" });
  const time = date.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
  return `${day} · ${time}`;
}

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { club } = teamData;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-acf-dark/90 backdrop-blur-md border-b border-acf-line shadow-acf"
          : "bg-transparent"
      }`}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <a href="#inicio" className="flex items-center gap-2.5 group">
          <img
            src={club.logo}
            alt={club.name}
            className="h-11 w-auto transition-transform duration-300 group-hover:scale-105"
          />
          <span className="font-display text-2xl tracking-wider leading-none">
            AC<span className="text-red-gradient"> FRÍO</span>
            <span className="block text-[9px] font-body font-semibold tracking-[0.35em] text-acf-grey">
              FÚTBOL 7 · EST. 2026
            </span>
          </span>
        </a>

        <ul className="hidden lg:flex items-center gap-7">
          {navLinks.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="text-sm font-medium text-acf-snow/70 hover:text-white transition-colors relative group py-1.5"
              >
                {link.label}
                <span className="absolute left-0 -bottom-0.5 h-[2px] w-0 bg-acf-red transition-all duration-300 group-hover:w-full" />
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-3">
          <a
            href="#partidos"
            className="hidden sm:flex items-center gap-2 bg-acf-red hover:bg-acf-red-dark text-white text-sm font-bold px-4 py-2 clip-edge transition-colors anim-pulse-red"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
            </span>
            Próximo Partido
          </a>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="lg:hidden p-2 text-white hover:text-acf-red transition-colors"
            aria-label="Abrir menú"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
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
        <div className="lg:hidden bg-acf-panel border-t border-acf-line">
          <ul className="px-4 py-3 space-y-1">
            {navLinks.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="block px-3 py-2.5 text-sm font-medium text-acf-snow/80 hover:text-white hover:bg-acf-panel-light transition-colors"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </header>
  );
}