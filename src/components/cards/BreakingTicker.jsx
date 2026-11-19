import { useEffect, useMemo, useRef, useState } from "react";
import { Megaphone } from "lucide-react";
import { newsItems } from "../../data/news";
import { resumeSeconds } from "../../lib/ticker-drag.js";

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
 *
 * The headlines are set like the card's own — uppercase and leaning on the real
 * italic face — but read louder than before: larger, heavier and with a wider
 * inter-letter gap, because the condensed face at 12px read as a squeezed
 * caption instead of a lower third (owner, L32).
 *
 * The loudspeaker is no longer a red disc: it is an icon in the bar's own red,
 * sitting inside the label at the left, so the bar reads as one dark band with a
 * mark in it rather than as a red block glued to a pill. The bar itself is the
 * darkest surface on the page.
 */
const PIXELS_PER_SECOND = 62;

/** The current horizontal offset of the running marquee, in pixels. */
function translateOf(element) {
  const matrix = new DOMMatrixReadOnly(getComputedStyle(element).transform);
  return matrix.m41;
}

const reduceMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export default function BreakingTicker({ className = "" }) {
  const items = useMemo(() => newsItems(), []);
  const trackRef = useRef(null);
  const [duration, setDuration] = useState(null);
  /*
   * Dragging the feed to read a headline again is a hand on the film: while the
   * pointer is down the animation is off and the track follows the finger, and
   * on release the marquee restarts at the same offset so it carries on from
   * where the reader let go instead of jumping back to the beginning.
   */
  const drag = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [resumeFrom, setResumeFrom] = useState(0);

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

  const onPointerDown = (event) => {
    const track = trackRef.current;
    if (!track || reduceMotion() || !duration) return;
    // A mouse only starts a drag on the primary button; touch has no buttons.
    if (event.pointerType === "mouse" && event.button !== 0) return;
    drag.current = { id: event.pointerId, startX: event.clientX, base: translateOf(track) };
    track.setPointerCapture(event.pointerId);
    setDragging(true);
  };

  const onPointerMove = (event) => {
    const track = trackRef.current;
    if (!track || !drag.current || drag.current.id !== event.pointerId) return;
    const offset = drag.current.base + (event.clientX - drag.current.startX);
    track.style.transform = `translateX(${offset}px)`;
  };

  const onPointerUp = (event) => {
    const track = trackRef.current;
    if (!track || !drag.current || drag.current.id !== event.pointerId) return;

    const offset = translateOf(track);
    drag.current = null;
    track.style.transform = "";
    setDragging(false);

    /*
     * The loop moves leftwards at a constant rate, so the distance already
     * travelled converts straight into seconds; the conversion lives in
     * `lib/ticker-drag.js` so it can be tested without a browser.
     */
    setResumeFrom(resumeSeconds(offset, PIXELS_PER_SECOND, duration || 1));
  };

  return (
    /*
     * The owner's refined ticker: a dark bar with the loudspeaker as the only
     * red block, so the headlines read like copy instead of an alarm. The live
     * dot at the right end keeps the broadcast feel of the old pill.
     */
    <div
      aria-label="Titulares del club. El texto se desplaza de derecha a izquierda."
      className={`flex h-12 items-center overflow-hidden rounded-full border border-acf-line bg-acf-bar ${className}`}
    >
      <Megaphone aria-hidden="true" className="ml-4 mr-2 h-5 w-5 shrink-0 text-acf-red" />

      <div
        className={`min-w-0 flex-1 overflow-hidden ${dragging ? "cursor-grabbing" : "cursor-grab"}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        /* Vertical swipes still scroll the page; only horizontal drags are ours. */
        style={{ touchAction: "pan-y" }}
      >
        <div
          ref={trackRef}
          className="anim-ticker flex w-max items-center select-none"
          style={
            !duration
              ? undefined
              : dragging
                ? { animation: "none" }
                : {
                    animationDuration: `${duration}s`,
                    animationDelay: `${-resumeFrom}s`,
                    animationPlayState: "running",
                  }
          }
        >
          {[0, 1].map((copy) => (
            <div key={copy} aria-hidden={copy === 1} className="flex items-center">
              {items.map((item) => (
                <span
                  key={`${copy}-${item.id}`}
                  className="flex items-center whitespace-nowrap font-news text-[1.0625rem] font-semibold uppercase italic tracking-[0.055em] text-acf-snow/90"
                >
                  <span className="px-4 text-[0.4375rem] tracking-normal text-acf-red" aria-hidden="true">
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
