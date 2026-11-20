import { ArrowUpRight, FileText } from "lucide-react";
import { OFFICIAL_PDF, RULES } from "../data/rules.js";

/**
 * `/reglamento` — the league's rules, in the club's Spanish.
 *
 * The document is the Consell Esportiu del Garraf's, and it is written in
 * Catalan. This page is a summary: it carries nine articles, each with the
 * number it has in the original, and it says in the first paragraph that the PDF
 * is the authority. The one link on the page opens that PDF in a new tab — with
 * `rel="noreferrer"`, because it leaves the site — and the page is reached from
 * the dashboard's rotating card and from the footer, never from the bar: six
 * labels fit at 1024 and a seventh does not.
 *
 * The blocks are an ordered list, not a wall of prose: a player looking up an
 * article reads the number in red at the top of the block and stops there. The
 * rule `id` is the block's own anchor, so `/reglamento#ausencias` lands on the
 * clause someone just quoted in the group chat.
 */
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
            Esto es un resumen en castellano del reglamento del Consell Esportiu del
            Garraf, que está escrito en catalán. La autoridad es el documento
            oficial: si algo de aquí no coincide con él, gana él.
          </p>
        </header>

        {/* Two columns on a wide screen: nine short blocks, each one the length
            of a breath, read better beside each other than stacked. */}
        <ol className="mt-10 grid grid-cols-1 gap-x-10 gap-y-9 sm:grid-cols-2">
          {RULES.map((rule) => (
            <li
              key={rule.id}
              id={rule.id}
              className="scroll-mt-24 border-t border-acf-line pt-5"
            >
              <p className="text-micro font-bold uppercase tracking-[0.22em] text-acf-red-soft">
                {rule.article}
              </p>
              <h2 className="mt-2 text-title font-extrabold leading-tight tracking-tight text-white">
                {rule.title}
              </h2>
              <p className="mt-2 text-row leading-relaxed text-acf-snow/70">{rule.text}</p>
            </li>
          ))}
        </ol>

        {/* The one external link on the page, at the end, where a reader who has
            just found their rule goes to check it. */}
        <div className="mt-12 flex flex-col gap-5 rounded-card border border-acf-line bg-acf-panel p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div className="max-w-xl">
            <h2 className="flex items-center gap-2.5 text-title font-extrabold tracking-tight text-white">
              <FileText className="h-5 w-5 shrink-0 text-acf-red" aria-hidden="true" />
              El PDF manda
            </h2>
            <p className="mt-2 text-row leading-relaxed text-acf-grey">
              El original completo, en catalán y sin interpretación. Nueve reglas
              resumidas aquí no son nueve reglas: son las que te van a tocar.
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
