# Asistencia al partido, segunda iteración: compactar y disponibilidad

Feature: el bloque de asistencia del próximo partido se compacta y gana una barra de
disponibilidad. La barra mide los confirmados sobre las quince fichas de la plantilla, se queda
en gris mientras no lleguen a siete y pasa a rojo en el séptimo, con el estado escrito al lado.
Único bloque tocado: la asistencia dentro de la tarjeta del próximo partido.

Alcance: `src/components/MatchAttendance.jsx` (presentación) y un ayudante puro nuevo
`src/lib/availability.js` con su test `tests/availability.test.mjs`. `src/lib/attendance.js`
(lectura y guardado de respuestas), `NextMatchCard.jsx` en su parte de enfrentamiento y cuenta
atrás, y el resto de la web no cambian.

## Specs

- **S1** Compactar: «Reducir los espacios verticales entre títulos, etiquetas y jugadores. Evitar
  separaciones y márgenes innecesarios. Mantener las fotografías de perfil de todos los jugadores.
  Mantener los nombres visibles y las fichas individuales actuales. Hacer que el bloque sea más
  compacto, pero sin que parezca apretado. Integrar mejor el contador de asistencia con el listado
  de jugadores.»
- **S2** Barra: «Somos un equipo de 15 jugadores y jugamos a fútbol 7. Por tanto, necesitamos un
  mínimo de 7 jugadores confirmados para poder disputar el partido.» Con 9 confirmados: «Título:
  DISPONIBILIDAD. Porcentaje: 60%. Barra de progreso: 60% de relleno. Texto: 9 / 15 JUGADORES
  CONFIRMADOS.» Y «La barra debe representar el porcentaje de jugadores confirmados sobre el total
  de la plantilla (15).»
- **S3** Comportamiento: «De 0 a 6 jugadores confirmados: barra en gris… A partir de 7 jugadores
  confirmados: la barra cambia a rojo AC FRÍO… El cambio de color debe producirse automáticamente
  al alcanzar el séptimo jugador. El porcentaje y la longitud de la barra deben actualizarse
  dinámicamente cada vez que un jugador cambie su asistencia.» Estado escrito: «Menos de 7: «FALTAN
  X PARA JUGAR». 7 o más: «HAY PARTIDO». No utilizar verde. Mantener exclusivamente la estética de
  AC FRÍO: grises, negro, blanco y rojo.»
- **S4** Fotos: «Quiero conservar las fotografías individuales de los jugadores… Los jugadores
  confirmados deben seguir siendo fácilmente identificables. Mantener las fotos circulares y los
  nombres. Diferenciar visualmente a los que van de los que no van, respetando el diseño actual. La
  barra de disponibilidad debe estar conectada a las mismas respuestas de asistencia, no utilizar
  datos independientes.»
- **S5** Interacción: «Mantener el funcionamiento actual de «CAMBIAR PLANES». Al pulsarlo, debe
  seguir apareciendo la pregunta de asistencia con las opciones «SÍ» y «NO». Cuando un jugador
  cambie su respuesta: actualizar inmediatamente su estado, el número de confirmados, el
  porcentaje, la barra y su color según el umbral de 7 jugadores, y el mensaje de estado. No
  modificar la lógica existente de guardado de respuestas ni crear un sistema paralelo.»
- **S6** Dirección visual: «Más compacto y menos alto. Más limpio y con mejor aprovechamiento del
  espacio. Con la barra de disponibilidad como elemento visual destacado. Con las fotografías de
  los jugadores como parte importante de la sección. Sin añadir más tarjetas, contenedores o
  elementos decorativos innecesarios.»
- **S7** Restricciones: «Modificar únicamente el bloque de asistencia. No tocar el diseño del
  enfrentamiento ni la cuenta atrás. No modificar el resto de la web. Reutilizar los componentes,
  datos y estados existentes. No introducir dependencias nuevas. Comprobar el comportamiento tanto
  en escritorio como en móvil.»
- **S8** Datos de la plantilla: el total son las fichas reales (`teamData.squad`, 15 entradas), no
  un número escrito a mano; el mínimo de partido es 7 (`PLAYERS_NEEDED`), y ambos viven en un
  ayudante puro `availabilityOf(confirmados, plantilla)` → `{ going, total, percent, ready, missing }`.
- **S9** Escudos: el propietario actualizó escudos fuera de esta tarea (montajes en
  `public/assets/badges/`). No forman parte de este cambio y no se tocan.

### Segunda pasada (L6)

- **S10** «El "si, voy" fuera, lo de "una preocupacion menos..." fuera.» La línea de respuesta
  colapsada y su coletilla desaparecen; «Cambiar planes» queda como la única puerta para responder
  otra vez, y la ficha del jugador sigue marcada en rojo.
- **S11** «la parte inferior de la tarjeta que sea fondo negro»: el bloque pasa a ser el pie negro de
  la tarjeta, a sangre por los lados y hasta la esquina inferior.
- **S12** «el 9/15 en rojo y más grande»: la línea de recuento sube a 15 px, en negrita y en rojo.
- **S13** «en rojo NO VAN: y los nombres de los jugadores que no vayan en blanco con su img de
  perfil»: segunda lista con rótulo rojo y las mismas fichas (foto circular y nombre blanco).

## Tasks

| ID | S# | Tarea | Ruta | Commit |
| --- | --- | --- | --- | --- |
| T1 | S2,S3,S8 | Ayudante puro de disponibilidad con test primero (rojo → verde) | `src/lib/availability.js`, `tests/availability.test.mjs` | — |
| T2 | S1,S2,S3,S4,S6 | Bloque compacto: cabecera, barra de disponibilidad, listado único de fichas y estado | `src/components/MatchAttendance.jsx` | — |
| T3 | S5,S7 | Conservar el guardado y el flujo de «Cambiar planes»; comprobar escritorio y móvil | `src/components/MatchAttendance.jsx` | — |
| T4 | S1-S9 | Verificación independiente del slice | — | — |

## Log

- **L1** Propietario, petición de esta iteración (verbatim, fragmentada en S1-S7 arriba): «Quiero
  hacer una segunda iteración del bloque de **asistencia al partido** de AC FRÍO. El diseño actual
  funciona, pero ocupa demasiado espacio vertical y la información está algo dispersa. Quiero
  compactarlo, mejorar su jerarquía y añadir un indicador visual de disponibilidad.» Y antes:
  «te he actualizado los escudo porque he visto que algunos no estaban bien. por otro lado me
  gustaría pulir esto.» Cierra con: «Antes de implementar, revisa cómo funciona actualmente el
  sistema de asistencia y de dónde salen las respuestas de los jugadores.» Objetivo: «que en un
  espacio más reducido podamos ver quién va, quién no va, cuántos jugadores tenemos disponibles y,
  sobre todo, si ya tenemos los 7 necesarios para que haya partido.»
- **L2** Evidencia de exploración: `MatchAttendance.jsx` (290 líneas) contiene el bloque entero
  (cabecera «¿Vas al partido?» + «Cambiar planes», `Tally` con fichas y línea «No van», botones
  «Sí, voy»/«No voy», errores) y se renderiza solo desde `NextMatchCard.jsx` (variantes hero y
  póster). Las respuestas viven en `useState` (`answers`) y se guardan por `declare()` →
  `setAnswer()` de `src/lib/attendance.js`, que no se toca. El total sale de
  `teamData.squad.length` (15). Con `isConfigured` falso el componente entero se sustituye por un
  aviso dentro de una caja anidada. Ningún test cubre hoy el recuento ni ningún umbral; los test de
  asistencia existentes son de la capa de datos y no importan el componente.
- **L3** Decisión (D1): la barra y el estado se derivan de `availabilityOf()` en
  `src/lib/availability.js`. Es la única parte del umbral que un test puede fijar sin navegador, y
  permite RED/GREEN real antes de tocar el JSX.
- **L4** Decisión (D2): el porcentaje es `Math.round(confirmados / plantilla * 100)` y la barra usa
  ese mismo entero como longitud, para que el número y el relleno nunca se contradigan; 7/15 se
  muestra como 47 % y el umbral se decide con confirmados, no con el porcentaje redondeado.
- **L5** Decisión (D3): el aviso de «falta conectar el registro» deja de ser una caja anidada
  (S6 prohíbe contenedores innecesarios) y pasa a ser una línea con el mismo separador que el resto
  del bloque. Sin datos no se dibuja la barra: un 0/15 inventado diría «0 confirmados» cuando en
  realidad no se sabe.
- **L6** Propietario, ajustes sobre el bloque ya entregado (verbatim): «unos ajustes. El "si, voy"
  fuera, lo de "una preocupacion menos..." fuera. el 9/15 en rojo y más grande. Y luego, la parte
  inferior de la tarjeta que sea fondo negro y , en rojo NO VAN: y los nombres de los jugadores que
  no vayan en blanco con su img de perfil». Fija S10-S13.
