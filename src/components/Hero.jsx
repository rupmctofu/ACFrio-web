import teamData from "../data/teamData.json";

/** Compact club banner. The next match and the countdown live in the grid below. */
export default function Hero() {
  const { club } = teamData;

  return (
    <section
      id="inicio"
      className="relative scroll-mt-20 overflow-hidden pb-10 pt-24 texture-grain sm:pt-28"
    >
      <img
        src="/assets/backgrounds/landing-bg.jpg"
        alt=""
        className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-40"
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-acf-dark/85 via-acf-dark/70 to-acf-dark" />

      <div className="relative mx-auto flex max-w-7xl flex-col items-center px-4 text-center sm:px-6 lg:px-8">
        <img
          src={club.logo}
          alt={club.name}
          className="anim-frost-in h-24 w-auto sm:h-28"
        />
        <h1 className="anim-frost-in delay-100 mt-5 font-display text-5xl tracking-wide uppercase sm:text-6xl">
          {club.name}
        </h1>
        <p className="anim-frost-in delay-200 mt-2 text-[11px] font-bold uppercase tracking-[0.4em] text-acf-grey">
          {club.tagline}
        </p>

        <div className="anim-frost-in delay-300 mt-7 flex flex-col gap-3 sm:flex-row">
          <a
            href="#proximo-partido"
            className="bg-acf-red px-7 py-3 text-sm font-bold text-white transition-colors hover:bg-acf-red-dark"
          >
            Próximo partido
          </a>
          <a
            href="#clasificacion"
            className="border border-acf-line bg-acf-panel/60 px-7 py-3 text-sm font-bold text-acf-snow/80 transition-colors hover:border-acf-red hover:text-white"
          >
            Clasificación
          </a>
        </div>
      </div>
    </section>
  );
}
