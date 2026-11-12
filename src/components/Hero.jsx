import teamData from "../data/teamData.json";

/** Compact club banner. The next match and the countdown live in the grid below. */
export default function Hero() {
  const { club } = teamData;

  return (
    <section
      id="inicio"
      className="relative scroll-mt-20 overflow-hidden pb-10 pt-24 sm:pt-28"
    >
      <img
        src="/assets/backgrounds/landing-bg.jpg"
        alt=""
        className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-35"
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-acf-dark/90 via-acf-dark/80 to-acf-dark" />

      <div className="relative mx-auto flex max-w-7xl flex-col items-center px-4 text-center sm:px-6 lg:px-8">
        <img
          src={club.logo}
          alt={club.name}
          className="anim-frost-in h-20 w-auto sm:h-24"
        />
        <h1
          className="anim-frost-in mt-5 text-4xl font-extrabold leading-none tracking-[-0.03em] text-white sm:text-5xl"
          style={{ animationDelay: "80ms" }}
        >
          {club.name}
        </h1>
        <p
          className="anim-frost-in mt-3 text-[10px] font-semibold uppercase tracking-[0.32em] text-acf-dim"
          style={{ animationDelay: "160ms" }}
        >
          {club.tagline}
        </p>

        <div
          className="anim-frost-in mt-8 flex flex-col gap-2.5 sm:flex-row"
          style={{ animationDelay: "240ms" }}
        >
          <a
            href="#proximo-partido"
            className="rounded-full bg-acf-red px-6 py-3 text-[13px] font-bold tracking-tight text-white transition-colors hover:bg-acf-red-dark"
          >
            Próximo partido
          </a>
          <a
            href="#clasificacion"
            className="rounded-full border border-acf-line px-6 py-3 text-[13px] font-semibold tracking-tight text-acf-snow/70 transition-colors hover:border-white/25 hover:text-white"
          >
            Clasificación
          </a>
        </div>
      </div>
    </section>
  );
}
