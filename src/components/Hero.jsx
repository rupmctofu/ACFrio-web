import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, ArrowDown } from "lucide-react";
import teamData from "../data/teamData.json";
import matchData from "../data/matchData.json";

function useCountdown(targetIso) {
  const target = useMemo(() => new Date(targetIso).getTime(), [targetIso]);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const diff = Math.max(0, target - now);
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
  };
}

function useVantaFog(ref, onFallback) {
  useEffect(() => {
    let effect = null;
    let cancelled = false;
    (async () => {
      try {
        const [{ default: FOG }, { default: THREE }] = await Promise.all([
          import("vanta/dist/vanta.fog.min.js"),
          import("three"),
        ]);
        if (cancelled || !ref.current) return;
        effect = FOG({
          el: ref.current,
          THREE,
          mouseControls: false,
          touchControls: false,
          gyroControls: false,
          baseColor: 0x0d0d0d,
          midtoneColor: 0xb0141b,
          lowlightColor: 0x161616,
          highlightColor: 0xe61c24,
          speed: 1.2,
          zoom: 1.0,
          blurFactor: 0.7,
        });
        if (!ref.current.querySelector("canvas")) {
          throw new Error("webgl canvas no creado");
        }
        console.info("[Vanta FOG] niebla webgl activa");
      } catch (err) {
        console.warn("[Vanta FOG] no disponible, usando fallback CSS:", err);
        effect?.destroy?.();
        effect = null;
        if (!cancelled) onFallback?.();
      }
    })();
    return () => {
      cancelled = true;
      effect?.destroy();
    };
  }, [ref, onFallback]);
}

function CountdownUnit({ value, label, accent = false }) {
  return (
    <div className="flex flex-col items-center">
      <div
        className={`clip-edge font-display text-3xl sm:text-5xl sm:text-6xl lg:text-7xl tabular-nums leading-none px-3 sm:px-6 py-2 sm:py-3 ${
          accent
            ? "bg-acf-red text-white shadow-red"
            : "bg-acf-panel text-white border border-acf-line"
        }`}
      >
        {String(value).padStart(2, "0")}
      </div>
      <span className="mt-3 text-[10px] sm:text-xs font-bold tracking-[0.35em] uppercase text-acf-grey">
        {label}
      </span>
    </div>
  );
}

export default function Hero() {
  const { club } = teamData;
  const { nextMatch } = matchData;
  const { days, hours, minutes, seconds } = useCountdown(nextMatch.date);
  const fogRef = useRef(null);
  const [fogFallback, setFogFallback] = useState(false);
  const handleFogFallback = useCallback(() => setFogFallback(true), []);
  useVantaFog(fogRef, handleFogFallback);

  const matchDate = useMemo(() => {
    return new Date(nextMatch.date).toLocaleDateString("es-ES", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  }, [nextMatch.date]);

  return (
    <section
      id="inicio"
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden texture-grain pt-16"
    >
      {/* Fondo: campo de noche tenue */}
      <img
        src="/assets/backgrounds/landing-bg.jpg"
        alt=""
        className="absolute inset-0 h-full w-full object-cover pointer-events-none"
      />
      <div className="absolute inset-0 bg-acf-dark/70 pointer-events-none" />

      {/* Niebla Vanta (WebGL) — si falla, fallback CSS */}
      {fogFallback ? (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div
            className="absolute -top-1/4 -left-1/4 w-[150%] h-[60%] anim-fog-1 opacity-20"
            style={{
              background:
                "radial-gradient(ellipse at 30% 50%, rgba(230,28,36,0.35) 0%, transparent 60%)",
            }}
          />
          <div
            className="absolute top-[20%] -right-1/4 w-[140%] h-[50%] anim-fog-2 opacity-15"
            style={{
              background:
                "radial-gradient(ellipse at 70% 40%, rgba(176,20,27,0.3) 0%, transparent 55%)",
            }}
          />
          <div
            className="absolute bottom-[10%] -left-1/4 w-[160%] h-[45%] anim-fog-3 opacity-[0.18]"
            style={{
              background:
                "radial-gradient(ellipse at 50% 60%, rgba(230,28,36,0.28) 0%, transparent 50%)",
            }}
          />
        </div>
      ) : (
        <div ref={fogRef} className="absolute inset-0 pointer-events-none mix-blend-screen opacity-50" />
      )}

      {/* Glow rojo de fondo */}
      <div
        className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[500px] rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(230,28,36,0.18) 0%, transparent 65%)",
        }}
      />
      <div
        className="absolute bottom-0 left-0 right-0 h-40 pointer-events-none"
        style={{
          background: "linear-gradient(to top, #0d0d0d 0%, transparent 100%)",
        }}
      />

      <div className="relative max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center">
        <div className="anim-frost-in delay-100 flex items-center justify-center mb-6">
          <div className="relative">
            <div className="absolute inset-0 bg-acf-red blur-3xl opacity-10 rounded-full scale-150" />
            <img src={club.logo} alt={club.name} className="relative h-44 w-auto sm:h-56 lg:h-60" />
          </div>
        </div>

        <h1 className="anim-frost-in delay-300 mt-4 text-5xl sm:text-6xl lg:text-7xl font-bold tracking-wide text-acf-snow/90 max-w-4xl">
          {club.tagline}
        </h1>

        <div className="anim-frost-in delay-400 mt-14 w-full max-w-3xl">
          <div className="flex items-center justify-center gap-3 mb-6">
            <CalendarDays className="h-4 w-4 text-acf-red" />
            <p className="text-xs sm:text-sm text-acf-grey uppercase tracking-[0.15em] sm:tracking-[0.3em] font-semibold">
              Próximo partido · {matchDate} · {nextMatch.round}
            </p>
          </div>
          <div className="flex items-center justify-center gap-1 sm:gap-3 md:gap-5">
            <CountdownUnit value={days} label="Días" />
            <span className="font-display text-2xl sm:text-4xl sm:text-5xl text-acf-red pb-6 sm:pb-8">:</span>
            <CountdownUnit value={hours} label="Horas" />
            <span className="font-display text-2xl sm:text-4xl sm:text-5xl text-acf-red pb-6 sm:pb-8">:</span>
            <CountdownUnit value={minutes} label="Min" />
            <span className="font-display text-2xl sm:text-4xl sm:text-5xl text-acf-red pb-6 sm:pb-8">:</span>
            <CountdownUnit value={seconds} label="Seg" accent />
          </div>
        </div>

        <div className="anim-frost-in delay-400 mt-12 flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <a
            href="#partidos"
            className="w-full sm:w-auto text-center bg-acf-red hover:bg-acf-red-dark text-white font-bold px-8 py-3.5 clip-edge transition-all hover:shadow-red-lg"
          >
            Ver Partidos
          </a>
          <a
            href="#plantilla"
            className="w-full sm:w-auto text-center border border-acf-line hover:border-acf-red hover:text-white text-acf-snow/80 font-bold px-8 py-3.5 clip-edge transition-all bg-acf-panel/60"
          >
            Conocer la Plantilla
          </a>
        </div>
      </div>

      <a
        href="#partidos"
        className="absolute bottom-6 left-1/2 -translate-x-1/2 text-acf-grey hover:text-acf-red transition-colors"
        aria-label="Bajar a partidos"
      >
        <ArrowDown className="h-6 w-6 anim-float-slow" />
      </a>
    </section>
  );
}