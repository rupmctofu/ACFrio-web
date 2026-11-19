# Próximos partidos Liga y Copa, y pasada de tono

Feature: el panel pasa a mostrar dos próximos partidos (Liga arriba, Copa debajo), el
contador salta solo al siguiente partido cuando llega a cero, y la página sube de negro
a gris muy oscuro con dos tarjetas más hundidas. El 0/15 de la Copa se muda a una sección
nueva de estadísticas.

## Specs

- **S1** Fondo: «casi un negro no negro negro pero un gris muy oscuro por ejemplo».
- **S2** Noticiario, tipografía: «en el noticiario me gustaría que el fondo fuera más oscuro y la
  tipografía más grande y un poco más bold con un pequeño interletrado un poquito más fue se ve un
  poco como muy condensado».
- **S3** Noticiario, icono: «me gustaría que el icono del altavoz estuviera dentro sin la redonda y
  que el icono estuviera en rojo que esté dentro del label grande en un ladito en rojo».
- **S4** Tonos de sección: «algunas veo que todas las secciones sí que has hecho un par que tienen un
  gradien rojo me gustaría que algunos tuvieran un tono un negro un poco más oscuro tal vez el de
  clasificación un poquito más oscuro y el de asistencia es un poquito más oscuro que se vea un poco
  de contraste entre los labels».
- **S5** Salto del contador: «quiero que cuando un partido llegue el día que ponga cero días cero horas
  cero minutos ya cambia y aparezca al siguiente partido porque ahora mismo jugamos ayer y me sigue
  poniendo próximo partido cero cero y es el partido de ayer».
- **S6** Dos tarjetas: «en la Copa ahora mismo entiendo que no hay datos pero me gustaría que saliera
  también próximo partido de Copa y arriba próximo partido de liga si sea semana no hay liga que quiero
  hacer que las dos secciones del medio sean la de arriba liga y la del medio copa».
- **S7** Liga sin jornada esta semana: «si arriba esa semana no hay liga que ponga esta semana no hay
  liga y se reduzca un poco el tamaño y que así menos difuminado que ponga próximo partido el de hace
  frío contra el que toque de liga y los días que quedan pero que esté como todo con tonos grises que
  sean plan esta semana no hay liga que se lea bien».
- **S8** Copa activa: «y en el de abajo que sería la copa que esté con los colores activos diciendo pues
  en tres o cuatro días el día que toque la copa con quien se juega y cuántos quedan y lo de asistir y
  no asistir y eso».
- **S9** Copa stats: «de momento creamos una sección nueva de (Copa stats). Muevelo ahi y ya veremos que
  le ponemos luego».
- **S10** Asistencia: «Solo en la tarjeta activa (la del partido más cercano)».

## Tasks

| ID | S# | Tarea | Ruta | Commit |
| --- | --- | --- | --- | --- |
| T1 | S1 | Página a gris muy oscuro y escalera de superficies | index.css | — |
| T2 | S2,S3 | Noticiario: barra más oscura, tipo mayor y más suelto, altavoz en rojo dentro | BreakingTicker.jsx | — |
| T3 | S4 | Superficie más hundida para Clasificación y Asistencias | index.css, Standings.jsx, AttendanceCard.jsx | — |
| T4 | S5,S6,S7,S8 | Dos tarjetas de próximo partido, salto al llegar a cero, activa/inactiva | competition.js, NextMatchCard.jsx, CupCard.jsx, MatchAttendance.jsx, Dashboard.jsx | — |
| T5 | S9,S10 | Copa stats como sección propia; asistencia solo en la activa | CopaStatsCard.jsx, Dashboard.jsx | — |
| T6 | S1-S10 | Verificación: build, tests, capturas 1440/390, comparación de tonos | — | — |

## Log

- **L1** Propietario, petición completa de esta feature (verbatim, fragmentada en S1-S9 arriba):
  «casi un negro no negro negro pero un gris muy oscuro por ejemplo en el noticiario me gustaría que el
  fondo fuera más oscuro y la tipografía más grande y un poco más bold con un pequeño interletrado un
  poquito más fue se ve un poco como muy condensado me gustaría que el icono del altavoz estuviera dentro
  sin la redonda y que el icono estuviera en rojo que esté dentro del label grande en un ladito en rojo
  luego me gustaría que algunas veo que todas las secciones sí que has hecho un par que tienen un gradien
  rojo me gustaría que algunos tuvieran un tono un negro un poco más oscuro tal vez el de clasificación un
  poquito más oscuro y el de asistencia es un poquito más oscuro que se vea un poco de contraste entre los
  labels quiero que cuando un partido llegue el día que ponga cero días cero horas cero minutos ya cambia y
  aparezca al siguiente partido porque ahora mismo jugamos ayer y me sigue poniendo próximo partido cero
  cero y es el partido de ayer y en la Copa ahora mismo entiendo que no hay datos pero me gustaría que
  saliera también próximo partido de Copa y arriba próximo partido de liga si sea semana no hay liga que
  quiero hacer que las dos secciones del medio sean la de arriba liga y la del medio copa si arriba esa
  semana no hay liga que ponga esta semana no hay liga y se reduzca un poco el tamaño y que así menos
  difuminado que ponga próximo partido el de hace frío contra el que toque de liga y los días que quedan
  pero que esté como todo con tonos grises que sean plan esta semana no hay liga que se lea bien y en el de
  abajo que sería la copa que esté con los colores activos diciendo pues en tres o cuatro días el día que
  toque la copa con quien se juega y cuántos quedan y lo de asistir y no asistir y eso».
- **L2** Propietario, decisiones de esta sesión (verbatim, respuestas a dos preguntas): «de momento
  creamos una sección nueva de (Copa stats). Muevelo ahi y ya veremos que le ponemos luego» y «Solo en
  la tarjeta activa (la del partido más cercano)».
