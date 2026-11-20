import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { registerHooks } from "node:module";

/**
 * What each address says about itself, and the two files a crawler asks for
 * (S1, S2, S3).
 *
 * The tests below ask the modules the site actually ships, never a copy of their
 * copy: `matchRoute` decides what an address means, `routeMeta` decides what the
 * head says, and `scripts/build-sitemap.mjs` decides what a crawler is given. The
 * two files are read from disk, because a file that is committed and generated is
 * a file that can silently fall behind the routes it lists.
 *
 * `src/data/competition.js` is written for the bundler (it imports its JSON
 * neighbour without an import attribute, which Node refuses), so one hook
 * teaches the loader that habit — the same shim `attendance-record.test.mjs`
 * uses, and for the same reason: a test that re-implements the name lookup would
 * pass while the page showed something else.
 */
registerHooks({
  resolve(specifier, context, next) {
    const relative = specifier.startsWith("./") || specifier.startsWith("../");
    if (relative && !/\.[a-z]+$/i.test(specifier)) return next(`${specifier}.js`, context);
    return next(specifier, context);
  },
  load(url, context, next) {
    if (url.endsWith(".json")) {
      return {
        format: "json",
        source: readFileSync(fileURLToPath(url), "utf8"),
        shortCircuit: true,
      };
    }
    return next(url, context);
  },
});

const {
  routeMeta,
  shareablePaths,
  absoluteUrl,
  applyRouteMeta,
  SITE_ORIGIN,
  HOME_PATH,
  DEFAULT_TITLE,
  DEFAULT_DESCRIPTION,
} = await import("../src/lib/route-meta.js");
const { matchRoute, COMPETITION_TABS } = await import("../src/lib/router.js");
const { teamFullName, teamStanding } = await import("../src/data/competition.js");
const { sitemapXml } = await import("../scripts/build-sitemap.mjs");

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const read = (relative) => readFileSync(`${ROOT}${relative}`, "utf8");

/** Titles a result page shows whole, descriptions a snippet shows whole. */
const TITLE_LIMIT = 60;
const DESCRIPTION_LIMIT = 160;

/** The retired addresses, as `src/lib/router.js` still answers them. */
const RETIRED_PATHS = ["/jornada", "/jornada/3", "/copa", "/equipos", "/clasificacion", "/competicion/equipos"];

/** One address per shape the router can answer, plus one it cannot. */
const PROBE_PATHS = [
  "/",
  ...COMPETITION_TABS.map((tab) => `/competicion/${tab}`),
  "/competicion/liga/3",
  "/logros",
  "/reglamento",
  "/equipo/el-templo",
  "/no-existe",
  "/equipo/a/b",
  ...RETIRED_PATHS,
];

const metaOf = (path) => routeMeta(matchRoute(path));

test("every route name the router answers has its own title and description", () => {
  const names = new Set(PROBE_PATHS.map((path) => matchRoute(path).name));

  /* The whole vocabulary, so a route added later cannot arrive without copy. */
  assert.deepEqual([...names].sort(), [
    "competicion",
    "home",
    "logros",
    "reglamento",
    "team",
    "unknown",
  ]);

  for (const path of PROBE_PATHS) {
    const meta = metaOf(path);
    assert.ok(meta.title.length > 0, `${path} names nothing`);
    assert.ok(meta.description.length > 0, `${path} describes nothing`);
    assert.ok(
      meta.title.length <= TITLE_LIMIT,
      `${path} title is ${meta.title.length} characters: ${meta.title}`
    );
    assert.ok(
      meta.description.length <= DESCRIPTION_LIMIT,
      `${path} description is ${meta.description.length} characters`
    );
    assert.equal(meta.ogTitle, meta.title);
    assert.equal(meta.ogDescription, meta.description);
  }
});

test("no two routes share a title", () => {
  /* Two addresses of the same tab are one page and may share its words — the
     tab without a round and the tab with a bad one are the same page. What must
     not collide is one page with another: a club with a club, a section with a
     section, a round with the tab it belongs to. */
  const paths = [...shareablePaths(), "/competicion/liga/1", "/competicion/liga/14"];
  const titles = paths.map((path) => metaOf(path).title);
  assert.equal(new Set(titles).size, titles.length);
});

test("canonical paths are unique, absolute and never end in a slash", () => {
  const canonicals = shareablePaths().map((path) => metaOf(path).canonicalPath);

  assert.equal(new Set(canonicals).size, canonicals.length, "two routes share a canonical");

  for (const canonical of canonicals) {
    assert.ok(canonical.startsWith("/"), `${canonical} is not a path`);
    /* The front page is the one address that is a single slash and nothing else. */
    if (canonical !== HOME_PATH) assert.ok(!canonical.endsWith("/"), `${canonical} ends in a slash`);
    assert.equal(absoluteUrl(canonical), `${SITE_ORIGIN}${canonical}`);
  }
});

test("the shareable paths are the ones the router answers, and none it retired", () => {
  const paths = shareablePaths();

  assert.deepEqual(paths, [
    "/",
    "/competicion/liga",
    "/competicion/copa",
    "/logros",
    "/reglamento",
    ...paths.filter((path) => path.startsWith("/equipo/")),
  ]);

  for (const path of paths) {
    const route = matchRoute(path);
    assert.ok(route.name !== "unknown", `${path} is not a route`);
    assert.equal(route.redirect, undefined, `${path} is a redirect, not a page`);
    assert.equal(metaOf(path).canonicalPath, path, `${path} is not its own canonical`);
  }

  for (const retired of RETIRED_PATHS) {
    assert.ok(!paths.includes(retired), `${retired} is retired and still listed`);
  }
});

test("a retired path answers with the address it became", () => {
  assert.equal(metaOf("/jornada/3").canonicalPath, "/competicion/liga/3");
  assert.equal(metaOf("/jornada").canonicalPath, "/competicion/liga");
  assert.equal(metaOf("/copa").canonicalPath, "/competicion/copa");
  assert.equal(metaOf("/clasificacion").canonicalPath, "/competicion/liga");
  assert.equal(metaOf("/equipos").canonicalPath, "/competicion/liga");
  assert.equal(metaOf("/competicion/equipos").canonicalPath, "/competicion/liga");
  assert.equal(metaOf("/competicion").canonicalPath, "/competicion/liga");
});

test("a club page names the club it is about, in the competition the page draws", () => {
  for (const path of shareablePaths().filter((item) => item.startsWith("/equipo/"))) {
    const slug = path.slice("/equipo/".length);
    const meta = metaOf(path);
    const standing = teamStanding(slug);

    assert.ok(meta.title.includes(teamFullName(slug)), `${path} does not name ${teamFullName(slug)}`);
    assert.ok(standing, `${slug} plays no competition this season`);

    for (const copy of [meta.title, meta.description]) {
      assert.ok(
        copy.includes(standing.competition.name),
        `${path} does not say which competition: ${copy}`
      );
    }
  }
});

test("a competition tab names the league or the cup, and the round when it holds one", () => {
  assert.ok(metaOf("/competicion/liga").title.includes("Liga"));
  assert.ok(metaOf("/competicion/copa").title.includes("Copa"));

  for (const round of ["1", "3", "14"]) {
    const meta = metaOf(`/competicion/liga/${round}`);
    assert.ok(meta.title.includes(`Jornada ${round}`), meta.title);
    assert.ok(meta.description.includes(`Jornada ${round}`), meta.description);
    assert.equal(meta.canonicalPath, `/competicion/liga/${round}`);
  }

  /* The cup counts no rounds, so no cup address is a round. */
  assert.equal(matchRoute("/competicion/copa/3").name, "unknown");
});

test("the club's own head is the fallback, and it is still the one index.html ships", () => {
  const html = read("index.html");
  const title = /<title>([^<]+)<\/title>/.exec(html)?.[1];
  const description = /<meta name="description" content="([^"]*)"/.exec(html)?.[1];

  assert.equal(title, DEFAULT_TITLE);
  assert.equal(description, DEFAULT_DESCRIPTION);

  /* Nothing this slice touched, and nothing it may lose (L2). */
  assert.match(html, /<html lang="es">/);
  assert.match(html, /<meta property="og:image" content="https:\/\/acfrio\.club\/og-image\.jpg\?v=2"/);
  assert.match(html, /<meta property="og:image:width" content="1200"/);
  assert.match(html, /<meta property="og:image:height" content="630"/);
  assert.match(html, /<meta property="og:locale" content="es_ES"/);
  assert.match(html, /<meta property="og:site_name" content="AC FRÍO"/);

  for (const path of ["/", "/no-existe", "/equipo/no-existe"]) {
    const meta = metaOf(path);
    assert.equal(meta.title, DEFAULT_TITLE);
    assert.equal(meta.description, DEFAULT_DESCRIPTION);
  }
});

test("the head is written once per navigation and never twice", () => {
  /* A head just like the one `index.html` builds, without a browser: every
     selector `applyRouteMeta` asks for, and a place to append the tags it creates. */
  const element = (tagName) => {
    const attributes = new Map();
    return {
      tagName,
      setAttribute: (attribute, value) => attributes.set(attribute, String(value)),
      getAttribute: (attribute) => attributes.get(attribute) ?? null,
      attributes,
    };
  };

  const head = {
    children: [],
    append(child) {
      this.children.push(child);
    },
    querySelector(selector) {
      const [, tagName, attribute, value] = /^([a-z]+)\[([\w-]+)="([^"]+)"\]$/.exec(selector);
      return (
        this.children.find(
          (child) => child.tagName === tagName && child.getAttribute(attribute) === value
        ) ?? null
      );
    },
  };

  const document = { title: "", head, createElement: element };
  globalThis.document = document;

  const expected = new Map();
  try {
    /* Ten navigations, back and forth, the way a reader walks the site. */
    const walk = ["/", "/logros", "/equipo/el-templo", "/competicion/copa", "/competicion/liga/3"];
    for (let step = 0; step < 10; step += 1) {
      const path = walk[step % walk.length];
      const meta = metaOf(path);
      applyRouteMeta(meta);
      expected.set(path, meta);
    }

    const last = expected.get(walk[9 % walk.length]);
    assert.equal(document.title, last.title);
    assert.equal(head.children.length, 7, "a tag was appended twice");

    const count = (tagName, attribute, value) =>
      head.children.filter(
        (child) => child.tagName === tagName && child.getAttribute(attribute) === value
      ).length;

    assert.equal(count("meta", "name", "description"), 1);
    assert.equal(count("meta", "property", "og:title"), 1);
    assert.equal(count("meta", "property", "og:description"), 1);
    assert.equal(count("meta", "property", "og:url"), 1);
    assert.equal(count("meta", "name", "twitter:title"), 1);
    assert.equal(count("meta", "name", "twitter:description"), 1);
    assert.equal(count("link", "rel", "canonical"), 1);

    assert.equal(
      head.querySelector('link[rel="canonical"]').getAttribute("href"),
      `${SITE_ORIGIN}${last.canonicalPath}`
    );
    assert.equal(
      head.querySelector('meta[property="og:url"]').getAttribute("content"),
      `${SITE_ORIGIN}${last.canonicalPath}`
    );
  } finally {
    delete globalThis.document;
  }
});

test("the sitemap lists every club page and no retired path", () => {
  const locs = [...sitemapXml().matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);

  assert.equal(new Set(locs).size, locs.length, "the sitemap repeats an address");
  assert.deepEqual(
    locs,
    shareablePaths().map((path) => `${SITE_ORIGIN}${path}`),
    "the sitemap disagrees with the route table"
  );

  for (const path of ["/", "/competicion/liga", "/competicion/copa", "/logros", "/reglamento"]) {
    assert.ok(locs.includes(`${SITE_ORIGIN}${path}`), `the sitemap is missing ${path}`);
  }

  for (const path of shareablePaths().filter((item) => item.startsWith("/equipo/"))) {
    assert.ok(locs.includes(`${SITE_ORIGIN}${path}`), `the sitemap is missing ${path}`);
  }

  for (const loc of locs) {
    assert.ok(loc.startsWith(`${SITE_ORIGIN}/`), `${loc} is not on the site's own origin`);
    const path = loc.slice(SITE_ORIGIN.length);
    if (path !== "/") assert.ok(!path.endsWith("/"), `${loc} ends in a slash`);
    for (const retired of RETIRED_PATHS) assert.notEqual(path, retired, `${loc} is retired`);
    assert.ok(!/\/(jornada|equipos|clasificacion)(\/|$)/.test(path), `${loc} is retired`);
  }

  /* The committed file is the one this build would write: a generated file that
     is never regenerated is a file that lies about the routes. */
  assert.equal(read("public/sitemap.xml"), sitemapXml());
});

test("robots.txt allows everything and points at the sitemap", () => {
  const robots = read("public/robots.txt");

  assert.match(robots, /^User-agent: \*\n/);
  assert.match(robots, /^Allow: \/\n/m);
  assert.match(robots, /^Sitemap: https:\/\/acfrio\.club\/sitemap\.xml$/m);
  assert.equal((robots.match(/^User-agent:/gm) ?? []).length, 1, "robots.txt grew a user-agent maze");
  assert.doesNotMatch(robots, /Crawl-delay/i);
});
