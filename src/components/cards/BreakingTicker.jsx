import { useEffect, useMemo, useRef, useState } from "react";
import { Megaphone } from "lucide-react";
import { newsItems } from "../../data/news";

/**
 * TV-style lower third: the vestuario feed scrolls right to left inside a red
 * pill, which is the shape the owner asked for instead of a long list.
 *
 * There is no label: the feed owns the whole pill, so the first headline is
 * already visible. The speed is a constant rate in pixels per second rather
 * than a fixed duration, so adding or shortening headlines never turns the
 * loop into a crawl.
 *
 * The track renders the feed twice and translates exactly half its width, so
 * the loop is seamless. Reduced-motion readers get a static start instead of
 * the marquee.
 */
const PIXELS_PER_SECOND = 62;

export default function BreakingTicker({ className = "" }) {
  const items = useMemo(() => newsItems(), []);
  const trackRef = useRef(null);
  const [duration, setDuration] = useState(null);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const measure = () => {
      // One copy of the feed; the animation shifts the track by half of itself.
      const copy = track.firstElementChild;
      if (!copy) return;
      setDuration(copy.scrollWidth / PIXELS_PER_SECOND);
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(track);
    return () => observer.disconnect();
  }, [items.length]);

  return (
    /*
     * The owner's refined ticker: a dark bar with the loudspeaker as the only
     * red block, so the headlines read like copy instead of an alarm. The live
     * dot at the right end keeps the broadcast feel of the old pill.
     */
    <div
      aria-label="Titulares del club. El texto se desplaza de derecha a izquierda."
      className={`flex h-11 items-center overflow-hidden rounded-full border border-acf-line bg-acf-panel ${className}`}
    >
      <span
        aria-hidden="true"
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-acf-red text-white"
      >
        <Megaphone className="h-4 w-4" />
      </span>

      <div className="min-w-0 flex-1 overflow-hidden">
        <div
          ref={trackRef}
          className="anim-ticker flex w-max items-center"
          style={duration ? { animationDuration: `${duration}s` } : undefined}
        >
          {[0, 1].map((copy) => (
            <div key={copy} aria-hidden={copy === 1} className="flex items-center">
              {items.map((item) => (
                <span
                  key={`${copy}-${item.id}`}
                  className="flex items-center whitespace-nowrap text-[12px] font-semibold text-acf-snow/85"
                >
                  <span className="px-4 text-[7px] tracking-normal text-acf-red" aria-hidden="true">
                    ●
                  </span>
                  {item.text}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      <span aria-hidden="true" className="mr-4 ml-2 h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-acf-red" />
    </div>
  );
}
