/**
 * Writes `public/sitemap.xml` (S2) from the route table the app itself answers.
 *
 * The list of paths is not written here: it is `shareablePaths()` from
 * `src/lib/route-meta.js`, the same module the head reads and the same data the
 * views read, so a club that appears on the site appears in the sitemap and a
 * path the router retired cannot survive in a file nobody re-reads. Run by
 * `npm run build` before Vite, which copies `public/` into `dist/` as it is —
 * which is also why the file is committed: it is the one a review reads in a
 * diff.
 *
 * Run: npm run build (or `node scripts/build-sitemap.mjs` on its own)
 */
import { writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SITE_ORIGIN, shareablePaths } from "../src/lib/route-meta.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "public", "sitemap.xml");

/**
 * The document, one `<url>` per path and nothing else in it.
 *
 * No `lastmod`, no `changefreq`, no `priority`: the first is a date this build
 * does not know and the other two are ignored by every crawler that matters.
 * One URL per line block is what keeps the committed file readable in a diff.
 */
export function sitemapXml() {
  const urls = shareablePaths()
    .map((path) => `  <url>\n    <loc>${SITE_ORIGIN}${path}</loc>\n  </url>`)
    .join("\n");

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    urls,
    "</urlset>",
    "",
  ].join("\n");
}

/* Importing this module (the tests do) must not write anything. */
const invokedDirectly =
  Boolean(process.argv[1]) &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));

if (invokedDirectly) {
  writeFileSync(OUT, sitemapXml(), "utf8");
  console.log(`public/sitemap.xml · ${shareablePaths().length} rutas`);
}
