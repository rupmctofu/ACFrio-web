# Actas

Los partes oficiales de cada partido, tal como los manda la federación.

## Cómo nombrarlos

```
AAAA-MM-DD-competicion-rival.pdf
```

El rival va por su slug del proyecto, el mismo que usa `src/data/competition.json`:

- `2026-11-17-copa-bayer-leverkolocon.pdf` — el del 17 de noviembre contra el Bayern
  Leverkolocón, jornada 1 de la Copa.
- `2026-11-26-liga-kongitos-fc.pdf` — el del 26 de noviembre contra el Kongitos.

Con la fecha delante la carpeta se ordena sola y el nombre ya dice qué partido es, así que
el proceso se puede automatizar sin abrir el archivo.

## Por qué aquí y no en `src/`

`src/` es código que se empaqueta y se sirve al navegador. Un PDF ahí no rompe nada, pero
viaja con el bundle y no pinta nada. Esta carpeta es documentación de origen: no se sirve,
no se despliega y se puede versionar.

## Lo que hay que saber antes de procesarlas

Los partes llegan **escaneados**, sin capa de texto: son imágenes CCITT dentro de un PDF, con
cero fuentes incrustadas. No hay nada que extraer automáticamente, así que se convierten a
imagen con Ghostscript y se leen a ojo:

```bash
pdftoppm -r 200 -png actas/2026-11-17-copa-bayer-leverkolocon.pdf actas/pagina
```

Poppler viene del paquete `oschwartz10612.Poppler` de winget; Ghostscript no está publicado en
winget. Las páginas que genera esta orden son derivadas y están en `.gitignore`: solo se guardan
el PDF y este documento. Para leer los renglones escritos a mano hay que subir a 400 dpi y recortar
la zona, porque a 200 dpi la columna de goles no se distingue.

De cada acta se sacan: resultado, goleadores, tarjetas, árbitro, campo y quién jugó. Con eso
se actualizan `src/data/competition.json` (marcador y estado del partido),
`src/data/club-record.json` (goleadores y tarjetas) y las noticias derivadas.

## La regla que no se puede saltar

La columna `Núm` va **rellenada a mano**, y solo para los jugadores que jugaron: una fila sin
dorsal escrito es una ausencia, aunque el nombre venga impreso en la hoja de equipo. El acta
imprime la plantilla entera y el delegado numera a los que salieron.

**El dorsal es siempre el mismo**, el de la ficha del jugador en `src/data/teamData.json`. No es
un número libre ni una posición: es su dorsal de temporada. Eso permite dos comprobaciones:

1. El número escrito se cruza con la plantilla, así que no hace falta fiarse de en qué fila
   cayó la marca y la lectura no depende de la alineación del recorte.
2. Si un número escrito no existe en la plantilla, la fila no se puede atribuir.

## Cuando el delegado se equivoca

Se equivoca. Está confirmado por el propietario: en la jornada del 5/11 escribió el `2` de Geri
en la fila de Albert, y en la del 22/10 puso el dorsal de Ander en la fila de Jonay. Un dorsal
escrito que no cuadra con la plantilla **no es una prueba**: no se adivina, no se corrige por
parecido y no se cambia la lista del club por ello. Se anota la discrepancia y se le pregunta
al propietario.

Por eso la lista que manda es la que envía el club; el acta sirve para confirmarla cuando los
números cuadran, y para abrir una duda cuando no.

## Cuidado con el recorte

Hay que leer **nombre y dorsal en la misma fila**. Recortar la columna del dorsal por su cuenta
fue lo que produjo un error real: el `11` de Cristóbal se leyó como si fuera de Jonay, una fila
más arriba, y se le contó como asistente sin haber jugado.

La clasificación **no** se toca desde el acta: la publica la federación y `competition.json` la
descargan de allí con `node scripts/sync-competition.mjs`. Cuando la federación va por detrás del
acta, la tabla se queda como está y solo se carga el partido.
