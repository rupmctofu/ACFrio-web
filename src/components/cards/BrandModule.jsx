import teamData from "../../data/teamData.json";

/**
 * The brand module the grid closes with: crest, name and the club's own
 * tagline over the identity's streaks. Every word on it comes from
 * teamData.json; the module exists to give the right column the anchor the
 * mockup's composition needs, without inventing a second slogan.
 */
export default function BrandModule({ className = "" }) {
  const { club } = teamData;

  return (
    <aside
      aria-label={`Marca del club: ${club.name}`}
      className={`card acf-streaks relative flex items-center gap-4 overflow-hidden rounded-card border border-acf-red/25 bg-acf-panel px-6 py-6 ${className}`}
    >
      <img src={club.logo} alt="" className="h-16 w-16 shrink-0" />
      <div className="min-w-0">
        <p className="font-display text-2xl font-semibold uppercase leading-none tracking-[0.02em] text-white">
          AC <span className="text-acf-red">FRÍO</span>
        </p>
        <p className="mt-2 text-row font-semibold leading-snug text-acf-snow/80">
          {club.tagline}
        </p>
      </div>
    </aside>
  );
}
