# Competition data: real calendar, standings and cup

Feature: replace the invented AC FRÍO competition data in the web with the real 3ª Divisió Grup B and
Copa 2027 Grup B published by CEGARRAF, and rework the home into a grid of cards. Branch
`feature/competition-data`. Status: home grid, standings, form, fixtures slider, cup and scorers card are
live on real data; the scorers card stays partial and the player photos stay placeholders until the owner
supplies them (T9, T11).

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

- **S8** — Owner: "estos serían un par de ejemplos no te guíes de los colores, sino de la estructura".
  The home becomes a grid of cards (bento): the centre card is the next match with the club's own
  crest; the side cards carry the standings, a scorers card, a slider of the following fixtures with
  their dates, and the cup.
- **S9** — Owner: "quitar toda la información que no sea relevante, que te la hayas inventado, que sea
  como para decorar, la quitamos y nos basamos en cosas chulas que nos gusten y que sean interesantes".
  Invented or decorative content is removed rather than restyled.
- **S10** — Owner: "puedes coger todas las fotos de los jugadores si no las tengo yo te las puedo pasar".
  Real player photos may replace the current placeholder portraits when the owner provides them.

## Source facts (measured, not assumed)

- The "actas" published by the hub (`ACTA-1/2/3-*.pdf`) are **committee minutes** (sanctions, resolutions),
  not match reports. No goalscorer data exists anywhere on the official source, so a scorers card can
  only come from data the owner provides.

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
- **T8** — Bento home: grid of cards with the next match at the centre and standings, scorers, form,
  fixtures slider and cup around it. Covers S8. Done.
- **T9** — Scorers card. Covers S8. Built on the club's own record; partial until the owner names the
  remaining two goals.
- **T10** — Remove the invented sections (La Armadura, Vestuario awards, MVP, scorers, "Pachanga Arena",
  fabricated player stats) and any decorative fake data. Covers S9. Done.
- **T11** — Real player photos when the owner provides them. Covers S10. Blocked: the images arrived only
  inside the chat and are not on disk, so they cannot be cut or served yet.

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
- **L4** (owner, reference images + verbatim): "en cuanto a la interfaz, estos serían un par de ejemplos no
  te guíes de los colores, sino de la estructura. Me gustaría que fueran como en cajas donde la del centro
  tal vez fuera como próximo partido tal no se quede con nuestro logo y que en los laterales hubiera, por
  ejemplo, la clasificación otra cajita que fuera como top goleadores, otro que igual fueron Slider que
  pudiera sirviendo los siguientes partidos y las fechas otra que subiera la Copa. Es toda esta información
  que fueran cajitas y fuera visualmente creo que puedes coger todas las fotos de los jugadores si no las
  tengo yo te las puedo pasar sí y quitar toda la información que no sea relevante, que te la hayas
  inventado, que sea como para decorar, la quitamos y nos basamos en cosas chulas que nos gusten y que sean
  interesantes"
- **L5** (owner, club data): goalscorers so far "Jonay 1, Albert 1", with two goals still to name;
  "Albert tiene una tarjeta amarilla". Squad faces arrive as a two-row contact sheet read left to right:
  top row Pablo, Nil, Martí, Marcos, Jonay, Rup, Albert; second row Gio, Geri, Dani, Ander, Cristo, Chepa;
  plus Cristian in a separate image. Neither image is on disk, so T11 cannot start.
- **L6** (evidence): the six cards render in the browser in this order — Clasificación, Goleadores, Forma,
  Próximo partido, Calendario, La Copa — and every figure matches `competition.json`.
- **L7** (commits): `8468049` data sync, `5ab6a27` real fixtures and standings, `94742d7` club goalscorers
  and cards, plus the home grid commit that follows this entry.
