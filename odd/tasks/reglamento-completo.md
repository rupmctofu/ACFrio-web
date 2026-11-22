# El reglamento completo en /reglamento

Branch: `feat/reglamento-completo`. Desde `main` en `d7ab7c1`.

Objetivo: que `/reglamento` lleve **todo** el reglamento del CEGARRAF —9 artículos y 61 apartados— transcrito al castellano, sin interpretarlo, y que la home siga igual: las nueve fichas rojas con flechas, sin rotación automática.

## Specs

S1 — En el reglamento, todo.
> «en el apartado de reglamento sí, todo»

Medido en el original (`CEG-Reglament-Intern-Lliga-Futbol-7-2026-2027.pdf`, 10 páginas, 3.979 palabras): **9 artículos** y **61 apartados** con referencia `Art. N.M` (incluye `2.1 bis`, `8.3.1` y `8.3.2`). Las 9 fichas actuales son un resumen, no el reglamento.

S2 — En la home, las tarjetas rojas no cambian.
> «en la home, las tarjetas rojas que vayan saliendo» + la respuesta «Se quedan con flechas, sin rotar»

S3 — El original manda y se sigue viendo.
El texto transcrito es una traducción; el PDF oficial en catalán sigue enlazado en la página y la página dice que, si hay discrepancia, manda el original.

## Tasks

| ID | Spec | Work | Route | Commit |
| --- | --- | --- | --- | --- |
| T1 | S1 | `src/data/regulation.js` con los 9 artículos y sus 61 apartados traducidos del catalán, uno a uno, sin resumir; y su test de estructura. | worker | `feat(reglamento): ...` |
| T2 | S1, S3 | `/reglamento` los pinta todos (los 9 artículos con sus apartados), mantiene las 9 fichas como resumen, el enlace al PDF y la nota de que manda el original. | inline | `feat(reglamento): ...` |
| T3 | S2 | La tarjeta de la home no se toca: una regla a la vez con flechas. | inline | n/a (sin cambio) |

## Log

L1 (verbatim, la decisión):
> en el apartado de reglamento sí, todo. en la home, las tarjetas rojas que vayan sañiendo

L2 — Respuestas del propietario a las dos preguntas del corte: «Transcribir los 57 apartados» y «Se quedan con flechas, sin rotar». El recuento real del original es 61 apartados (57 sin contar `2.1 bis`, `8.3.1` y `8.3.2`), así que la transcripción son 61.

L3 — Fuente y método: `pdftotext -enc UTF-8` sobre el PDF oficial da el texto en orden de lectura (las columnas salen bien); se estructura por `Art. N.M` a un JSON en el directorio temporal de la sesión, y de ahí se traduce. El texto catalán no entra en el repositorio: lo que se versiona es la traducción, y el PDF oficial queda enlazado.

L4 — Lo que se versionó: `src/data/regulation.js` con `PREAMBLE` (10 disposiciones, refs `P1`–`P10`) y `REGULATION` (9 artículos, 61 apartados, refs intactas incluidas `2.1 bis`, `8.3.1` y `8.3.2`), más `tests/regulation.test.mjs`. Commit `T1`. La vista `/reglamento` los pinta todos: las nueve fichas de siempre arriba como resumen con la voz del club, y debajo las disposiciones y los nueve artículos, cada cláusula con su número y su ancla (`#art-8-11`). Commit `T2`.

L5 — Verificación: `npm test` 161 pass / 0 fail (eran 151; +10 del reglamento) y build limpio. Sobre la página construida, sonda del checker a 1440: **10 disposiciones, 9 artículos, 61 cláusulas**, primera ancla `art-1-1`, última `art-9`, ninguna vacía. Comprobación propia contra el catalán (no solo el informe del worker): los seis importes (100 €, 310 €, 62 €, 3,00 €, 6 €, 44 €), las dos URLs, el asterisco del 2.1 y las enumeraciones del 8.11 —cada falta con su sanción, en su orden— coinciden.

L6 — Tres cosas que el worker dejó marcadas y cómo quedan:
- **4.14**: el encabezado de la sección siguiente venía pegado al final de la cláusula en el PDF; se ha movido a su sitio como título del artículo 5 y el 4.14 termina donde termina su regla. Correcto.
- **2.1, el asterisco**: no hay nota al pie en el documento. Se queda tal cual porque su contenido es la URL que va justo detrás en la misma cláusula; ahora se entiende en la página.
- **P3 y P8**: la puntuación del original se conserva (un punto donde pediría coma, y una cláusula sin punto final). Normalizarla sería editar un texto normativo.

L7 — Lo que queda para un lector humano, y no para un test: la traducción es de una sola pasada. La estructura, las cifras, las URLs y los marcadores de catalán están comprobados a máquina; la fidelidad de idioma no. Conviene que alguien lea contra el PDF los artículos 8.10, 8.11 y 9, que son las enumeraciones de faltas y sanciones, donde un resumen perdería un rango como «de 4 a 12 partidos».

L8 — Corte para el revisor: 752 líneas en tres commits, casi todas el texto del reglamento (`src/data/regulation.js`), que se revisa leyéndolo, no diffeándolo. Tres unidades: el dato y su test (`f7a1a79`), la vista (`7aacc77`) y este documento. Nada pusheado: publicar es decisión del propietario.
