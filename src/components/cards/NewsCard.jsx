import { Newspaper } from "lucide-react";
import { newsDisclaimer, newsItems } from "../../data/news";
import Card from "./Card.jsx";

/**
 * Satirical feed for the centre column, under the next-match card. Every item
 * is invented by the club, on purpose, and the disclaimer below says so, so
 * no headline reads as reporting.
 */
export default function NewsCard({ className = "" }) {
  const items = newsItems();

  return (
    <Card
      title="Noticias del Frío"
      hint="Humor de vestuario"
      icon={Newspaper}
      className={className}
      bodyClassName="flex min-h-0 flex-col"
    >
      <ul className="min-h-0 flex-1 divide-y divide-acf-line-soft overflow-y-auto">
        {items.map((item, index) => (
          <li key={item.id} className="flex gap-3 px-6 py-3">
            <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-acf-line bg-acf-panel-light text-[9px] font-bold tabular-nums text-acf-grey">
              {items.length - index}
            </span>
            <div className="min-w-0">
              <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-acf-dim">
                {item.tag}
              </p>
              <p className="mt-1 text-[13px] leading-snug text-acf-snow">{item.text}</p>
            </div>
          </li>
        ))}
      </ul>
      <p className="border-t border-acf-line-soft px-6 py-3 text-[10px] leading-snug text-acf-dim">
        {newsDisclaimer}
      </p>
    </Card>
  );
}
