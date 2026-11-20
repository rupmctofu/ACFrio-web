/**
 * What the head says on each address, and the one call that writes it (S1, S3).
 *
 * Every page used to answer the club's own title, its one description and its
 * `og:url` (S1): pasting `/logros` or a club's page into the group showed the
 * front page, which is a shared link that lies about where it goes. The table
 * below is the whole fix — one entry per route name `matchRoute` can return, and
 * the copy built from the same data the view reads, so a club page names the
 * club the page is about and the league's tab names the league.
 *
 * The copy is Spanish, it is the club's voice, and it is only facts: the
 * competition's published name, the round the address holds, the club's own
 * name. Nothing here promises anything about the season and nothing here is an
 * adjective the data does not support.
 *
 * `competition.json` is imported with an import attribute on purpose: this
 * module is read by the browser, by `scripts/build-sitemap.mjs` and by the
 * tests, and the attribute is what makes a JSON file a module to all three. The
 * route table therefore has exactly one owner, and the sitemap cannot list a
 * path the app does not answer.
 */
import competition from "../data/competition.json" with { type: "json" };

/** Where the site lives: a canonical and an `og:url` are absolute or useless. */
export const SITE_ORIGIN = "https://acfrio.club";

/** The front page's path, and where an address the router cannot match lands. */
export const HOME_PATH = "/";

/*
 * The club's own head, word for word what `index.html` ships before React has
 * run, and the answer for any route with no entry below. The test reads that
 * file and holds these two equal to it, so the fallback cannot drift from the
 * HTML a crawler gets on a cold load.
 */
export const DEFAULT_TITLE = "AC FRÍO · Fútbol 7";
export const DEFAULT_DESCRIPTION =
  "AC FRÍO — Sangre Fría. Juego al Rojo. Equipo de fútbol 7 fundado en 2026.";

/** The club that owns the site, as the synced data publishes it. */
const CLUB = competition.club.name;

/** The season every section of the site is about, as the data publishes it. */
const SEASON = competition.season;

/**
 * The two tabs of `/competicion`, with the competition each one draws (S14).
 *
 * `label` is the word the pills print; `key` is the key the data uses. Nothing
 * is looked up by the published name: a name is copy, and copy changes.
 */
const TABS = {
  liga: { key: "league", label: "Liga" },
  copa: { key: "cup", label: "Copa" },
};

const findCompetition = (key) => competition.competitions.find((item) => item.key === key) ?? null;

/*
 * The one club whose published name is a sponsor sheet, and the short form the
 * club uses instead. `src/data/competition.js` holds the same override for the
 * page itself (`CLUB_NAMES`) and cannot be imported here — it imports its JSON
 * the bundler's way, and this module also has to load under Node for the sitemap
 * script. The duplication is checked: `tests/route-meta.test.mjs` asks both
 * modules for every club's name and fails if they disagree.
 */
const CLUB_NAMES = {
  francesco: "L'Autentico",
};

/** The name a page prints for a club: the club's own short form, else the source's. */
const clubName = (slug) => CLUB_NAMES[slug] ?? competition.teams[slug]?.name ?? slug;

/**
 * The competition a club's page leads with: the league when the club plays it,
 * else the cup. That is the order `teamStanding` reads them in, so the head and
 * the page talk about the same table.
 */
const leadingCompetition = (slug) =>
  competition.competitions.find((item) => item.table.some((row) => row.slug === slug)) ?? null;

/**
 * "Liga · 3ª Divisió Grup B", or the published name alone when the label is
 * already in it — the cup is called "La Copa 2027 Grup B", and "Copa · La Copa
 * 2027 Grup B" is one word too many.
 */
const competitionTitle = (tab, name) =>
  name.toLowerCase().includes(TABS[tab].label.toLowerCase()) ? name : `${TABS[tab].label} · ${name}`;

/** A round is a positive whole number, and anything else is not one. */
const roundOf = (matchday) => (/^[1-9][0-9]*$/.test(String(matchday ?? "")) ? String(matchday) : null);

/** The two sections, and the sentence each one answers with. */
const SECTION_META = {
  logros: {
    title: `Logros · ${CLUB}`,
    description: `Los logros del ${CLUB} en la temporada ${SEASON}: los de equipo y los de jugador.`,
  },
  reglamento: {
    title: `Reglamento · ${CLUB}`,
    description:
      "El reglamento del Consell Esportiu del Garraf, resumido en castellano: las reglas que un jugador se va a encontrar.",
  },
};

/**
 * One route's entry, or `null` when the address is not one the site answers.
 *
 * `path` is the canonical one, built from the route it resolved to rather than
 * from the address bar: `/competicion` and `/jornada/3` are served as the tab
 * they became, and their canonical is that tab's path, not the alias.
 */
function entryFor(name, params = {}) {
  if (name === "competicion") {
    const tab = Object.hasOwn(TABS, params.tab) ? params.tab : "liga";
    const competitionName = findCompetition(TABS[tab].key)?.name ?? TABS[tab].label;
    const subject = competitionTitle(tab, competitionName);
    /* Only the league counts rounds; a `/competicion/copa/3` names nothing. */
    const round = tab === "liga" ? roundOf(params.matchday) : null;

    if (round) {
      return {
        title: `Jornada ${round} · ${subject} · ${CLUB}`,
        description: `Jornada ${round} de la ${competitionName}: los partidos del ${CLUB} y la clasificación.`,
        path: `/competicion/liga/${round}`,
      };
    }

    return {
      title: `${subject} · ${CLUB}`,
      description: `${competitionName}: clasificación, calendario y resultados del ${CLUB}.`,
      path: `/competicion/${tab}`,
    };
  }

  if (name === "team") {
    const slug = params.slug;
    /* A slug the season does not publish is not a club page: the view says so
       and offers the list, and the head keeps the club's own words. */
    if (!slug || !competition.teams[slug]) return null;

    const club = clubName(slug);
    const competitionName = leadingCompetition(slug)?.name;
    return {
      title: competitionName ? `${club} · ${competitionName}` : club,
      description: competitionName
        ? `${club} · ${competitionName}: clasificación, forma y calendario.`
        : `${club}: clasificación, forma y calendario.`,
      path: `/equipo/${slug}`,
    };
  }

  return SECTION_META[name] ? { ...SECTION_META[name], path: `/${name}` } : null;
}

/**
 * What one address says about itself, given the route `matchRoute` returned.
 *
 * `ogTitle` and `ogDescription` carry the same two sentences as the title and
 * the description: a share card and a result page want the same lines, and they
 * are separate fields so a route that ever wants something else can say so
 * without the caller changing.
 */
export function routeMeta(route) {
  const entry = entryFor(route?.name, route?.params ?? {});
  const title = entry?.title ?? DEFAULT_TITLE;
  const description = entry?.description ?? DEFAULT_DESCRIPTION;

  return {
    title,
    description,
    canonicalPath: entry?.path ?? HOME_PATH,
    ogTitle: title,
    ogDescription: description,
  };
}

/** An absolute address, which is what a canonical and an `og:url` have to be. */
export const absoluteUrl = (canonicalPath) => `${SITE_ORIGIN}${canonicalPath}`;

/**
 * Every address worth handing a crawler (S2): the front page, the two tabs of
 * the competition, the two sections and every club page the season publishes.
 *
 * A retired path is not here on purpose. `/jornada/3`, `/equipos`, `/copa` and
 * `/clasificacion` all answer with the tab they became and a redirect, and a
 * sitemap that lists a redirect is a sitemap asking to be treated as noise. The
 * rounds of the league are not here either: they are the same page with another
 * number, and the tab is what a reader shares.
 */
export function shareablePaths() {
  return [
    HOME_PATH,
    ...Object.keys(TABS).map((tab) => `/competicion/${tab}`),
    ...Object.keys(SECTION_META).map((name) => `/${name}`),
    ...Object.keys(competition.teams).map((slug) => `/equipo/${slug}`),
  ];
}

/* --------------------------------------------------------------------------
   The DOM side (S1, S3): six targets, written in place, on every route.
   -------------------------------------------------------------------------- */

/**
 * A head tag, found by `selector` or created with `attributes` and appended.
 *
 * Looking before creating is the whole idempotence: ten navigations find the
 * same six tags every time and rewrite their attributes, so the document never
 * ends up with two descriptions or two canonicals. Reading before assuming is
 * the other half — the canonical is not in `index.html`, so it is created the
 * first time rather than queried and forgotten.
 */
function headTag(selector, tagName, attributes) {
  const existing = document.head.querySelector(selector);
  if (existing) return existing;

  const tag = document.createElement(tagName);
  for (const [attribute, value] of Object.entries(attributes)) tag.setAttribute(attribute, value);
  document.head.append(tag);
  return tag;
}

const metaTag = (attribute, key) =>
  headTag(`meta[${attribute}="${key}"]`, "meta", { [attribute]: key });

/**
 * Put one route's metadata on the document.
 *
 * Called from the shell on mount and on every path change, and safe to call
 * twice or ten times: each of the six is a lookup and a write, never an append.
 * It does nothing at all where there is no document, so the same module can be
 * read by Node (the sitemap script, the tests) without a browser in sight.
 */
export function applyRouteMeta(meta) {
  if (typeof document === "undefined") return;

  const url = absoluteUrl(meta.canonicalPath);

  document.title = meta.title;
  metaTag("name", "description").setAttribute("content", meta.description);
  metaTag("property", "og:title").setAttribute("content", meta.ogTitle);
  metaTag("property", "og:description").setAttribute("content", meta.ogDescription);
  metaTag("property", "og:url").setAttribute("content", url);
  /*
   * `index.html` ships a Twitter card as well as the Open Graph one, and half a
   * card is worse than none: until this pair landed, a deep link shared on X
   * showed the club's front-page words under the deep link's own picture.
   */
  metaTag("name", "twitter:title").setAttribute("content", meta.ogTitle);
  metaTag("name", "twitter:description").setAttribute("content", meta.ogDescription);
  headTag('link[rel="canonical"]', "link", { rel: "canonical" }).setAttribute("href", url);
}
