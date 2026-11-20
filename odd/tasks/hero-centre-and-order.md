# Hero card centre and the order of the dashboard

Branch: `feat/hero-centre-and-order` (from `main` at `337135b`).

Goal: the next-match card shows the VS between the two crests and bigger, the competition line reads on its own line under them, and the dashboard cards sit in the order the owner asks for. The achievement explanation, which opens and refuses to close, is a defect and comes first.

## Specs

S1 — The VS sits between the two crests, and it is big.
> "el VS me gustaría que apareciera entre los dos escudos y un poco grande"
> "Y en P. C. el de próximo encuentro también el VS lo haría un poquito más grande"

S2 — The competition line is one line, separated from the logos; the date and the hour are a touch smaller than the VS.
> "Qué llame la atención lo de Liga jueves veintiséis de noviembre veintidós treinta lo veo bien en una línea separado un poco de los logos y ya está"
> "el jueves veintiséis y veintidós treinta lo vendría un poquito más pequeño"

S3 — The competition card and the calendar stay.
> "Esto me gusta próximo partido de Copa me gusta el calendario me gusta"

S4 — The last match with the MVP vote moves up, behind the first block.
> "Después del calendario, no, después del primer joder, del primer bloque que es próximo a un cuento, pondría el último partido lo de votar en el MVP"

S5 — Rules, attendance and news move down.
> "El reglamento lo pondría más abajo, asistencias más abajo, noticias abajo"

S6 — The achievement explanation closes.
> "lo de los logros cuando clicas, te sale el modal pero no cierra, no sé qué hace, se ha bogueado"

## Tasks

| ID | Spec | Work | Route | Commit |
| --- | --- | --- | --- | --- |
| T1 | S6 | Reproduce the stuck explanation on a pointer device and on a touch device, find why it does not close, and fix it in one component. | worker | `b779176` |
| T2 | S1, S2 | The centre of the next-match card: VS between the crests at every width, bigger; the competition line under them on its own line. | inline | `771776f` |
| T3 | S4, S5 | The order of the dashboard cards, mobile first; desktop untouched. | inline | `9a6be67` |

## Log

L1 (verbatim, the request):
> Vale, el móvil no aparece en el próximo encuentro, el VS me gustaría que apareciera entre los dos escudos y un poco grande. Qué llame la atención lo de Liga jueves veintiséis de noviembre veintidós treinta lo veo bien en una línea separado un poco de los logos y ya está. Esto me gusta próximo partido de Copa me gusta el calendario me gusta, el reglamento lo tiraría para abajo. Después del calendario, no, después del primer joder, del primer bloque que es próximo a un cuento, pondría el último partido lo de votar en el MVP. El reglamento lo pondría más abajo, asistencias más abajo, noticias abajo, y lo de los logros cuando clicas, te sale el modal pero no cierra, no sé qué hace, se ha bogueado

L2 — "el móvil no aparece en el próximo encuentro" is read as the VS and the competition line missing on a phone, and the next sentence asks for them: the centre column of the card is `hidden` under a 24rem container, so a phone shows the two crests and the club names with no VS and no competition line. Confirmed in the source before any write (`NextMatchCard`, the `@min-[24rem]` block).

L3 (verbatim, second round on the same card):
> Y en P. C. el de próximo encuentro también el VS lo haría un poquito más grande y el jueves veintiséis y veintidós treinta lo vendría un poquito más pequeño.

Read as: the VS grows on the desktop card too, and the date and hour under it come down a step, so the VS is the loud thing between the crests and the meta line is the quiet one.

L4 — The order, chosen by the owner from three readings, and only for the phone: «Mi lectura: último partido 2º, el resto baja un poco» + «Solo el móvil». The phone sequence is 1 next fixture, 2 last match with the MVP vote, 3 cup card, 4 calendar, 5 scorers, 6 table, 7 personal shelf, 8 rules, 9 attendance, 10 news, 11 album, 12 brand. The desktop keeps its three columns as they are.

L5 — T2 measured on the dev page (the checker's own probe at 390 and 1440, not by eye): VS present between the crests at both, 20px on a 358px card and 24px on a 493px one, where it used to be 18px and hidden under 24rem. The meta line reads «Liga · jueves 26 nov · 22.30H» on one line, 11px narrow and 13px wide, against the 16-17px the stacked column set. Commits `771776f` (card) and `9a6be67` (order).

L6 — T1, the stuck explanation (`b779176`). Root cause: the card takes the focus when it opens, which blurs the tile, whose blur closed the card; closing unmounted the card, whose cleanup focused the tile again, whose focus opened it again. Escape, «Cerrar» and an outside press were undone in the same frame or one 140ms timeout later, and a mouse click never closed it at all — the hover had already opened it and the old toggle only ever set it to true. The fix is one close path for both devices, a `returningFocus` flag so the tile does not read the focus coming back as the reader arriving, a blur that closes only when the focus left the card, and a press that toggles from the state it found at pointerdown.

L7 — Verified after the three commits: `npm test` 135 pass, 0 fail (134 plus one guard test for the focus return), build clean, and the gate over the new page reports **OPEN 63**, down from 66, with no new finding from either change. One behaviour changed on purpose: a click on a hover card now closes it, because that is the toggle the owner asked for.

L8 — A line-ending trap worth remembering: this checkout has `core.autocrlf=true` and no `.gitattributes`, so a tool that rewrites a file with CRLF leaves `git status` clean while the bytes on disk change. Two tests read the achievements source with literal `\n` and went red. The files are LF again and the tests normalise what they read.
