# AC FRÍO · Design system

Tokens capturados desde el proyecto. Fuente principal: `src/index.css` (`@theme` de Tailwind v4).
Familias declaradas: `index.html` (Google Fonts). Colores de componentes: los propios `.jsx`.
Ningún valor de este documento es inventado: todo aparece en los archivos citados.

## Color

### Tokens del tema — `src/index.css`

| Token | Valor | Uso observado |
| --- | --- | --- |
| `--color-acf-red` | `#e61c24` | Marca, CTA, eyebrows, acentos, cifras destacadas |
| `--color-acf-red-dark` | `#b0141b` | Hover de CTA, fin del gradiente de la rajada |
| `--color-acf-dark` | `#0d0d0d` | Fondo de página y de pastillas internas |
| `--color-acf-panel` | `#161616` | Superficie de tarjetas |
| `--color-acf-panel-light` | `#1e1e1e` | Hover de filas y degradados de tarjeta |
| `--color-acf-line` | `#2a2a2a` | Bordes de 1px, separadores |
| `--color-acf-white` | `#ffffff` | Texto de máximo contraste |
| `--color-acf-snow` | `#e8e8e8` | Texto base y titulares del hero |
| `--color-acf-grey` | `#8a8a8a` | Texto secundario, etiquetas |
| `--color-acf-dim` | `#555555` | Texto terciario |

### Degradados y utilidades de color — `src/index.css`

| Utilidad | Valor | Uso |
| --- | --- | --- |
| `.text-red-gradient` | `linear-gradient(135deg, #ff4d55, #e61c24 55%, #b0141b)` + `background-clip: text` | Parte roja del wordmark "AC FRÍO" |
| `.cold-bar` | `linear-gradient(90deg, #2b6cb0, #63b3ed 40%, #fff 75%, #e61c24)` | Barra "Nivel de Frío" |

### Colores fuera del tema (deuda visual)

Aparecen en componentes y no existen como tokens: escalas crudas de Tailwind.

| Clase | Valor | Dónde |
| --- | --- | --- |
| `yellow-600` | `#ca8a04` | Chip POR — `src/components/Squad.jsx` |
| `blue-600` | `#2563eb` | Chip DEF — `src/components/Squad.jsx` |
| `green-600` | `#16a34a` | Chip MED — `src/components/Squad.jsx` |
| `red-600` | `#dc2626` | Chip DEL — `src/components/Squad.jsx` |
| `sky-300` / `sky-400` / `sky-500` | `#7dd3fc` / `#38bdf8` / `#0ea5e9` | Premio Congelado y chip ICE — `Squad.jsx`, `Vestuario.jsx` |
| `green-400` / `red-400` | `#4ade80` / `#f87171` | Diferencia de goles — `src/components/Standings.jsx` |

## Tipografía

| Token | Valor | Fuente |
| --- | --- | --- |
| `--font-display` | `"Bebas Neue", sans-serif` | `src/index.css` |
| `--font-body` | `"Inter", sans-serif` | `src/index.css` |

Carga: Google Fonts, pesos Inter `400;500;600;700;800` — `index.html`.

### Escala en uso

| Rol | Tamaño | Clases observadas |
| --- | --- | --- |
| Micro-etiqueta | 8 / 9 / 10 px | `text-[8px]`, `text-[9px]`, `text-[10px]` con `tracking-[0.2em]`–`[0.35em]`, mayúsculas |
| Secundario | 12 / 14 px | `text-xs`, `text-sm` |
| Cuerpo | 16 px | base |
| Display de sección | 30 px | `font-display text-3xl tracking-widest` (eyebrow rojo) |
| Título de sección | 36–48 px | `font-display text-4xl sm:text-5xl` |
| Cifra grande | 48–72 px | `text-5xl sm:text-6xl lg:text-7xl` (countdown, marcador) |
| Titular del hero | 48–72 px | `text-5xl sm:text-6xl lg:text-7xl font-bold` en `--font-body` |

Reglas de composición: display siempre en mayúsculas; `tracking-widest` en eyebrows; titular del hero
en la familia de cuerpo (única excepción al display).

## Espaciado

| Elemento | Valor | Fuente |
| --- | --- | --- |
| Contenedor ancho | `max-w-7xl` = 1280 px | todas las secciones |
| Contenedor estrecho | `max-w-6xl` = 1152 px | `src/components/Standings.jsx` |
| Padding lateral | 16 / 24 / 32 px | `px-4 sm:px-6 lg:px-8` |
| Padding vertical de sección | 96 px | `py-24` |
| Separación entre tarjetas | 24 / 32 px | `gap-6`, `gap-8` |
| Padding interno de tarjeta | 28 / 36 px | `p-7 sm:p-9` |

## Radio

| Clase | Valor | Uso |
| --- | --- | --- |
| `rounded-sm` | 4 px | Chips MVP/ICE, marcador de dorsal |
| `rounded-md` | 6 px | `StatChip` |
| `rounded-xl` | 12 px | Escudos y avatar MVP |
| `rounded-full` | 9999 px | Puntos "en vivo", barra de frío |

## Recortes (firma visual del sistema)

| Utilidad | Valor | Uso |
| --- | --- | --- |
| `.clip-edge` | `polygon(0 0, 100% 0, 100% calc(100% - 24px), calc(100% - 24px) 100%, 0 100%)` | Botones, tarjetas de equipación, chips pequeños |
| `.clip-edge-tl` | `polygon(24px 0, 100% 0, 100% 100%, 0 100%, 0 24px)` | Tarjetas de contenido |

Regla: el recorte de 24 px solo es válido en cajas de altura ≥ 48 px; por debajo destruye el contenido.

## Sombras

| Token | Valor |
| --- | --- |
| `--shadow-acf` | `0 12px 40px -8px rgba(0,0,0,0.8)` |
| `--shadow-red` | `0 0 24px rgba(230,28,36,0.35)` |
| `--shadow-red-lg` | `0 0 60px rgba(230,28,36,0.45)` |
| `.drop-shadow-red` | `drop-shadow(0 6px 16px rgba(230,28,36,0.28))` |

## Textura y movimiento

| Utilidad | Valor | Fuente |
| --- | --- | --- |
| `.texture-grain` | SVG `feTurbulence` inline, `opacity: 0.05` | `src/index.css` |
| `anim-pulse-red` | `pulse-red 2.2s` — anillo de 14 px | `src/index.css` |
| `anim-frost-in` | `frost-in 0.8s` — `translateY(24px)` + blur 6px | `src/index.css` |
| `anim-float-slow` | `float-slow 6s` — ±14 px | `src/index.css` |
| `anim-marquee` | `marquee 30s` lineal | `src/index.css` |
| Niebla | Vanta FOG WebGL (`highlightColor 0xed0707`, `speed 1.1`, `blurFactor 0.45`) con fallback CSS `fog-drift` 25/35/45 s | `src/components/Hero.jsx`, `src/index.css` |

`prefers-reduced-motion` no está contemplado en el proyecto: es deuda explícita.

## Componentes

| Componente | Reglas | Fuente |
| --- | --- | --- |
| Tarjeta | `bg-acf-panel` + `border-acf-line` + `clip-edge-tl` + `shadow-acf`; hover: borde rojo al 60 %, `-translate-y-1.5`, `shadow-red` | `Squad.jsx`, `Armor.jsx` |
| CTA primario | `bg-acf-red` + texto blanco bold + `clip-edge`; hover `acf-red-dark` + `shadow-red-lg` | `Hero.jsx` |
| CTA secundario | `border-acf-line` + `bg-acf-panel/60`; hover borde rojo | `Hero.jsx` |
| Eyebrow + título | `<p>` display rojo 30 px tracking-widest + `<h2>` display 36–48 px mayúsculas | las 6 secciones |
| Chip de posición | Fondo de color crudo + 10 px bold mayúsculas + `clip-edge` | `Squad.jsx` |
| Fila de tabla | Borde superior `acf-line`; hover `panel-light`; fila propia: `bg-acf-red/15` | `Standings.jsx` |
| Navbar | Fija, 64 px, transparente al inicio y `bg-acf-dark/90` + blur al hacer scroll | `Navbar.jsx` |
