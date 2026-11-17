# Voz y copywriting AC FRÍO

Feature: capa de personalidad verbal sobre el restyling (petición del propietario,
"capa de copywriting"). Rama `restyling/panel`.

## Specs

- **S1** Tono: «cachondo y desenfadado, irónico, con bastante mala leche, pero siempre desde el
  buen rollo», «muy futbolero», referencias a «fútbol amateur, vestuarios, excusas, terceros
  tiempos». Filosofía: «mucho escudo, mucho orgullo y bastante cachondeo». Evitar «humor
  corporativo, mensajes motivacionales genéricos y frases típicas de plantilla de aplicación».
- **S2** Ticker: «una mezcla entre un tablón de anuncios del vestuario y un canal de noticias».
  El propietario entrega 12 mensajes de ejemplo; se pueden «crear nuevos mensajes del mismo
  estilo». «Los mensajes deben rotar o desplazarse horizontalmente, manteniendo el diseño actual
  del ticker.»
- **S3** Secciones: nombres claros «acompañados de pequeños subtítulos con personalidad». El
  propietario da opciones por sección (Clasificación, Goleadores, Últimos partidos, Próximo
  partido, Calendario, Asistencias, La Copa, Galería).
- **S4** Microcopy: estados vacíos (nadie confirmado, sin estadísticas, sin partidos) y botones:
  «Editar asistencia» → «Cambiar planes» y similares. «No cambies botones que necesiten ser
  especialmente claros por motivos funcionales. Prioriza siempre la usabilidad.»
- **S5** Marca: frases recurrentes; el propietario lista conceptos y dice: «No es necesario
  utilizar todas estas frases. Elige las mejores y crea otras nuevas con la misma personalidad.»
- **S6** Reglas: «No conviertas toda la web en una sucesión de chistes»; «No modifiques nombres de
  jugadores, equipos, resultados, fechas, horarios ni datos deportivos»; «No inventes
  acontecimientos reales del equipo»; «No utilices humor ofensivo»; «español natural de España»;
  «frases cortas»; «los datos importantes deben seguir siendo claros y profesionales».
- **S7** Implementación: «establece un sistema de tono de voz coherente»; «Si es posible,
  centraliza los textos y mensajes en una estructura que permita modificarlos fácilmente»;
  «Mantén intactos todos los datos dinámicos y las funcionalidades.»

## Tasks

| ID | S# | Tarea | Ruta | Commit |
| --- | --- | --- | --- | --- |
| T1 | S7 | Capa centralizada de voz | src/data/copy.js* | feat(copy): voice layer |
| T2 | S2 | Nuevos mensajes del ticker | src/data/news.json | feat(copy): ticker board |
| T3 | S3 | Subtítulos de sección | Standings, ScorersCard, FormCard, FixturesCard, CupCard, AttendanceCard, GalleryCard, NewsCard | feat(copy): section hints |
| T4 | S4 | Estados vacíos y botones | MatchAttendance, NextMatchCard, ScorersCard, FixturesCard | feat(copy): states |
| T5 | S5 | Frases de marca | BannerIdentity, BrandModule | feat(copy): brand lines |
| T6 | S1,S6 | Verificación: build, tests, capturas, lectura en voz alta | — | — |

(* = archivo nuevo.)

## Log

- **L1** Propietario: «NUEVA CAPA DE PERSONALIDAD — COPYWRITING AC FRÍO» (texto íntegro en la
  conversación). Resultado buscado, verbatim: «que alguien entre en la web y piense: "Esta gente
  se ha currado una web de fútbol de verdad, pero están un poco mal de la cabeza"».
- **L2** T1-T5 verificados en render (build y 13 tests en verde tras cada unidad; captura móvil
  390 revisada con todos los subtítulos, el eco de marca y el tablón en pantalla; sin desbordes).
  Pendiente de render local: el bloque de asistencia no se monta sin Supabase configurado, así
  que «Cambiar planes» y los estados de confirmación quedan verificados por lectura, no en
  pantalla. El módulo de marca conserva el tagline real del club: se decidió no añadir el eco
  ahí para no repetirlo con el banner.
