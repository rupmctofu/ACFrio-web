import { useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight, ScrollText } from "lucide-react";
import Card from "./Card.jsx";
import { RULES } from "../../data/rules.js";
import { routeLink } from "../../lib/router.js";

/**
 * The league's nine rules, one at a time, in the squad's own voice.
 *
 * Nine rules stacked in this column were a page and a half: by the time a
 * reader reached the fourth he had stopped reading (S10). So the card shows one
 * rule, with the article number, its title and the sentence that tells him what
 * it costs. Nothing is clamped, truncated or measured against a fixed height —
 * a rule that takes four lines takes four lines, and the card grows by the line
 * it needs. That is the one cost of never hiding a rule behind an ellipsis, and
 * it is paid on purpose; the copy is written short so the swing stays small.
 *
 * The two controls wrap. Nine rules are a loop, not a corridor, so "anterior"
 * on the first rule lands on the ninth instead of greying out — which also keeps
 * both buttons focusable at every position, since a disabled button is not
 * reachable from the keyboard. Each one is a real `<button type="button">` with
 * its own name, 44px square so a thumb finds it on a phone, and a black focus
 * ring: a red ring on the red surface is not a ring.
 *
 * The screen reader hears the new rule because the block they live in is a
 * polite live region, and its first line — hidden on screen, where the visible
 * "3 / 9" already says it — announces the position with the rule ("Regla 3 de
 * 9"). The counter itself is `aria-hidden`: announcing it twice is noise, and
 * `aria-atomic` reads each rule whole rather than its changed words.
 *
 * The ink is plain black (#000) and not a token, and that is measured, not
 * taste: black on --color-acf-red (#e61c24) is 4.56:1, the only value in the
 * system that clears 4.5:1 on this surface. The darkest thing we have,
 * --color-acf-bar (#070709), lands at 4.37:1 and --color-acf-dark (#141416) at
 * 3.99:1, so the near-blacks we would normally reach for fail here, and any
 * transparency on top of black fails harder (black at 90% is 4.33:1 and at 80%
 * is 3.98:1). Every word on this card is therefore full black, and the article
 * label, the title, the sentence and the link differ in size and weight instead
 * of tone.
 *
 * The sizes are chosen for the column this card lives in: at 1440 it is 330px
 * wide, which leaves 282px inside the 24px gutters — about forty-five
 * characters a line at the body size every other card uses. A wider measure
 * here would not fit, and a smaller one would make a one-line rule cost two.
 *
 * Every rule is also on `/reglamento`, which is where the link at the end goes;
 * the card steps through the same list in the document's own order.
 */
export default function RulesCard({ className = "" }) {
  const [index, setIndex] = useState(0);
  const total = RULES.length;
  const rule = RULES[index];

  /* Wrapping, not clamping: index -1 is the last rule and index total is the
     first one, so neither control ever has to be disabled. */
  const step = (delta) => setIndex((current) => (current + delta + total) % total);

  const control =
    "flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-black/30 text-black transition-colors hover:bg-black/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black";

  return (
    <Card
      id="reglamento"
      title="Reglamento"
      hint="Lo que te cuesta no leerlas"
      icon={ScrollText}
      /*
       * The red is the surface and the ink is black, so the shell's own colours
       * are overridden from here: `bg-acf-red` lands after `bg-acf-panel` in
       * the built sheet, and the header's white title and grey hint lose to
       * these descendant selectors on specificity.
       */
      className={`border-black/15 bg-acf-red [&_header_h2]:text-black [&_header_p]:text-black [&_header_span]:border-black/30 [&_header_span]:text-black ${className}`}
      bodyClassName="flex flex-col"
    >
      {/* One rule, whole. The article number is a line of its own now that there
          is room for it, and the title carries the size the block headings have
          on `/reglamento`, so the two surfaces read as the same rule seen twice. */}
      <div
        id="regla-en-pantalla"
        aria-live="polite"
        aria-atomic="true"
        className="px-6 pb-5"
      >
        <p className="sr-only">
          Regla {index + 1} de {total}
        </p>
        <p className="text-micro font-bold uppercase tracking-[0.22em] text-black">
          {rule.article}
        </p>
        <h3 className="mt-2 text-title font-extrabold leading-tight tracking-tight text-black">
          {rule.title}
        </h3>
        <p className="mt-2 text-row font-medium leading-relaxed text-black">{rule.text}</p>
      </div>

      {/* The stepper: previous, position, next. The counter is the visible half
          of what the live region says to a screen reader, so it stays out of the
          accessibility tree rather than being read twice. */}
      <div className="mt-auto flex items-center justify-between gap-2 border-t border-black/20 px-4 py-2">
        <button
          type="button"
          onClick={() => step(-1)}
          aria-label="Regla anterior"
          aria-controls="regla-en-pantalla"
          className={control}
        >
          <ChevronLeft className="h-5 w-5" aria-hidden="true" />
        </button>
        <p
          aria-hidden="true"
          className="text-micro font-bold uppercase tracking-[0.16em] tabular-nums text-black"
        >
          {index + 1} / {total}
        </p>
        <button
          type="button"
          onClick={() => step(1)}
          aria-label="Regla siguiente"
          aria-controls="regla-en-pantalla"
          className={control}
        >
          <ChevronRight className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      {/* The way out of the card and into the full document. The focus ring is
          black because a red ring on the red surface is not a ring. */}
      <a
        {...routeLink("/reglamento")}
        className="flex items-center justify-between gap-3 border-t border-black/20 px-6 py-3.5 text-micro font-bold uppercase tracking-[0.16em] text-black transition-colors hover:bg-black/[0.06] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-black"
      >
        Ver el reglamento completo
        <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
      </a>
    </Card>
  );
}
