/**
 * The identity banner: one horizontal band of club, photograph and brand line
 * (owner, S6). It sits between the fixed header and the dashboard grid, so the
 * first screen says whose site this is before any card asks for attention.
 *
 * The photograph is a real project asset, treated dark, and the diagonal
 * streaks are the crest's own motif; neither the image nor the shield is
 * invented. The band keeps a modest height on purpose: it frames the page, it
 * does not push the dashboard below the fold.
 */
export default function BannerIdentity() {
  return (
    <section
      aria-label="AC FRÍO, más que un equipo"
      className="relative isolate h-[190px] overflow-hidden sm:h-[230px]"
    >
      <img
        src="/assets/backgrounds/landing-bg.jpg"
        alt=""
        className="absolute inset-0 h-full w-full object-cover object-center"
        loading="eager"
      />

      {/* Dark treatment: the photo stays visible at the right edge only, where
          the ball and the field live; the type sits on the black it needs. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-black/25"
      />
      <div aria-hidden="true" className="acf-streaks absolute inset-0 opacity-70" />

      <div className="wrap relative flex h-full items-center">
        <div className="max-w-md">
          {/* The banner's headline is the page's only h1: it names the club, so
              every screen reader and the checker land on it first. */}
          <h1
            className="font-display text-[2.6rem] font-semibold uppercase leading-[0.95] tracking-[0.02em] text-acf-red sm:text-6xl"
          >
            AC FRÍO
          </h1>
          <p className="mt-1.5 font-display text-2xl font-medium uppercase leading-tight tracking-[0.04em] text-white sm:text-[1.9rem]">
            Más que un equipo
          </p>
        </div>
      </div>
    </section>
  );
}
