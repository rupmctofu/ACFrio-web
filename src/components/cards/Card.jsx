/**
 * Card shell for the home grid: rounded panel surface, hairline border and a
 * heavy sentence-case title with an uppercase micro-label underneath.
 * The clipped corner is gone from the whole card language.
 */
export default function Card({
  id,
  title,
  hint,
  icon: Icon,
  className = "",
  bodyClassName = "",
  children,
}) {
  return (
    <article
      id={id}
      className={`card relative flex scroll-mt-24 flex-col overflow-hidden rounded-card border border-acf-line bg-acf-panel shadow-acf ${className}`}
    >
      <header className="flex items-start justify-between gap-3 px-6 pb-3.5 pt-6">
        <div className="min-w-0">
          <h2 className="text-title font-extrabold leading-tight tracking-tight text-white">
            {title}
          </h2>
          {hint ? (
            <p className="mt-2 line-clamp-2 text-hint font-semibold uppercase leading-snug tracking-[0.2em] text-acf-dim">
              {hint}
            </p>
          ) : null}
        </div>
        {Icon ? (
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-acf-line text-acf-grey">
            <Icon className="h-4 w-4" />
          </span>
        ) : null}
      </header>
      <div className={`flex-1 ${bodyClassName}`}>{children}</div>
    </article>
  );
}
