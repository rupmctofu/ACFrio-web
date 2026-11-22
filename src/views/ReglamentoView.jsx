import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowUpRight, Check, Copy, FileText, Search } from "lucide-react";
import { OFFICIAL_PDF, RULES } from "../data/rules.js";
import { PREAMBLE, REGULATION } from "../data/regulation.js";

/**
 * `/reglamento` — the league's whole rulebook, in the club's Spanish, made
 * navigable.
 *
 * The document is the Consell Esportiu del Garraf's and it is written in Catalan.
 * This page carries all of it: the initial provisions that sit before article 1,
 * and the nine articles with every one of their clauses (sixty-one), transcribed
 * one by one instead of summarised (owner: «en el apartado de reglamento sí,
 * todo»).
 *
 * A wall of 3,500 words is not a page anyone reads, so the page gives it three
 * handles. **An index** — the ten sections, fixed beside the text on a wide
 * screen and collapsed on a phone — tells the reader where everything lives.
 * **A search** filters clauses as they type, because with a rulebook the second
 * thing anyone does is look for their word («amarillas», «carnet», «dorsal»).
 * And **every clause is its own address**: hovering it offers a link to copy, so
 * the clause quoted in the group chat can be answered with the clause itself.
 *
 * Two things are on purpose. The nine quick rules stay at the top, in the club's
 * own voice, because they are what a player comes for. And the page keeps saying,
 * above and at the foot, that the Catalan PDF is the authority: a translation
 * that claims to be the rule itself would be the one lie this page could tell.
 *
 * The original text is never rewritten for display. Where it carries its own
 * structure — numbered offences, bullet points, internal headings like
 * «OBLIGACIONES Y DEBERES DE LOS DELEGADOS» — that structure is *shown* (split
 * into blocks, headings emphasised) but every word stays as transcribed.
 */

const SITE_ORIGIN = "https://acfrio.club";

/** Lowercase and strip accents, so «amarillas» finds «Amarillas» and «carné» finds «carnet». */
const fold = (value) =>
  value.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");

/** The ten sections the index lists, in reading order. */
const SECTIONS = [
  { id: "disposiciones", label: "Disposiciones iniciales", count: PREAMBLE.items.length },
  ...REGULATION.map((article) => ({
    id: `art-${article.n}`,
    label: `${article.n}. ${article.title}`,
    count: article.items.length,
  })),
];

/**
 * A clause's text, presented as the document laid it out.
 *
 * The transcription keeps every word; this only *shows* the structure that was
 * already inside it. An internal heading (an all-caps line) becomes a bold line
 * of its own, a numbered offence («1.-») or a bullet («•») becomes its own block,
 * and everything else stays as one paragraph.
 */
function ClauseText({ text }) {
  const blocks = useMemo(() => {
    const parts = text.split(/(?=\b\d+\.\s?-\s)|(?=•\s)/).map((part) => part.trim()).filter(Boolean);
    return parts.length ? parts : [text];
  }, [text]);

  return (
    <>
      {blocks.map((block, index) => {
        // An internal heading: an all-caps run long enough to be one, short
        // enough not to be shouted prose. It gets its own line, in white.
        const isHeading = /^[A-ZÀ-Ú0-9 ,.:()']{12,}$/.test(block.replace(/\.$/, ""));
        return isHeading ? (
          <p
            key={index}
            className="mt-3 text-micro font-bold uppercase leading-relaxed tracking-[0.14em] text-white"
          >
            {block}
          </p>
        ) : (
          <p key={index} className="text-row leading-relaxed text-acf-snow/70">
            {block}
          </p>
        );
      })}
    </>
  );
}

/** One clause: its reference, its text, and — on hover — the link to itself. */
function Clause({ ref_, text, anchor }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  const copy = () => {
    navigator.clipboard
      ?.writeText(`${SITE_ORIGIN}/reglamento#${anchor}`)
      .then(() => {
        setCopied(true);
        clearTimeout(timer.current);
        timer.current = setTimeout(() => setCopied(false), 1600);
      })
      .catch(() => {});
  };

  return (
    <li
      id={anchor}
      className="group/clause relative scroll-mt-28 border-l border-transparent pl-0 transition-colors hover:border-acf-red/50 hover:pl-3"
    >
      <p className="text-row leading-relaxed text-acf-snow/70">
        <span className="mr-2 font-display text-micro font-medium tabular-nums text-acf-red-soft">
          {ref_}
        </span>
        <ClauseText text={text} />
      </p>
      <button
        type="button"
        onClick={copy}
        aria-label={`Copiar el enlace a la cláusula ${ref_}`}
        title="Copiar el enlace a esta cláusula"
        className="absolute -left-8 top-1 hidden h-6 w-6 items-center justify-center rounded-full text-acf-grey transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-acf-red group-hover/clause:flex sm:left-[-2.25rem]"
      >
        {copied ? <Check className="h-3.5 w-3.5 text-acf-red-soft" /> : <Copy className="h-3.5 w-3.5" />}
      </button>
    </li>
  );
}

/** The fixed index: ten sections, the one on screen highlighted. */
function Index({ active }) {
  return (
    <nav aria-label="Índice del reglamento" className="flex flex-col gap-1">
      {SECTIONS.map((section) => {
        const isActive = active === section.id;
        return (
          <a
            key={section.id}
            href={`#${section.id}`}
            aria-current={isActive ? "true" : undefined}
            className={`flex items-baseline justify-between gap-3 rounded-tile px-3 py-1.5 text-micro font-semibold uppercase tracking-[0.1em] transition-colors ${
              isActive
                ? "bg-acf-red/15 text-white"
                : "text-acf-grey hover:bg-white/[0.03] hover:text-white"
            }`}
          >
            <span className="truncate">{section.label}</span>
            <span className={`shrink-0 tabular-nums ${isActive ? "text-acf-red-soft" : "text-acf-dim"}`}>
              {section.count}
            </span>
          </a>
        );
      })}
    </nav>
  );
}

export default function ReglamentoView() {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(SECTIONS[0].id);
  const observerRef = useRef(null);

  const needle = useMemo(() => fold(query.trim()), [query]);

  /* What matches: a clause survives when the search is empty or when its own
     text (or its reference) contains the words, all of them, accents aside. */
  const matches = useMemo(() => {
    const words = needle.split(/\s+/).filter(Boolean);
    const hits = (value) => {
      const hay = fold(value);
      return words.every((word) => hay.includes(word));
    };
    return {
      preamble: PREAMBLE.items.filter((item) => (words.length ? hits(`${item.ref} ${item.text}`) : true)),
      articles: REGULATION.map((article) => ({
        ...article,
        items: article.items.filter((item) => (words.length ? hits(`${item.ref} ${article.title} ${item.text}`) : true)),
      })).filter((article) => article.items.length > 0),
    };
  }, [needle]);

  const searching = needle.length > 0;
  const total = matches.preamble.length + matches.articles.reduce((n, a) => n + a.items.length, 0);

  /* Scroll-spy: the index follows the reading. One observer, rootMargin tuned so
     a section is "current" while its heading is anywhere near the top third. */
  useEffect(() => {
    if (searching) return undefined;
    const targets = SECTIONS.map((section) => document.getElementById(section.id)).filter(Boolean);
    if (!targets.length) return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) if (entry.isIntersecting) setActive(entry.target.id);
      },
      { rootMargin: "-20% 0px -70% 0px" },
    );
    targets.forEach((target) => observer.observe(target));
    observerRef.current = observer;
    return () => observer.disconnect();
  }, [searching]);

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

        {/* The document itself: index and search on the left (fixed on a wide
            screen, collapsed on a phone), the full text on the right. */}
        <div className="mt-16 flex flex-col gap-6 border-t border-acf-line pt-8">
          <h2 className="text-title font-extrabold tracking-tight text-white">
            El reglamento, entero
          </h2>
          <p className="max-w-2xl text-row leading-relaxed text-acf-grey">
            Traducido del original catalán sin resumir. Cada cláusula lleva el
            número que tiene en el PDF.
          </p>

          <label className="relative max-w-md">
            <span className="sr-only">Buscar en el reglamento</span>
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-acf-grey"
              aria-hidden="true"
            />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar: amarillas, carnet, dorsal, aplazamiento…"
              className="w-full rounded-tile border border-acf-line bg-acf-panel py-2.5 pl-10 pr-4 text-row text-white placeholder:text-acf-dim focus-visible:outline focus-visible:outline-2 focus-visible:outline-acf-red"
            />
          </label>

          {/* On a phone the index is a folded list: there when wanted, out of the
              way when not. On a wide screen it is fixed beside the text. */}
          <details className="lg:hidden" open={searching || undefined}>
            <summary className="cursor-pointer select-none text-micro font-bold uppercase tracking-[0.16em] text-acf-red-soft">
              Índice del reglamento
            </summary>
            <div className="mt-3">
              <Index active={active} />
            </div>
          </details>

          {searching ? (
            <p aria-live="polite" className="text-micro font-semibold uppercase tracking-[0.14em] text-acf-grey">
              {total === 0
                ? "Nada coincide con esa búsqueda."
                : `${total} ${total === 1 ? "cláusula coincide" : "cláusulas coinciden"}`}
            </p>
          ) : null}
        </div>

        <div className="mt-8 grid grid-cols-1 gap-x-12 lg:grid-cols-[15rem_minmax(0,1fr)]">
          <aside className="hidden lg:block">
            <div className="sticky top-28">
              <p className="mb-3 text-micro font-bold uppercase tracking-[0.2em] text-acf-dim">
                Índice
              </p>
              <Index active={searching ? "" : active} />
            </div>
          </aside>

          <div className="flex flex-col gap-12">
            {!searching || matches.preamble.length ? (
              <section id="disposiciones" className="scroll-mt-28 border-t border-acf-line pt-5">
                <p className="text-micro font-bold uppercase tracking-[0.22em] text-acf-red-soft">
                  Antes del artículo 1
                </p>
                <h3 className="mt-2 text-title font-extrabold leading-tight tracking-tight text-white">
                  {PREAMBLE.title}
                </h3>
                <ol className="mt-4 flex flex-col gap-4">
                  {matches.preamble.map((item) => (
                    <Clause key={item.ref} ref_={item.ref} text={item.text} anchor={`art-${item.ref}`} />
                  ))}
                </ol>
              </section>
            ) : null}

            {matches.articles.map((article) => (
              <section
                key={article.n}
                id={`art-${article.n}`}
                className="scroll-mt-28 border-t border-acf-line pt-5"
              >
                <p className="text-micro font-bold uppercase tracking-[0.22em] text-acf-red-soft">
                  Artículo {article.n}
                </p>
                <h3 className="mt-2 text-title font-extrabold leading-tight tracking-tight text-white">
                  {article.title}
                </h3>
                <ol className="mt-4 flex flex-col gap-4">
                  {article.items.map((item) => (
                    <Clause
                      key={item.ref}
                      ref_={item.ref}
                      text={item.text}
                      anchor={`art-${item.ref.replace(/\s+/g, "-").replace(/\./g, "-")}`}
                    />
                  ))}
                </ol>
              </section>
            ))}
          </div>
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
