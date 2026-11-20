# Route metadata and the two crawler files

Branch: `feat/route-meta`. From `main` at `bf1b8a0`.

Goal: the site stops handing every address the same title and description, and it gains the two files a crawler looks for. This is the cheap half of the SEO audit the owner chose: metadata per route, `robots.txt`, `sitemap.xml`. No prerender, no visible h1 (that decision stands: `odd/tasks/design-gate-debt.md`, L14), no design change.

## Specs

S1 — Each route carries its own title and description.
> Owner's answer to the audit: «Solo lo barato: metadatos por ruta». Evidence: `/competicion` and `/logros` both answer `<title>AC FRÍO · Fútbol 7</title>` today, with one shared description and one shared `og:url`.

S2 — A crawler finds the two files it asks for.
> `https://acfrio.club/robots.txt` → 404 and `https://acfrio.club/sitemap.xml` → 404, measured before this slice. The sitemap lists the shareable paths the router answers, and it must list the club pages too, not only the five top-level sections.

S3 — Sharing a link shows that link, not the front page.
> Today `og:url` is `https://acfrio.club` on every route, and `og:title` is the club's own name on every route.

S4 — Nothing else changes.
> The visible design, the copy on screen and the sr-only h1 stay as they are. The h1 question was answered and is not reopened here.

## Tasks

| ID | Spec | Work | Route | Commit |
| --- | --- | --- | --- | --- |
| T1 | S1, S3 | A route-to-metadata table plus the DOM application of it on every route change: title, description, canonical, `og:title`, `og:description`, `og:url`. | worker | `feat(seo): ...` |
| T2 | S2 | `public/robots.txt` and a generated `public/sitemap.xml` that knows the club pages, wired into the build. | worker | `feat(seo): ...` |
| T3 | S1-S3 | Verification: each route's head in a real browser, the two files served, the sitemap's paths resolving. | inline | evidence only |

## Log

L1 (verbatim, the owner's decision):
> Solo lo barato: metadatos por ruta

(the option read: «robots.txt, sitemap.xml con las rutas reales, y por ruta: title, description, canonical y og:url. Es lo que se ve al compartir y lo que lee Google sin renderizar. Sin tocar el diseño.»)

L2 — The audit this comes from, measured against production before any change: the delivered HTML is 3.230 bytes of a React shell; `robots.txt` and `sitemap.xml` are 404; `/competicion` and `/logros` answer the same title, description and `og:url` as `/`. What is already right and must not be lost: `lang="es"`, a title, a description, `og:image` 1200x630, `og:locale`, `og:site_name`.
