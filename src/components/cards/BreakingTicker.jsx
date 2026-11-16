import { useEffect, useMemo, useRef, useState } from "react";
import { newsDisclaimer, newsItems } from "../../data/news";

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
    <div
      aria-label={`${newsDisclaimer} El titular se desplaza de derecha a izquierda.`}
      className={`flex h-10 items-center overflow-hidden rounded-full bg-acf-red ${className}`}
    >
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
                  className="flex items-center whitespace-nowrap text-[12px] font-semibold text-acf-dark"
                >
                  <span className="px-3 text-[7px] tracking-normal" aria-hidden="true">
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
