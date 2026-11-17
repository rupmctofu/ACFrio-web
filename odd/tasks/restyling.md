# Restyling del panel AC FRÍO

Feature: evolución visual del panel existente según el super prompt del propietario
(design/inspiration como referencia estética, no copia literal). Rama `restyling/panel`.

## Specs

- **S1** «No quiero una web completamente nueva ni una plantilla genérica. Quiero evolucionar el
  diseño que ya existe, conservando su esencia, su estructura funcional y toda su información.»
- **S2** Paleta: «Negro profundo: #090909. Negro carbón: #141414. Gris oscuro: #202020.» rojo AC
  FRÍO «como color protagonista para acciones, estadísticas importantes y elementos destacados»;
  «No introduzcas colores nuevos que rompan la identidad del club.» Superficies con «Diferentes
  niveles de profundidad… Degradados localizados… Algún detalle gráfico inspirado en el escudo»,
  abandonando «la sensación de tarjetas planas y demasiado uniformes».
- **S3** Tipografía: sans moderna legible (Inter vigente) + condensada expresiva «para cifras,
  resultados y estadísticas» (Oswald elegido de las referencias). «Los títulos deben tener más
  presencia… Evita utilizar demasiados tamaños, pesos o estilos diferentes.»
- **S4** Estructura: tres columnas «IZQUIERDA: clasificación, goleadores y últimos partidos.
  CENTRAL: próximo partido, información de la copa y galería/noticias. DERECHA: calendario y
  asistencias.» «La columna central debe tener algo más de protagonismo.»
- **S5** Cabecera: «Escudo y nombre AC FRÍO más visibles… Navegación más elegante… Botón
  "Próximo partido" destacado… Mantén los apartados existentes: Partidos, Clasificación, Copa y
  Plantilla.» Rediseñar «la barra de usuario ("Hola, Rup")».
- **S6** Banner: «un banner deportivo horizontal con: fotografía de fútbol o del equipo, escudo de
  AC FRÍO, mensaje de marca: "AC FRÍO — MÁS QUE UN EQUIPO", tratamiento oscuro con detalles
  rojos.» Debajo «la barra de avisos… como un ticker horizontal, con separación clara entre
  mensajes». «No conviertas el banner en un elemento excesivamente alto.»
- **S7** Clasificación: «El AC FRÍO debe destacar claramente mediante un fondo rojo oscuro o un
  indicador lateral rojo. Los puntos deben tener especial protagonismo.»
- **S8** Goleadores: «Números de goles grandes y destacados… indicadores de tarjetas amarillas y
  rojas más refinados.»
- **S9** Próximo partido: etiqueta, competición, jornada, escudos, VS, contador, fecha, asistencia;
  «La tarjeta debe sentirse como el cartel digital de un partido importante. No quiero que parezca
  simplemente otra tarjeta más del dashboard.»
- **S10** Calendario: «Mantén la funcionalidad actual del calendario.» Mejorar tipografía,
  contraste de días con partido y navegación de meses.
- **S11** Copa: «Los equipos deben mostrarse mediante pequeñas etiquetas o chips con su escudo y
  nombre.»
- **S12** Asistencias: avatar, nombre, partidos, porcentaje, «Utiliza el rojo para las barras»;
  «Mantén la posibilidad de consultar todos los jugadores y no elimines información existente.»
- **S13** Últimos partidos: «Los resultados deben ser el elemento visual más importante de cada
  módulo… indicador de victoria, empate o derrota… sin introducir colores que rompan la identidad
  visual.»
- **S14** Noticias y galería: «Fotografías de mayor tamaño… contador de fotografías… Si existe una
  sección de noticias, dale un tratamiento editorial: imagen protagonista, etiqueta de categoría,
  titular y breve descripción.» «Utiliza las fotografías y recursos reales que ya existen en el
  proyecto. No sustituyas imágenes reales por fotografías inventadas ni alteres los escudos.»
- **S15** Acabados: hover, transiciones suaves, scrollbars; «Las animaciones deben ser sutiles y
  rápidas.» «Iconos de una misma familia visual, preferiblemente Lucide.»
- **S16** Responsive: 3 columnas en escritorio, tablet reorganizada, móvil vertical con «El próximo
  partido… en una posición prioritaria». Evitar desbordes y solapamientos.
- **S17** Reglas: conservar toda la lógica de negocio y conexiones; «No elimines funcionalidades,
  botones, enlaces ni interacciones»; «No inventes resultados, jugadores, estadísticas ni
  información de partidos»; sin dependencias nuevas innecesarias.

## Tasks

| ID | S# | Tarea | Ruta | Commit |
| --- | --- | --- | --- | --- |
| T1 | S2,S3 | Tokens de color/superficie + Oswald como cifra | index.css, index.html | feat(restyling): tokens |
| T2 | S5 | Cabecera y navegación | Navbar.jsx | feat(restyling): header |
| T3 | S6 | Banner de identidad + ticker refinado | BannerIdentity.jsx*, BreakingTicker.jsx, App.jsx | feat(restyling): banner |
| T4 | S9 | Cartel del próximo partido | NextMatchCard.jsx | feat(restyling): hero |
| T5 | S7 | Clasificación | Standings.jsx | feat(restyling): standings |
| T6 | S8 | Goleadores y tarjetas | ScorersCard.jsx | feat(restyling): scorers |
| T7 | S10 | Calendario, restyle ligero | FixturesCard.jsx | feat(restyling): calendar |
| T8 | S11 | Copa como módulo de competición | CupCard.jsx | feat(restyling): cup |
| T9 | S12 | Asistencias visuales | AttendanceCard.jsx | feat(restyling): attendance |
| T10 | S13 | Últimos partidos, resultado protagonista | FormCard.jsx | feat(restyling): form |
| T11 | S14 | Noticias editorial + galería grande | NewsCard.jsx*, GalleryCard.jsx | feat(restyling): news-gallery |
| T12 | S4,S16,S17 | Orden del grid, ambiente rojo, módulo de marca, responsive | Dashboard.jsx, App.jsx | feat(restyling): layout |
| T13 | S15,S16 | Verificación: build, tests, capturas 1440/1024/768/390, gate | — | — |

(* = componente nuevo.)

## Log

- **L1** Propietario: super prompt de restyling (texto íntegro en la conversación de esta sesión,
  entregado junto a `design/inspiration/Panel de fútbol AC FRÍO en rojo y negro.png`). Instrucción
  final, verbatim: «Trabaja directamente sobre el código existente. No te limites a explicarme qué
  cambiarías ni me entregues únicamente una propuesta conceptual. Implementa el restyling completo,
  revisa el resultado visual en el navegador, corrige los problemas de espaciado, alineación,
  responsive y legibilidad, y asegúrate de que todas las funcionalidades anteriores siguen
  funcionando.» La imagen es «inspiración para el diseño, no como una imagen que debas copiar
  literalmente».
