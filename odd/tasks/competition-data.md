# Competition data: real calendar, standings and cup

Feature: replace the invented AC FRÍO competition data in the web with the real 3ª Divisió Grup B and
Copa 2027 Grup B published by CEGARRAF, and rework the visual language. Branch `feature/competition-data`.
Status: T1–T7 in progress; the visual rework (T8) waits for the owner's reference image.

## Specs

- **S1** — Owner: "que sepamos cuando es el próximo partido, contra quién jugamos". The home screen
  names the next fixture from real data: opponent, competition, date, time and field.
- **S2** — Owner: "que el calendario esté disponible en la web de una manera con nuestra gráfica".
  A calendar section renders the full real season (14 jornadas) in the club's own visual language.
- **S3** — Owner: "que cojas los logos de todos los equipos y hacerlo chulo". Every team in the
  standings and the calendar shows its real crest, served from the repository (no hotlinking).
- **S4** — Owner: "que se vea la clasificación real". The standings table shows the real 3ª Divisió
  Grup B table from the official source, AC FRÍO included, with positions, played, results, goals and points.
- **S5** — Owner: "que se vea también la copa con una sección también que esté incluida". A cup
  section shows the real Copa 2027 Grup B table and fixtures.
- **S6** — Owner: "cambiar los estilos de los botones. Esta esquina recortada no me gusta". Buttons
  drop the clipped corner (`clip-edge`) while the rest of the card language is untouched.
- **S7** — Owner: "Me gustaría darle un rework a cómo se ve visualmente te miró una referencia y te
  paso". The visual rework follows the owner's reference image, which is still pending.

## Source facts (measured, not assumed)

- Official hub: `https://www.cegarraf.cat/esport-popular/lliga-comarcal-futbol-7/` (WordPress, no API).
- Calendar and table live on `cegarraf.gespic.com` at plain **GET** paths: `/calendari/<season>/ceg/futbol/senior/<competition>` and `/classificacio/...`.
- Both pages are UTF-8 and return the **whole season in one response**; the Joomla POST filter is not needed.
- There is no CORS restriction to worry about because data is fetched at build time, never from the browser.
- Team crests are inline in both pages (`/images/thumbs/80x80/...` in the calendar, `20x20` in the table,
  `100x100` on the team page). Thumb URLs carry a per-size hash, so they must be parsed, never constructed.
- League: 3ª Divisió Grup B, 7 teams, 14 jornadas, Thursdays 22:30, Camps ANNEX 3/4/5.
- Cup: LA COPA 2027 Grup B, 6 teams, AC FRÍO included.

## Tasks

- **T1** — Data sync script `scripts/sync-competition.mjs`: fetch, parse, write `src/data/competition.json`. Covers S2, S4, S5.
- **T2** — Download the real crests of all teams into `public/assets/badges/`. Covers S3.
- **T3** — Calendar section fed by `competition.json`. Covers S2.
- **T4** — Standings section with the real table and crests. Covers S3, S4.
- **T5** — Cup section (table + fixtures). Covers S5.
- **T6** — Next-match card on the home screen from real data. Covers S1.
- **T7** — Remove the clipped corner from buttons only. Covers S6.
- **T8** — Visual rework from the owner's reference image. Covers S7. Blocked: the image was announced, not received.

## Log

- **L1** (owner, verbatim): "Vale, quiero que cuando entremos en la web que sea funcional, que sepamos
  cuando es el próximo partido, contra quién jugamos, que el calendario esté disponible en la web de una
  manera con nuestra gráfica, que cojas los logos de todos los equipos y hacerlo chulo que se vea la
  clasificación real, que se vea también la copa con una sección también que esté incluida y eso y
  básicamente también me gustaría cambiar los estilos de los botones. Esta esquina recortada no me gusta.
  Me gustaría darle un rework a cómo se ve visualmente te miró una referencia y te paso"
- **L2** (prior context): the owner had already given this information in the `rupfit` project, where the
  match-day source was recorded as unreadable *from the browser* (POST form, no CORS). That limitation does
  not apply server-side: plain GET returns the full season.
- **L3** (measured): current site data is invented — `matchData.json` carries "Los Charcos FC", Jornada 9,
  2026-09-18, and `Standings.jsx` derives its table with a `useMemo` over those fake results.
