/**
 * Card shell for the home grid: rounded panel surface, hairline border and a
 * heavy sentence-case title with an uppercase micro-label underneath.
 * The clipped corner is gone from the whole card language.
 *
 * A card whose numbers come from somewhere else can pass `href`, and the corner
 * mark becomes the link to that source: same circle, same icon, same size, no
 * label in the page — the destination is named only for assistive tech, because
 * an icon alone must still say where it goes.
 */
export default function Card({
  id,
  title,
  hint,
  icon: Icon,
  href,
  linkLabel,
  className = "",
  bodyClassName = "",
  children,
}) {
  const mark = "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-acf-line text-acf-grey";

  return (
    <article
      id={id}
      className={`card relative flex scroll-mt-24 flex-col overflow-hidden rounded-card border border-acf-line bg-acf-panel shadow-acf ${className}`}
    >
      <header className="flex items-start justify-between gap-3 px-6 pb-3.5 pt-6">
        <div className="min-w-0">
          <h2
            id={id ? `${id}-title` : undefined}
            className="text-title font-extrabold leading-tight tracking-tight text-white"
          >
            {title}
          </h2>
          {hint ? (
            <p className="mt-2 line-clamp-2 text-hint font-semibold uppercase leading-snug tracking-[0.2em] text-acf-grey">
              {hint}
            </p>
          ) : null}
        </div>
        {Icon ? (
          href ? (
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              aria-label={linkLabel ?? `Abrir la fuente oficial de ${title}`}
              className={`${mark} focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acf-red`}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
            </a>
          ) : (
            <span className={mark}>
              <Icon className="h-4 w-4" />
            </span>
          )
        ) : null}
      </header>
      <div className={`flex-1 ${bodyClassName}`}>{children}</div>
    </article>
  );
}
