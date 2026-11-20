import { ArrowRight, ScrollText } from "lucide-react";
import Card from "./Card.jsx";
import { RULES } from "../../data/rules.js";
import { routeLink } from "../../lib/router.js";

/**
 * The league's nine rules, all of them at once, on the club's red surface with
 * black ink.
 *
 * This card used to rotate one rule every three seconds. The owner asked for it
 * static: nine rules in a list are read, nine rules one at a time are waited
 * for. It is now a plain list in the data's own document order, so the card has
 * no timer, no visibility listener and no pause machinery left to explain.
 *
 * The ink is plain black (#000) and not a token, and that is measured, not
 * taste: black on --color-acf-red (#e61c24) is 4.56:1, the only value in the
 * system that clears 4.5:1 on this surface. The darkest thing we have,
 * --color-acf-bar (#070709), lands at 4.37:1 and --color-acf-dark (#141416) at
 * 3.99:1, so the near-blacks we would normally reach for fail here, and any
 * transparency on top of black fails harder (black at 90% is 4.33:1 and at 80%
 * is 3.98:1). Every word on this card is therefore full black, and the article
 * label, the sentence and the link differ in size and weight instead of tone.
 *
 * The list is one column and not two: the card lives in the narrowest column of
 * the grid (286px at 1440), so splitting it would halve the measure and double
 * the line count — a shorter card in theory, a taller one in practice: measured,
 * two columns land at 1281px against 1086px for this one. It is dense instead,
 * with a hairline between rules and the article number set inline at the head of
 * its own sentence, so nine rules read as one block and the sentence keeps the
 * size every other card uses for body copy.
 *
 * Nothing here is announced or animated, and every rule is also on
 * `/reglamento`, which is where the link at the end goes.
 */
export default function RulesCard({ className = "" }) {
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
      {/* The document's own order, with a rule per hairline: the article number
          opens the sentence it belongs to, because at this width a label on its
          own line would cost nine lines and half of them would be white. */}
      <ol className="flex flex-col border-t border-black/20">
        {RULES.map((rule) => (
          <li key={rule.id} className="border-b border-black/20 px-6 py-2.5 last:border-b-0">
            <p className="text-row font-semibold leading-snug text-black">
              <span className="mr-1.5 text-micro font-bold uppercase tracking-[0.22em] text-black">
                {rule.article}
              </span>{" "}
              {rule.text}
            </p>
          </li>
        ))}
      </ol>

      {/* The way out of the card and into the full document. The focus ring is
          black because a red ring on the red surface is not a ring. */}
      <a
        {...routeLink("/reglamento")}
        className="mt-auto flex items-center justify-between gap-3 border-t border-black/20 px-6 py-3.5 text-micro font-bold uppercase tracking-[0.16em] text-black transition-colors hover:bg-black/[0.06] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-black"
      >
        Ver el reglamento completo
        <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
      </a>
    </Card>
  );
}
