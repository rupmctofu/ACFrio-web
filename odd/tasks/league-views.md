# La web del club se abre a la liga

Feature: el panel del club deja de ser una sola página y pasa a tener navegación —Inicio, Jornada,
Equipos, Clasificación— con la identidad en la barra. El Inicio sigue siendo el panel del club, con
su voz; la liga es una segunda capa para que los rivales entren a ver sus propios datos.

## Specs

- **S1** Barra superior: «que en la barra de navegación de arriba tal vez sí que estuviera lo del
  avatar no de quién eres y cambiarlo», más «unos botones que fueran lo que hay ahora que estuviera
  como un inicio como lo quieras llamar» y «otros botones que nos llevaran a la jornada con todo lo
  que ha ocurrido esa jornada».
- **S2** Secciones: «Inicio · Jornada · Equipos · Clasificación», aprobadas por el propietario
  («me encaja»).
- **S3** Inicio: el panel que existe hoy, con su contenido intacto. «Al final acabaremos haciendo una
  web de la liga más que del propio club», pero la voz del club no se pierde.
- **S4** Jornada: «todo lo que ha ocurrido esa jornada». En esta liga una jornada son tres partidos,
  todos el mismo día a las 22:30.
- **S5** Equipos: «un montón de información sobre los otros clubs… como si fuera las páginas de sus
  clubs, porque creo que también esto si lo ven ellos, van a entrar mucho en la web también para ver
  sus datos y sus estadísticas».
- **S6** Ficha de equipo: posición, forma, todos sus partidos y cuándo juega contra el AC FRÍO.
- **S7** URLs compartibles: `/equipo/<slug>` y `/jornada/<n>`, que se puedan pegar en el grupo.
- **S8** Lo que no se promete: plantillas ni estadísticas individuales de rivales. La federación no
  las publica y las actas solo existen de nuestros partidos. Las fichas son de equipo.

## Tasks

| ID | S# | Tarea | Ficheros | Hecho |
| --- | --- | --- | --- | --- |
| T1 | S1,S2,S7 | Rutas, barra nueva con identidad, tres vistas | App.jsx, Navbar.jsx, router, vistas, vercel.json | ✓ acfrio-jxc0jc5ly |
| T2 | S4 | Vista Jornada con selector y los tres partidos | vistas/JornadaView.jsx | ✓ acfrio-jxc0jc5ly |
| T3 | S5 | Vista Equipos: los once clubes con escudo y posición | vistas/EquiposView.jsx | ✓ acfrio-jxc0jc5ly |
| T4 | S6,S7 | Ficha de equipo por club, con sus partidos y el cruce con nosotros | vistas/EquipoView.jsx, competition.js | ✓ acfrio-3brgve39y |
| T5 | S1-S8 | Verificación: build, tests, capturas a 1440 y 390, despliegue | — | ✓ acfrio-3brgve39y |

Nota de T4: la ficha de un club desconocido no redirige, responde «No conocemos ese club» con enlace a
Equipos. Una URL pegada a mano conserva su dirección; redirigir al inicio habría escondido la errata.

## Log

- **L1** Propietario, petición (verbatim): «me gustaría que en la barra de navegación de arriba tal
  vez sí que estuviera lo del avatar no de quién eres y cambiarlo que está ahí molar a poner la barra
  de navegación y luego unos botones que fueran lo que hay ahora que estuviera como un inicio como lo
  quieras llamar y luego hubiera otros botones que nos llevaran a la jornada con todo lo que ha
  ocurrido esa jornada. Bueno, no sé, si quieres mirar como en otras páginas de fútbol cómo lo hacen
  con las ligas y tal, le puedes estudiar y lo adaptamos a nosotros, pero sí algo así estaría bien,
  algo que puedas entrar ella haga un montón de información sobre los otros clubs, que podamos mirar
  eso, como si fuera las páginas de sus clubs, porque creo que también esto si lo vene ellos, van a
  entrar mucho en la web también para ver sus datos y sus estadísticas también lo pueden buscar aquí.
  Al final acabaremos haciendo una web de la liga más que del propio club.»
- **L2** Propietario, aprobación de la estructura propuesta (Inicio · Jornada · Equipos ·
  Clasificación, con el club como Inicio y la liga como segunda capa): «me encaja».
