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
  Real player photos replace the placeholder portraits.
- **S11** — Owner: "me gusta esta web como ui/ux pero con el accent color rojo en vez del verde chillón"
  (RIDGELINE golf dashboard, Behance). Adopt that design language with the club red as the single accent:
  near-black canvas, rounded cards on a soft dark surface with a hairline border, heavy sentence-case
  headings, small uppercase micro-labels, outline pill tags and one inverted accent block. The clipped
  corner disappears from the whole card language, not only from buttons.
- **S12** — Owner: "Podríamos eliminar la parte inicial donde sale luego de hace frío con el próximo partido,
  clasificación… que no fuera como un header en top, sino que fuera una pastilla en la columna central, así
  las de la izquierda derecha subirían y que todo sea un grid… que la columna central tuviera primero una
  pastilla con nuestro logo quitar los botones de próxima partida de clasificación y que debajo ponga
  próximo partido". The full-width hero disappears: the grid starts right under the site header, the centre
  column opens with a compact club card carrying the logo, the next-match card sits directly below it, the
  two hero buttons are gone, and the side columns align to the same top edge.
- **S13** — Owner: "el equipo Bardens Aires and New Projects lo puedes llamar solo Dans Aires porque ocupa
  mucho… lo de los puntos de la clasificación se ve todo muy pequeñito… creo que ganaríamos un poco de
  espacio ahí y el scroll del calendario horizontal que sea automático cuando haces scroll normal, porque
  tengo que apretar shift o control". The standings show a shorter display name for BAR DANSAIRES & NIU
  PROJECTES, larger figures and more room; the fixtures slider scrolls horizontally from a plain vertical
  wheel without breaking the page scroll at its ends. The official name stays in the data and only the
  display label is shortened.

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
- **T11** — Real player photos from the club's own contact sheet. Covers S10. Done.
- **T12** — Restyle to the RIDGELINE design language with the club red as the single accent. Covers S11.
- **T13** — Remove the hero, add the club card at the top of the centre column, align the columns. Covers S12.
- **T14** — Short display name, larger standings figures and wheel-driven fixtures slider. Covers S13.
- **T15** — Surface hierarchy (hero next match, red-tinted Goleadores), club card removed. Covers S14, S15.
- **T16** — Attendance card with honest empty state. Covers S16. Blocked on the club's attendance list.
- **T17** — Satirical news feed in the centre column. Covers S17.

- **S14** — Owner: "me gustaría que alguna de las tarjetas tuviera un fondo un poco distinto, por ejemplo el
  de goleadores… más rojo… Lo de próximo partido… más destacado". Three surface levels: hero (next match),
  accent (Goleadores, red-tinted), base (the rest).
- **S15** — Owner: "la primera ficha… con el logo no me dice nada". The club card is removed; the next-match
  card crowns the centre column. Club identity already lives in the fixed header.
- **S16** — Owner: "otra ficha que pusiera partidos asistidos y… quién ha venido a jugar en cada uno de los
  partidos". An attendance card fed by the club's own record; the official source publishes none, so it
  starts as an honest empty state and the club fills it by hand.
- **S17** — Owner: "que fuera como unas noticias y que vayan saliendo noticias ahí en medio en broma sobre
  tal jugador se ha lesionado, tal jugador puesto una excusa mala para no venir… que te inventes unas treinta
  o cuarenta noticias". The centre column gains a satirical news feed under the next-match card, written by
  the assistant, labelled as vestuario humour.

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
- **L8** (owner): "albert ha marcado 2 mas" — the two pending goals belong to Albert, so the record reads
  Albert 3, Jonay 1, which is exactly the 4 league goals the official table reports. The scorers card
  drops its pending and partial lines on its own through `isComplete()`.
- **L9** (owner): the squad photos live in `G:\Mi unidad\Rup\AC FRIO\Collage`; the per-player files are not
  edited, so the portraits are cut from `collage OK.jpg` (7 faces on the top row, 6 on the bottom) plus
  `Cristian.jpg`. "foto rata" is Pablo's nickname, confirmed by the owner. Position and shirt number remain
  unconfirmed and are therefore not shown.
- **L10** (owner, reference): "me gusta esta web como ui/ux pero con el accent color rojo en vez del verde
  chillón" with https://www.behance.net/gallery/257747751/RIDGELINE-Golf-Dashboard-App-Website-Design.
  Measured from the reference: near-black canvas, rounded cards (~24px) on a slightly lighter surface
  without a hard border, heavy sentence-case headings, micro uppercase labels, outline pill tags, big
  numbers as design elements, one solid accent block, and a single accent colour (lime there, club red here).
- **L11** (owner): the short name is "Dansaires" in one word — corrected from the first guess "Dans Aires".
  The alias stays keyed by the official slug so the published name is untouched, and it is used as the
  accessible title wherever the short label is shown.
- **L12** (owner): the squad photo goes behind the page "muy difuminada y burry", and some pill tags should
  read a little reddish. Implemented as a pre-blurred 31KB copy (no live blur cost) under a gradient scrim,
  and as a red tint on our own team's pill so the colour distinguishes us from rivals instead of decorating.
- **L13** (owner): the re-exported cutouts at 264px with real transparency become the card art — the squad
  slider shows each player as a chromo floating on the dark card, and the gray-background collage crops go.
  Chepa is confirmed as the goalkeeper (the only position confirmed so far), and the satire feed's
  "we are looking for a keeper" joke became a Chepa excuse.
- **L16** (owner): final batch before shipping — attendance becomes a ranked 0-100 bar list, tarjetas must scale
  beyond two entries, FormCard retitles "Últimos 3 partidos", the fixtures slider "no se mueve hacia ningún lado"
  (reproduced: mandatory snap ate every sub-half-card wheel delta and pulled the list back while the page was
  blocked — fixed with a held-snap gesture plus drag and chevrons), the hero replaces its four tiles with one
  sentence ("Martes 17 de noviembre a las 22:30 en el Camp ANNEX 3", Condición dropped: every team is from
  Vilanova), a LIGA/COPA red badge at the header's right, a photo gallery (the owner's own 10 candid photos in
  `galeria/`, processed to `public/assets/gallery/galeria-01..10.jpg`, 986 KB; the 4 videos excluded) and a
  horizontal edge-to-edge pitch at the top of Plantilla: line-only SVG, 14 floating cutouts, a ball passed
  boots-to-boots 26px below each receiver so faces stay visible.
- **L15** (owner, correction): the centre column should not hold a long list of news. "que en el centro la
  primera pastilla fuera una pastilla pequeña y que fueran pasando las noticias… con el fondo rojo full rojo
  el texto en negro y que fuera como Breaking News y que vaya pasando el texto de izquierda derecha como un
  lower third de estos de los noticiarios". The 38 items become a TV-style marquee ticker: full-red pill,
  black text, continuous right-to-left scroll. The list card is replaced by it.
- **L14** (owner, attendance): "en el primer partido estuvieron todos"; J2 was dictated with informal
  spellings (Jonai, Jerry, Neil, Martin, Giovanni, Christian, Robert) that map to the squad's canonical
  names; "Idari no es nadie, solo que queria decir 'y Dani' i el micro no entendia". Record: J1 all 14,
  J2 eleven (Jonay, Marcos, Rup, Albert, Chepa, Geri, Nil, Martí, Gio, Pablo, Cristian), J3 nine (Jonay,
  Marcos, Rup, Albert, Nil, Martí, Gio, Pablo, Dani). Every player attended at least one match.
