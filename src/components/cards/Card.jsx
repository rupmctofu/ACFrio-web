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
      className={`relative flex scroll-mt-24 flex-col overflow-hidden rounded-card border border-acf-line bg-acf-panel shadow-acf ${className}`}
    >
      <header className="flex items-start justify-between gap-3 px-5 pb-3 pt-5">
        <div className="min-w-0">
          <h2 className="text-[15px] font-extrabold leading-tight tracking-tight text-white">
            {title}
          </h2>
          {hint ? (
            <p className="mt-1.5 truncate text-[9px] font-semibold uppercase tracking-[0.2em] text-acf-dim">
              {hint}
            </p>
          ) : null}
        </div>
        {Icon ? (
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-acf-line text-acf-grey">
            <Icon className="h-3.5 w-3.5" />
          </span>
        ) : null}
      </header>
      <div className={`flex-1 ${bodyClassName}`}>{children}</div>
    </article>
  );
}
