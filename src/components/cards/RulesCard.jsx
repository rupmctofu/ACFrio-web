import { useState } from "react";
import { ArrowRight, ScrollText } from "lucide-react";
import Card from "./Card.jsx";
import { RULES } from "../../data/rules.js";
import { routeLink } from "../../lib/router.js";

/**
 * One of the league's nine rules, picked at random on every page load, in the
 * register of a delegate with a rubber stamp.
 *
 * Nine rules stacked in this column were a page and a half: by the time a
 * reader reached the fourth he had stopped reading (S10). The card then showed
 * one rule with two arrows; the owner asked for one rule that is fixed while he
 * reads it and moves on by itself when the page does («pon que se muestre 1
 * norma aleatoria, fija. y que rote con cada caída de pagina»). So there are no
 * controls: the pick happens once, on mount, and only a fresh load re-rolls it.
 *
 * The text is the rule's `formal` voice — bureaucratic, deadpan, as if written
 * on club letterhead — while `/reglamento` keeps the squad's own. The facts are
 * the same in both; only the register moves.
 *
 * Nothing is clamped, truncated or measured against a fixed height: a rule that
 * takes six lines takes six, and the card grows by the line it needs. That is
 * the one cost of never hiding a rule behind an ellipsis, and it is paid on
 * purpose; the copy is written short so the swing stays small.
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
 * Every rule is also on `/reglamento`, which is where the link at the end goes.
 * The card shows **one rule, chosen at random on every load**, and then stays put:
 * the owner asked for one fixed rule that changes when the page does, instead of
 * a stepper («pon que se muestre 1 norma aleatoria, fija. y que rote con cada
 * caída de pagina»). So there are no arrows and nothing to press: come back and
 * the card has moved on by itself. The text is the rule's `formal` voice —
 * administrative jargon, deadpan — while `/reglamento` keeps the squad's own.
 */
export default function RulesCard({ className = "" }) {
  /* Chosen once, on mount: a random pick per render would change under the
     reader on any state update, and a `useMemo` needs a dependency that does not
     exist here. A fresh page load is the only thing that re-rolls it. */
  const [rule] = useState(() => RULES[Math.floor(Math.random() * RULES.length)]);

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
      {/* One rule, whole, and no controls: the article number is a line of its
          own, and the title carries the size the block headings have on
          `/reglamento`, so the two surfaces read as the same rule seen twice. */}
      <div
        id="regla-en-pantalla"
        className="flex flex-1 flex-col justify-center px-6 pb-5 pt-1"
      >
        <p className="text-micro font-bold uppercase tracking-[0.22em] text-black">
          {rule.article}
        </p>
        <h3 className="mt-2 text-title font-extrabold leading-tight tracking-tight text-black">
          {rule.title}
        </h3>
        <p className="mt-2 text-row font-medium leading-relaxed text-black">
          {rule.formal}
        </p>
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
