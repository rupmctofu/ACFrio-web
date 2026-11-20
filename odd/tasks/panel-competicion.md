# Panel refresh and a single Competición section

Feature branch: `feat/panel-competicion`. Base checkpoint: `a59a2fa`.

Goal: make the next-match card carry the real weight, shrink the noise that already exists inside the panel (attendance strip, plate boxes, endless rules list, duplicated MVP/form cards), and fold six sections into three without losing content.

Structure work order: nine cut slices on the panel plus the navigation fold. Each slice is one commit.

## Specs

S1 — Photo background on the central card.
> "quiero que pruebes esta foto de fondo en esa tarjeta ... y con el Grady en sutil por encima que vaya de un rojo a un negro abajo"

S2 — The grey strip of absent players goes.
> "quitando la barra negra gris ocupa que hemos puesto donde para los jugadores que no van al partido"

S3 — The reader's own pill carries an X.
> "me gustaría que la pastillita de los jugadores que se iban tuvieran una X la tuya tenga una X"

S4 — No change-plan button; the X unconfirms.
> "quitamos el botón de cambiar planes. Así la X ya lo que hace es decir que no vas, bueno decir que no confirmas que vas y luego voy a decidir si vuelves a darle a Voy o no voy"

S5 — The card that is not next goes fully grey.
> "cuando el próximo partido quedan muchos días, cuando de Copa, por ejemplo, me gustaría que estuviera todo eso en gris, los logos en gris, los nombres en gris, todo en un gris como si estuviera deshabilitado, porque nos centramos en la otra tarjeta ... Cuando el próximo partido sea el de Copa, entonces pondremos el fondo guay en Copa"

S6 — Personal achievements: four rows of three, with a slider.
> "considero que podrían salir cuatro filas de tres columnas y que hubiera slider también, si no ocupa un montón"

S7 — No plate, bigger icon, engraved into the surface.
> "me gustaría verlas sin el recuadro que el icono fuera un poquito más grande sin el recuadro, así solo nos quedaría el icono en oscuro, me gustaría que fuera oscuro que pareciera una hendidura, pero si no se puede hacer ese efecto lo dejamos como el gris más oscuro que el fondo"

S8 — Every achievement opens a short description.
> "me gustaría que fueran clicables y te dijera un pequeño modal con una pequeña descripción, porque ahora mismo hay algunos que pone cosas un poco ambiguas como mi boto y que si lo tocas te explique ... pero que diga has votado diez veces"

S9 — MVP merges into a single "último partido" card above the scorers.
> "lo de MVP creo que lo juntaría con último, en vez de poner últimos tres partidos, pondría último partido lo pondría arriba de coreadores y que ponga último partido tal, tal votar en VP y luego más abajo, en esa misma ficha pero más abajo con menos protagonismo poner los últimos tres partidos"

S10 — Rules, one at a time, in a mate's voice.
> "la ficha del reglamento una también es infinita, me gustaría que salieran de una en una y que fueran más personales, como si un colega te lo dijera en plan, si no nos presentamos, nos pidan un punto o algo así"

S11 — On /logros the personal shelf matches the team shelf height.
> "en la pantalla de logros creo que también los logros personales son demasiado largos y creo que podría tener la misma altura que ocupe la de los de equipo y si quedan más, pues cada correo" (scroll)

S12 — A late arrival keeps a hundred percent attendance.
> "considero que Jenis ha entrado al equipo más tarde, entonces yo le pondría asistencia cien por cien, pero que ha venido a uno de un partidos, porque él ha empezado tarde"

S13 — No phantom yellow card.
> "a mí me sigue poniendo que tengo una amarilla se rup y no la tengo"

S14 — Six sections become three, with Competición tabbed.
> "me gustaría también que repasaras ... si le podíamos dar una lógica a juntar las otras páginas de jornada, equipos, clasificación, copa, logros ... que son demasiadas"
Decision: `Inicio · Competición [Liga | Copa | Equipos] · Logros`.

S15 — The league tab must not feel empty.
> "La de jornada está muy vacía y no es como que se vean plan esta jornada anterior ... como que tenga un poco más de vida"

## Tasks

| ID | Spec | Work | Route | Commit |
| --- | --- | --- | --- | --- |
| T1 | S1, S5 | Night photo behind the next-match card with a red-to-black veil over it; the card that is not next goes grey. | inline | `feat(next-match): night photo and a dormant rival card` |
| T2 | S2, S3, S4 | Drop the absent strip and the change-plan button; the reader's own pill gets an X that withdraws the answer. | inline | `feat(attendance): withdraw from your own pill` |
| T3 | S6, S7 | Personal achievements: three columns by four visible rows with a slider, no plate, larger engraved icon. | inline | `feat(logros): compact personal grid with a slider` |
| T4 | S8 | Tapping a tile opens a small modal with its description; rewrite the ambiguous ones. | inline | `feat(logros): describe every achievement on tap` |
| T5 | S9 | One card: last match plus MVP voting, with the last three results underneath and quieter. | inline | `feat(panel): merge the mvp card with the last match` |
| T6 | S10 | Rules shown one at a time with next and previous, in a mate's voice. | inline | `feat(reglamento): one rule at a time` |
| T7 | S11 | /logros: personal shelf capped to the team shelf height, scrolling inside its lane. | inline | `feat(logros): match the two shelf heights` |
| T8 | S12 | Attendance denominator counted from the match a player joined. | inline | `feat(attendance): count from when a player joined` |
| T9 | S13 | Fix player-scope achievements evaluated across the whole squad. | inline | `fix(logros): judge player achievements on the reader` |
| T10 | S14, S15 | Competición section with Liga, Copa and Equipos tabs; retire /jornada, /equipos and /clasificacion. | worker | `feat(nav): one competicion section with tabs` |

Routes: T1–T9 stay inline because each is a single module where the deliverable is visual judgement, not throughput. T10 is the one unit that spans a new view, the router, the navbar and three retired views, so it goes to a writer with disjoint edit surfaces.

## Log

L1 (verbatim, the request):
> Te dejo varias cosas que estoy viendo que me gustaría cambiar en la tarjeta central de próximo encuentro quiero que pruebes esta foto que yo te estoy copiando la ruta y no sé por qué se está pegando como una imagen pero en fin quiero que pruebas esta foto de fondo en esa tarjeta Blue Blue y con el Grady en sutil por encima que vaya de un rojo a un negro abajo, quitando la barra negra gris ocupa que hemos puesto donde para los jugadores que no van al partido me gustaría que la pastillita de los jugadores que se iban tuvieran una X la tuya tenga una X y quitamos el botón de cambiar planes. Así la X ya lo que hace es decir que no vas, bueno decir que no confirmas que vas y luego voy a decidir si vuelves a darle a Voy o no voy creo que te pasa el diseño incluía la X Me gustaría que fuera así eso por una parte después estoy viendo que los logros personales es una tira larguísima considero que podrían salir cuatro filas de tres columnas y que hubiera slider también, si no ocupa un montón. También creo que me gustaría verlas sin el recuadro que el icono fuera un poquito más grande sin el recuadro, así solo nos quedaría el icono en oscuro, me gustaría que fuera oscuro que pareciera una hendidura, pero si no se puede hacer ese efecto lo dejamos como el gris más oscuro que el fondo y eso y me gustaría que fueran clicables y te dijera un pequeño modal con una pequeña descripción, porque ahora mismo hay algunos que pone cosas un poco ambiguas como mi boto y que si lo tocas te explique yo qué sé. Narra no sé lo que significa, pero que diga has votado diez veces. Luego también, cuando el próximo partido quedan muchos días, cuando de Copa, por ejemplo, me gustaría que estuviera todo eso en gris, los logos en gris, los nombres en gris, todo en un gris como si estuviera deshabilitado, porque nos centramos en la otra tarjeta porque el próximo encuentro es el de liga. Cuando el próximo partido sea el de Copa, entonces pondremos el fondo guay en Copa, los luego es a color, todo así y el próximo de arriba, el de el próximo de liga, como no será el siguiente partido, estrato de en gris. Es como que te llame la atención que se juega el otro. Luego lo de MVP creo que lo juntaría con último, en vez de poner últimos tres partidos, pondría último partido lo pondría arriba de coreadores y que ponga último partido tal, tal votar en VP y luego más abajo, en esa misma ficha pero más abajo con menos protagonismo poner los últimos tres partidos y después la ficha del reglamento una también es infinita, me gustaría que salieran de una en una y que fueran más personales, como si un colega te lo dijera en plan, si no nos presentamos, nos pidan un punto o algo así. Es como me gusta lo de la tarjeta roja, pero es en plan, oye que sepas que hacer esto tiene esta consecuencia y que sea simple bastante cachordeo. Eso de momento y me gustaría también que repasaras que te dije en algún momento si le podíamos dar una lógica a juntar las otras páginas de jornada, equipos, clasificación, copa, logros, si algunas se pueden juntar, si podemos disponerle a otro nombre que lo englobe, que se creo que son demasiadas. La de jornada está muy vacía y no es como que se vean plan esta jornada anterior, sabes no sé, como que tenga un poco más de vida, porque ahora mismo era como un si le podemos dar una vuelta y juntarlas en plan como la landing es la nuestra, luego está como de Big Picture en plan que está pasando en la liga y qué está pasando en la Copa tal vez, no sé creo que se podría dar una vuelta a la lógica de cómo se muestra en la pantalla de logros creo que también los logros personales son demasiado largos y creo que podría tener la misma altura que ocupe la de los de equipo y si quedan más, pues cada correo. Esos es un principio un poco la lógica que estoy viendo que le falta a la web. Ahora tú lo estructuras por pasos y como tú quieres. También considero que Jenis ha entrado al equipo más tarde, entonces yo le pondría asistencia cien por cien, pero que ha venido a uno de un partidos, porque él ha empezado tarde. No sé si le ves la lógica y luego a mí me sigue poniendo que tengo una amarilla se rup y no la tengo.

L2 — Two decisions taken before the first write:
- Navigation: a single Competición section with Liga, Copa and Equipos tabs; nav becomes Inicio, Competición, Logros.
- The working tree held 6505 uncommitted lines from earlier sessions; they were checkpointed as `a59a2fa` on the feature branch so each slice below lands in a clean base.

L3 — Baseline before any change: `npm test` and `npm run build` pass on `a59a2fa`.

L4 — Navigation, as chosen by the owner: a single Competición section with Liga, Copa and Equipos tabs. Nav is Inicio, Competición, Logros.

L5 — Slices landed, with the commit that holds each: T1 `0b65283`, T2 `65a82da`, T3 `c32ceac`, T5 `fcbe451`, T6 `62747a2`, T9 `4202026`, T7 `0dd89a2`, T10 `9ea06c1`, T8 `898cb1f`, T4 `a3c841e`. Base checkpoint `a59a2fa`.

L6 — Calls made while landing them, beyond the briefs:
- The quiet list of the last-match card leaves out the match drawn above it; `recentResults(3)` repeated the same rival twice on one card.
- The personal grid takes its page size from the caller's column count (12 on the dashboard, 8 in the narrow block), because a page that does not fit leaves the dots under the fold.
- `vercel.json` had no `/competicion` rewrite, so a cold production load of any tab would have 404'd; the two rewrites were added.
- The two `/equipos` links inside `EquipoView` now point at `/competicion/equipos` instead of relying on the alias.

L7 — Closing evidence: `npm test` 134 pass / 0 fail (129 at baseline; three attendance cases and two achievement guards were added), `npm run build` clean. Browser checks at 1440 and 390 on the next-match card, the attendance row, the personal grid on both surfaces, the rules card, the last-match card, the Competición tabs and the achievement dialog.
