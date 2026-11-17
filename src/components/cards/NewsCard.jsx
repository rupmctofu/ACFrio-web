import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Newspaper } from "lucide-react";
import { newsItems } from "../../data/news";
import Card from "./Card.jsx";
import { VOICE } from "../../data/copy.js";

/**
 * How many items the card holds: one featured over the photograph and two
 * quieter ones underneath. More would rebuild the ticker in card form, and the
 * ticker already exists for exactly that.
 */
const WINDOW = 3;

/**
 * The club's own newsroom: the headlines are the ones the squad already tells
 * about itself (the same feed the ticker runs), nothing invented. The featured
 * headline sits on a real project photograph, with its category as the chip;
 * the arrows rotate the window instead of a link that would go nowhere.
 */
export default function NewsCard({ className = "" }) {
  const items = useMemo(() => newsItems(), []);
  const [start, setStart] = useState(0);

  // A shuffled feed changes the front page on every load — the owner's own
  // decision for the ticker, applied to the card too.
  const featured = items[start % items.length];
  const secondary = items
    .slice(start + 1, start + WINDOW)
    .concat(items.slice(0, Math.max(0, start + WINDOW - items.length)));

  const step = (direction) =>
    setStart((current) => (current + direction + items.length) % items.length);

  return (
    <Card
      title="Noticias"
      hint={VOICE.sections.news}
      icon={Newspaper}
      className={className}
      bodyClassName="flex flex-col"
    >
      <div
        aria-label="Noticia destacada del club"
        className="relative isolate mt-1 h-52 overflow-hidden sm:h-56"
      >
        <img
          src="/assets/backgrounds/field-night.jpg"
          alt=""
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/10"
        />

        <span className="absolute left-4 top-4 rounded-full bg-acf-red px-2.5 py-1 text-micro font-bold uppercase tracking-[0.16em] text-white">
          {featured.tag}
        </span>

        {/*
         * The headline rides the photograph under its scrim; it is a headline,
         * not a caption, so it stays a div and the photo carries no caption at
         * all — the house rule the checker enforces.
         */}
        <div className="absolute inset-x-0 bottom-0 p-4">
          <p className="text-balance text-lg font-extrabold leading-snug tracking-tight text-white sm:text-xl">
            {featured.text}
          </p>
        </div>

        <div className="absolute bottom-4 right-4 flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => step(-1)}
            aria-label="Noticia anterior"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-white/25 bg-black/60 text-white transition-colors hover:bg-black/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-acf-red"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => step(1)}
            aria-label="Noticia siguiente"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-white/25 bg-black/60 text-white transition-colors hover:bg-black/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-acf-red"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <ul className="divide-y divide-acf-line-soft">
        {secondary.map((item) => (
          <li key={item.id} className="flex items-start gap-2.5 px-6 py-3">
            <span className="mt-0.5 shrink-0 rounded-full border border-acf-line px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-acf-grey">
              {item.tag}
            </span>
            <p className="min-w-0 flex-1 text-[13px] font-semibold leading-snug text-acf-snow/80">
              {item.text}
            </p>
          </li>
        ))}
      </ul>
    </Card>
  );
}
