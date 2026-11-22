import { ArrowUpRight, FileText } from "lucide-react";
import { OFFICIAL_PDF, RULES } from "../data/rules.js";
import { PREAMBLE, REGULATION } from "../data/regulation.js";

/**
 * `/reglamento` — the league's whole rulebook, in the club's Spanish.
 *
 * The document is the Consell Esportiu del Garraf's and it is written in Catalan.
 * This page now carries **all of it**: the initial provisions that sit before
 * article 1, and the nine articles with every one of their clauses (sixty-one),
 * transcribed one by one instead of summarised (owner: «en el apartado de
 * reglamento sí, todo»).
 *
 * Two things are on purpose. The nine quick rules stay at the top, in the club's
 * own voice, because they are what a player comes for — they are the same blocks
 * the dashboard shows, not a second copy of the text. And the page keeps saying,
 * above and at the foot, that the Catalan PDF is the authority: a translation
 * that claims to be the rule itself would be the one lie this page could tell.
 *
 * Every clause keeps the reference it has in the original (`4.14`, `8.3.1`,
 * `2.1 bis`), and each one is its own anchor, so a clause quoted in the group
 * chat can be linked to the clause itself.
 */

/** One article of the original, with the numbered clauses it is made of. */
function Article({ article }) {
  return (
    <section id={`art-${article.n}`} className="scroll-mt-24 border-t border-acf-line pt-5">
      <p className="text-micro font-bold uppercase tracking-[0.22em] text-acf-red-soft">
        Artículo {article.n}
      </p>
      <h3 className="mt-2 text-title font-extrabold leading-tight tracking-tight text-white">
        {article.title}
      </h3>
      <ol className="mt-3 flex flex-col gap-3">
        {article.items.map((item) => (
          <li
            key={item.ref}
            id={`art-${item.ref.replace(/\s+/g, "-").replace(/\./g, "-")}`}
            className="scroll-mt-24"
          >
            <p className="text-row leading-relaxed text-acf-snow/70">
              <span className="mr-2 font-display text-micro font-medium tabular-nums text-acf-red-soft">
                {item.ref}
              </span>
              {item.text}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}

export default function ReglamentoView() {
  return (
    <section className="relative pb-16 pt-28">
      <div className="wrap">
        <header className="max-w-2xl">
          <p className="text-micro font-semibold uppercase tracking-[0.3em] text-acf-red-soft">
            Lliga Comarcal de Futbol 7 · 2026-2027
          </p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Reglamento
          </h1>
          <p className="mt-3 text-row leading-relaxed text-acf-snow/70">
            El reglamento del Consell Esportiu del Garraf, entero y en castellano:
            las disposiciones iniciales y los nueve artículos con todas sus
            cláusulas, traducidos del catalán uno a uno. La autoridad sigue siendo
            el documento oficial: si algo de aquí no coincide con él, gana él.
          </p>
        </header>

        {/* The nine quick rules: the same blocks the dashboard's red card shows,
            in the club's voice. They are the summary the reader wants first. */}
        <h2 className="mt-12 flex items-baseline gap-3 text-title font-extrabold tracking-tight text-white">
          Las nueve que te van a tocar
          <span className="text-micro font-semibold uppercase tracking-[0.16em] text-acf-grey">
            resumen
          </span>
        </h2>
        <ol className="mt-6 grid grid-cols-1 gap-x-10 gap-y-9 sm:grid-cols-2">
          {RULES.map((rule) => (
            <li
              key={rule.id}
              id={rule.id}
              className="scroll-mt-24 border-t border-acf-line pt-5"
            >
              <p className="text-micro font-bold uppercase tracking-[0.22em] text-acf-red-soft">
                {rule.article}
              </p>
              <h3 className="mt-2 text-title font-extrabold leading-tight tracking-tight text-white">
                {rule.title}
              </h3>
              <p className="mt-2 text-row leading-relaxed text-acf-snow/70">{rule.text}</p>
            </li>
          ))}
        </ol>

        {/* The document itself, in the order it arrives: the initial provisions
            first, then the nine articles. */}
        <h2 className="mt-16 text-title font-extrabold tracking-tight text-white">
          El reglamento, entero
        </h2>
        <p className="mt-2 max-w-2xl text-row leading-relaxed text-acf-grey">
          Traducido del original catalán sin resumir. Cada cláusula lleva el número
          que tiene en el PDF.
        </p>

        <section
          id="disposiciones"
          className="mt-10 scroll-mt-24 border-t border-acf-line pt-5"
        >
          <p className="text-micro font-bold uppercase tracking-[0.22em] text-acf-red-soft">
            Antes del artículo 1
          </p>
          <h3 className="mt-2 text-title font-extrabold leading-tight tracking-tight text-white">
            {PREAMBLE.title}
          </h3>
          <ol className="mt-3 flex flex-col gap-3">
            {PREAMBLE.items.map((item) => (
              <li key={item.ref} id={`art-${item.ref}`} className="scroll-mt-24">
                <p className="text-row leading-relaxed text-acf-snow/70">{item.text}</p>
              </li>
            ))}
          </ol>
        </section>

        <div className="mt-10 grid grid-cols-1 gap-x-10 gap-y-9 lg:grid-cols-2">
          {REGULATION.map((article) => (
            <Article key={article.n} article={article} />
          ))}
        </div>

        {/* The one external link on the page, where a reader who has just found
            their clause goes to check it against the authority. */}
        <div className="mt-12 flex flex-col gap-5 rounded-card border border-acf-line bg-acf-panel p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div className="max-w-xl">
            <h2 className="flex items-center gap-2.5 text-title font-extrabold tracking-tight text-white">
              <FileText className="h-5 w-5 shrink-0 text-acf-red" aria-hidden="true" />
              El PDF manda
            </h2>
            <p className="mt-2 text-row leading-relaxed text-acf-grey">
              El original completo, en catalán y sin interpretación. Lo de arriba es
              su traducción: si una coma discute con el PDF, gana el PDF.
            </p>
          </div>
          <a
            href={OFFICIAL_PDF}
            target="_blank"
            rel="noreferrer"
            className="inline-flex shrink-0 items-center gap-2 self-start rounded-full border border-acf-red/45 bg-acf-red/12 px-5 py-2.5 text-micro font-bold uppercase tracking-[0.16em] text-white transition-colors hover:bg-acf-red/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acf-red sm:self-auto"
          >
            Abrir el reglamento oficial (PDF)
            <ArrowUpRight className="h-4 w-4 shrink-0" aria-hidden="true" />
          </a>
        </div>
      </div>
    </section>
  );
}
