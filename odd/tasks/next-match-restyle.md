# Restyling de «Próximo partido de liga»

Feature: la tarjeta activa de liga del panel pasa a ser un póster de enfrentamiento. La
cabecera baja de tono a una etiqueta, los dos escudos y el VS mandan, la fecha, la hora y el
campo se leen en un bloque compacto con iconos, y la cuenta atrás se separa en una banda con
fondo propio y la frase de cierre debajo. Solo cambia esta sección y sus estilos.

Alcance: `src/components/cards/NextMatchCard.jsx`. `FixtureCardView` (compartido con
`CupCard.jsx`) y `Crest.jsx` no cambian de contrato: la Copa conserva su anatomía.

## Specs

- **S1** Cabecera: «Título: «PRÓXIMO ENCUENTRO». Mantener una pequeña etiqueta con la
  competición (3ª DIVISIÓN). Debajo, mostrar la información de jornada: «JORNADA 5 · 3ª DIVISIÓN
  GRUPO B». Reducir el protagonismo de estos elementos para dar más espacio al enfrentamiento.»
- **S2** Enfrentamiento: «Los escudos de AC FRÍO y del equipo rival deben ser los protagonistas.
  Distribuirlos horizontalmente, con el VS centrado. Mostrar los nombres debajo de cada escudo.
  Mantener los escudos originales y sus proporciones. No sustituirlos por imágenes nuevas ni
  recrearlos.»
- **S3** Información del partido: «Agrupar fecha, hora y ubicación en un bloque compacto y bien
  organizado. Utilizar pequeños iconos de calendario y ubicación. Dar buena visibilidad a la fecha
  y hora. La ubicación debe poder funcionar como enlace a Google Maps si ya existe esa
  funcionalidad o se dispone de la dirección correspondiente.»
- **S4** Cuenta atrás: «Separarla visualmente del resto mediante un fondo ligeramente diferente.
  Mantener los cuatro indicadores: días, horas, minutos y segundos. Mejorar la alineación,
  espaciado y legibilidad de los números. Mantener el funcionamiento dinámico actual del contador.
  Colocar debajo la frase «EL FÚTBOL NOS DEBE UNA.» como cierre visual.»
- **S5** Dirección de diseño: «Mantener el fondo oscuro rojizo actual. Conservar los bordes rojos,
  las diagonales decorativas y la estética deportiva. Mantener la identidad visual de AC FRÍO:
  negro, rojo y blanco. Mejorar los espacios internos y evitar que todos los elementos compitan por
  atención. Utilizar una jerarquía tipográfica más clara. Evitar tarjetas dentro de tarjetas
  innecesarias. No abusar de sombras, gradientes ni efectos. Buscar un resultado limpio, contundente
  y profesional, con personalidad de club deportivo.»
- **S6** Responsive: «Escudos y nombres perfectamente alineados. Contador distribuido en cuatro
  columnas. Evitar desbordamientos y saltos de línea innecesarios. Mantener proporciones y
  espaciados equilibrados.»
- **S7** Restricciones: «Modificar únicamente esta sección y sus estilos asociados. No rehacer el
  resto de la página. No cambiar la paleta de colores ni la identidad de marca. No modificar la
  lógica de partidos, fechas, contador o datos dinámicos. Reutilizar los componentes, imágenes y
  datos existentes. No introducir dependencias nuevas. Respetar la arquitectura y convenciones
  actuales del proyecto.»
- **S8** Texto de competición en castellano (decisión del propietario, L2): etiqueta «3ª DIVISIÓN»
  y línea «JORNADA 5 · 3ª DIVISIÓN GRUPO B» como cadenas de interfaz de esta sección. El nombre
  publicado «3ª Divisió Grup B» sigue intacto en el dato y en el resto de vistas.
- **S9** Ubicación sin enlace (consecuencia de la condición de S3, D1): el proyecto no guarda
  dirección, coordenadas ni ninguna utilidad de mapas, así que la ubicación se muestra como texto
  con icono. No se inventa un enlace ni una dirección.

Fuera de alcance, y se conserva tal cual: el salto automático al siguiente partido cuando el
contador llega a cero, el estado «esta semana no hay liga», la copa, y la asistencia solo en la
tarjeta activa (`odd/tasks/fixture-cards.md`, S5, S7, S8, S10).

## Tasks

| ID | S# | Tarea | Ruta | Commit |
| --- | --- | --- | --- | --- |
| T1 | S1,S2 | Póster del encuentro: cabecera reducida, enfrentamiento en dos filas alineadas | `src/components/cards/NextMatchCard.jsx` | — |
| T2 | S3,S9 | Bloque compacto de fecha, hora y campo con iconos de calendario y ubicación | `src/components/cards/NextMatchCard.jsx` | — |
| T3 | S4 | Banda de cuenta atrás a cuatro columnas con la frase de cierre; asistencia conservada | `src/components/cards/NextMatchCard.jsx` | — |
| T4 | S5,S6,S7 | Responsive y tonos: build, tests y capturas a 1440, 1024, 768 y 390 | — | — |
| T5 | S1-S9 | Verificación independiente del diff | — | — |

## Log

- **L1** Propietario, petición de esta feature (verbatim): «Quiero que hagas un restyling y una
  reestructuración de la sección **«Próximo partido de liga»** de AC FRÍO. El objetivo es mejorar
  la jerarquía visual, la distribución de los elementos y la legibilidad, manteniendo la identidad
  gráfica actual de la web.» A continuación detalla la estructura (A cabecera, B enfrentamiento, C
  información del partido, D cuenta atrás), la dirección de diseño, el responsive y las
  restricciones, que quedan citadas en S1-S7. Cierra con: «Antes de implementar, localiza el
  componente y revisa cómo obtiene los datos. Después realiza los cambios directamente.» Y el
  resultado esperado: «una sección más ordenada y visualmente atractiva, donde el enfrentamiento
  sea el protagonista, la información del partido sea fácil de consultar y la cuenta atrás tenga su
  propio espacio.»
- **L2** Propietario, decisión de texto (respuesta a la pregunta de arranque, opción «Castellano
  literal, como lo pediste»): etiqueta «3ª DIVISIÓN» y línea «JORNADA 5 · 3ª DIVISIÓN GRUPO B» como
  cadenas de interfaz; el nombre catalán del dato queda solo para otras vistas. Fija S8.
- **L3** Evidencia de exploración (D1): `competition.json` publica «3ª Divisió Grup B» y
  `competition.js:105-110` adjunta `competitionName` al fixture; `matchdayLabel` compone «Jornada N
  · <nombre publicado>». No existe dirección, coordenada ni URL de mapas en todo el repositorio, y
  no hay ninguna cadena «3ª División» en castellano. No existe arnés de test de componentes React
  (los 6 test de `tests/` son `node --test` sobre módulos), y S7 prohíbe dependencias nuevas: no hay
  RED posible para un cambio de presentación; la evidencia es build, tests existentes y navegador
  real a cuatro anchos.
- **L4** Decisión de alcance: la tarjeta activa de liga deja de usar la rama `hero` de
  `FixtureCardView` y renderiza su propio póster dentro de `NextMatchCard.jsx`. `FixtureCardView`
  y `Crest.jsx` quedan intactos, de modo que la copa (cuando es la tarjeta activa) conserva
  exactamente su anatomía y su contrato.
- **L5** Evidencia de verificación (T1-T4): `npm run build` en verde y `npm test` con 39/39. Medición
  real por DevTools protocol a 1440/1024/768/390/320: `pageScrollW === vw` en todos los anchos (sin
  desbordamiento), cuatro celdas iguales en el contador (115/88/172/83/66 px de ancho por celda),
  escudos de 128/128/128/112/112 px con el mismo `y` en cada ancho y nombres con el mismo `y`,
  cabecera en orden `H2 > SPAN > P` con textos «Próximo encuentro», «3ª División», «Jornada 5 · 3ª
  División Grupo B», contador vivo (segundos 49 → 46 en 3 s), fondo del póster `rgb(37,27,29)` frente
  a la banda `oklab(0 0 0 / 0.35)`, cero `.card` anidadas, `MatchAttendance` presente y la copa
  renderizando con la anatomía compartida en la misma página. El slice aislado suma 207 líneas y
  solo sustituye dos líneas (import y export por defecto).
- **L6** El verificador independiente del slice no fue admitido en su primer lanzamiento: el encargo
  no incluía la declaración `Risk: item 6` y el gateway prohíbe reintentarlo. Las comprobaciones
  equivalentes se ejecutaron en línea (L5). `dist/` y `.taste-skill/` están en `.gitignore`.
- **L7** Despliegue y commit. El propietario pidió «despliega» y eligió publicar el árbol de trabajo
  tal cual con `vercel --prod` (sin tocar git): producción en `https://acfrio.club`, deployment
  `dpl_7oZRfmcsa1FTAKTEMXeqMVYQq7Ms` READY, bundle servido `/assets/index-xtSmH80G.js` con
  «Próximo encuentro». Verificación independiente posterior: 5 PASS y una salvedad (el código de
  salida del deploy no queda escrito en el log, solo se infiere de `READY`/`status ok`). Como
  producción quedaba por delante del historial, después pidió «comitea»: el WIP completo se
  commitea como un único snapshot en `main` para que producción sea reproducible desde git. Quedan
  fuera del commit, a propósito, el material en crudo (`Galeria/`, `actas/` PDF, `design/art`,
  `design/inspiration`, `design/sources`), el skill vendorizado `.agents/` y los directorios de
  scratch (`.comfy-scratch/`, `.playwright-mcp/`, `undefined/`).
