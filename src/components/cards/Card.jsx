/**
 * Card shell for the home grid: panel surface, header and clipped corner.
 * Cards keep the club's clip language; only buttons dropped it.
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
      className={`relative flex scroll-mt-24 flex-col overflow-hidden border border-acf-line bg-acf-panel shadow-acf clip-edge-tl ${className}`}
    >
      <header className="flex items-start justify-between gap-3 border-b border-acf-line px-5 py-4">
        <div className="min-w-0">
          <h2 className="font-display text-xl leading-none tracking-[0.2em] text-white uppercase">
            {title}
          </h2>
          {hint ? (
            <p className="mt-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-acf-grey">
              {hint}
            </p>
          ) : null}
        </div>
        {Icon ? <Icon className="h-4 w-4 shrink-0 text-acf-red" /> : null}
      </header>
      <div className={`flex-1 ${bodyClassName}`}>{children}</div>
    </article>
  );
}
