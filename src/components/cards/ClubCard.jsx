import teamData from "../../data/teamData.json";

/**
 * Compact club identity strip that opens the centre column of the home grid.
 * It replaces the old full-width hero, so it carries no call to action, no
 * countdown and no buttons. The crest sits beside the name instead of under a
 * card header, which keeps the strip short and free of dead space.
 */
export default function ClubCard({ className = "" }) {
  const { club } = teamData;
  const facts = [
    club.shortName,
    club.founded ? `Est. ${club.founded}` : null,
    club.city,
  ].filter(Boolean);

  return (
    <article
      className={`flex items-center gap-4 rounded-card border border-acf-line bg-acf-panel px-5 py-4 shadow-acf ${className}`}
    >
      <img src={club.logo} alt="" className="h-14 w-auto shrink-0" />
      <div className="min-w-0">
        <h2 className="truncate text-[15px] font-extrabold leading-tight tracking-tight text-white">
          {club.name}
        </h2>
        <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-acf-grey">
          {club.tagline}
        </p>
        <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.14em] text-acf-dim">
          {facts.join(" · ")}
        </p>
      </div>
    </article>
  );
}
