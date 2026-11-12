import { newsDisclaimer, newsItems } from "../../data/news";

/**
 * TV-style lower third: a full-red pill with the club-black text where the
 * vestuario satire scrolls continuously from right to left, the way news
 * tickers do. The owner asked for this shape instead of a long list.
 *
 * The track renders the feed twice and translates exactly half its width, so
 * the loop is seamless. Reduced-motion readers get a static start instead of
 * the marquee.
 */
export default function BreakingTicker({ className = "" }) {
  const items = newsItems();

  return (
    <div
      aria-label={`${newsDisclaimer} El titular se desplaza de derecha a izquierda.`}
      className={`flex h-11 items-center overflow-hidden rounded-full bg-acf-red ${className}`}
    >
      <span className="shrink-0 pl-5 pr-3 text-[11px] font-black uppercase tracking-[0.14em] text-acf-dark">
        Breaking News
      </span>
      <div className="min-w-0 flex-1 overflow-hidden">
        <div className="anim-ticker flex w-max items-center">
          {[0, 1].map((copy) => (
            <div key={copy} aria-hidden={copy === 1} className="flex items-center">
              {items.map((item) => (
                <span
                  key={`${copy}-${item.id}`}
                  className="flex items-center whitespace-nowrap text-[12px] font-semibold text-acf-dark"
                >
                  <span className="px-4 text-[7px] tracking-normal" aria-hidden="true">
                    ●
                  </span>
                  {item.text}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
