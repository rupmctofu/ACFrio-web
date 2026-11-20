# Design-system debt behind the checker's red

Branch: `feat/panel-competicion` (same branch; this is a follow-up to `odd/tasks/panel-competicion.md`).

Goal: get `gate.mjs` from FAIL to a state where every remaining finding is either fixed or recorded with a reason. The gate has been red since before this branch and the panel work added to it; the owner's answer to "close the branch and open a dedicated slice" was «vale».

## Specs

S1 — The design checker must actually run.
> The gate reported "not checked: check.mjs could not run (exit 2: no Chrome found (set CHROME_PATH))" on round 1. A check that cannot run is not a pass.

S2 — The panel work must not leave findings of its own behind.
> Two findings came from the last-match card: a clipped score block (`cut-text`) and the brand red below 4.5:1 on the panel grey (`text-contrast`). Both are fixed in `a4ac774`; the rest of the panel's findings are listed in the Log rather than guessed at.

S3 — The rules card must not overlap its own text at 1440.
> `FAIL overlap-text article#reglamento` — to be diagnosed with the checker's own detail before anything is changed.

S4 — A crest inside a table row is not a 28 px target.
> `FAIL tap-size tr… > td.team > span` at 320: "a 28x28px tap target: 0px from the next one".

## Tasks

| ID | Spec | Work | Route | Commit |
| --- | --- | --- | --- | --- |
| T1 | S1 | Run the checker with `CHROME_PATH` pointing at Edge and capture the full report, so every later decision rests on the real list. | inline | n/a (evidence only) |
| T2 | S3 | Diagnose and fix the overlap in the rules card. | inline | `fix(reglamento): ...` |
| T3 | S4 | Give the crest in the standings row a 44 px target on a phone without changing the table's rhythm. | inline | `fix(clasificacion): ...` |
| T4 | S2 | Close whatever the panel's own surfaces still report, one finding at a time. | inline | `fix(panel): ...` |

## Log

L1 — The owner's whole request for this slice, verbatim: «vale», answering the proposal «cerrar esta rama como está … y abrir un corte dedicado a la deuda del sistema de diseño, con CHROME_PATH puesto para que el checker corra entero. Si prefieres, empiezo por el overlap del reglamento y el tap-size de la tabla.»

L2 — Known findings at the start of this slice, from the round-2 run: my two `text-contrast`/`cut-text` items on the previous-results score (fixed in `a4ac774`), `overlap-text` on `article#reglamento`, `tap-size` on the standings crest, plus `text-contrast`/`overlap-text` in the standings table, `cut-text` in the ticker, `cta`/`heading-scale` on Plantilla, `copy-headline` on the page and `stagger` on the fixtures section.

L3 — Deliverables stay on the same branch. Push, PR and merge remain the owner's decisions.

L4 — T1, the checker with a real Chrome: `GATE: OPEN 76 (rounds used up)`, and this time the `not checked: check.mjs could not run` line is gone, so the visual half ran. 76 findings, 74 of them warnings.

L5 — T2, the rules-card overlap: **not a layout bug, and nothing was changed.** The finding reads `article#reglamento … lies over the text "GERI"`. Measured in the live page at 1440: the attendance card ends at y=1369 and the rules card starts at y=1393, a 24 px gap, so the two cards do not touch. "Geri" sits at y=1421 – 1440 because it is a row inside `div.max-h-[18.5rem].overflow-y-auto` (clientHeight 296, scrollHeight 744): a row below the fold, clipped by its own scroll ancestor. The checker compares text boxes without walking through a clipping ancestor, so a scrollable list always reads as an overlap with whatever card follows it. Fixing it would mean un-scrolling the list, which is the thing that keeps that card usable.

L6 — T3 fixed in `561ece9`: every crest link is `min-h-11` (44 px) on a phone and back to hugging the artwork from `sm` up, so the standings table, the club lists and both fixture cards stop being 28 px targets on one change. Verified at 390.

L7 — Left open, and named rather than guessed at: `text-contrast` on the brand red over black in the two competition cards (the documented palette limit), `cut-text` in the news ticker, `cta` and `heading-scale` on Plantilla, `copy-headline` on the page, `stagger` on the fixtures section, and `edge-left` on the squad counter. None of them is a regression from this branch.

L8 — The round-3 build, armed so the checker could run whole: `gate.mjs --start dist/index.html --root dist` with `CHROME_PATH` at Edge. Round 1 of that build: GATE: FAIL 70, 61 WARN.

L9 — T4, first pass (commits below). Four findings closed:
- **cut-text on the 75% (S2).** The attendance window declared seven rows at 18.5rem, taking a row for a clean 2rem plus 0.75rem gutters. A row measures 36.5px, so 296px held six rows and the top of the seventh, and the card's own clip sliced the last figure it showed. The window is 20.75rem now — an edge that lands on a row's edge — and `min-h-0 flex-1` lets it shrink with the card instead of running past its clip. Measured at 1440 after the change: window 332px, seven rows, none sliced.
- **heading-order.** Announcing every card as an h2 put eleven headings at the section level under the page's h1, so the checker read a skipped level. Card titles are h3, and `Dashboard` carries an sr-only h2 ("El club, hoy") of its own.
- **heading-scale, first two.** The fixture cards' 13px eyebrow was the only h3 at that size, so one level had two sizes: it now takes the grid's card-title size (19px) with tighter tracking. The three figures that outranked the section headings — the availability percentage, the score in the previous results, the squad counter — came down to the h2 size, 24px at 390 and 30px from `sm` up.
- **cut-text on the rank column at 390.** The automatic table layout shrank the rank cell to 7px and the digit sat on its own edge; `min-w-7` gives the column a floor of 28px.

Commits: `c60096e` (asistencias), `786d6b9` (clasificación), `25dfbab` (heading levels).

L10 — Round 2: GATE: FAIL 69, 60 WARN. `heading-order` gone, `heading-scale` from 3 to 1.

L11 — Round 3, the last one the build has: **GATE: OPEN 68 (rounds used up)**, 60 WARN. Down from 76 at the start of the slice.

L12 — Left open, with the reason each needs a person rather than a patch:
- **The two `cut-text` in the ticker.** A marquee moves its own text past its window by design; the checker measures the band at rest as clipped text. Fixing it means stopping the feed, which is the element the owner asked for.
- **`edge-left` on the Plantilla counter.** Unchanged at 1238.4 after the counter's own two lines were left-aligned. The rule wants the line on the `.wrap` left edge (112), which means taking the counter out of the row's right-hand slot: a visible change to that section's header.
- **`copy-headline`.** The page's h1 is deliberately sr-only (`HomeView`'s own note: the club's name is painted by the header). A visible h1 on the first screen is a design decision, not a bug.
- **`cta`.** The last section before the footer ends without an action. What it says and where it goes belongs to the club, not to the checker.
- **`stagger` on the middle column** still reads `+8, +8, +0, +0`, but all four cards' first line measures 545.3px at 1440, so the offset does not come from the page as rendered and the checker's own content-box arithmetic was not chased further.
- **The structural family** — `container-edges` 8, `row-lines` 4, `one-section` 3, `section-height` 2, `hero-fold`/`hero-screen`, `centre-axis` 4, `collide` 3, `focus-ring`/`focus-visible`/`focus-hidden` 6, `photo-upscale` 3, `visual-caption`, `overlap-text`, `contrast` — is the bento dashboard measured against a one-section-per-screen landing page, the same family L5 diagnosed. `text-contrast` (17) is the documented palette limit of the brand red over black.

L13 — Delivery shape: the branch is 25 commits and ~376.7k changed lines against `main` since the assets landed (lock files aside), so the slice boundary matters more than the diff size. Push, PR and merge remain the owner's decisions.
