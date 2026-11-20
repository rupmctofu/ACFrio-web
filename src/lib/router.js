/**
 * A router of our own, because the site has a handful of routes and no more.
 *
 * A routing library would be more code and more bytes than the routes it would
 * serve here. What the site actually needs is a path in the address bar, a
 * history entry so the back button works, and a re-render when the path
 * changes; that is `pushState` plus `popstate`, and it is all in this file.
 *
 * The paths are the shareable ones (S7): a `/competicion/liga/7` or an
 * `/equipo/<slug>` can be pasted into the group and opened by whoever reads it.
 * Serving a direct load of one is the hosting's job, not ours — `vercel.json`
 * rewrites them to `index.html`, and Vite already answers them in dev and
 * preview — so the app only ever mounts on a path it can match.
 */
import { useEffect, useState } from "react";

const HOME = "/";

/**
 * The two tabs of `/competicion`, in the order the bar and the page show them,
 * and the one the section lands on when the address names no tab (S14).
 *
 * There were three until S22. The third one was the list of clubs, and the owner
 * folded it into the two that remain — the league's clubs under Liga, the cup's
 * under Copa — so the third pill is gone and the section is one question with two
 * answers.
 */
export const COMPETITION_TABS = ["liga", "copa"];

/**
 * The fixed sections. Anything else is either a dynamic segment or unknown.
 *
 * The site is three of these now (S14): Inicio, the Competición section with its
 * two tabs, and Logros. `reglamento` is the fourth address and not a pill of
 * the bar: the rules are opened from the dashboard card and from the footer, and
 * the bar simply lights nothing while a reader is there. It is a plain section
 * all the same — one page, one address.
 */
const SECTIONS = new Set(["logros", "reglamento"]);

const UNKNOWN = { name: "unknown", params: {} };

/**
 * The paths the fold retired (S14). Each one still resolves — the club has been
 * pasting them into the group for a season, and a link that lands on the
 * dashboard instead of on the page it names is worse than no link at all — but
 * the app corrects the address bar to the tab it became, so a reader who opens
 * an old link ends up on the canonical path.
 *
 * `jornada` carried a round in its second segment, and the round is carried
 * across: `/jornada/3` becomes `/competicion/liga/3`, which is the same night on
 * the same tab. The aliases need the same hosting rewrite every other deep link
 * has — `vercel.json` — so they resolve on a cold load and not only in-app.
 *
 * `equipos` retired twice over: the list it named was a tab and then a card
 * inside the Liga tab (S22), so the old address now lands on the league — where
 * those clubs live — instead of on nothing.
 */
const RETIRED = new Set(["jornada", "copa", "equipos", "clasificacion"]);

/** `/jornada/` and `/jornada` are one route; so are `""` and `/`. */
export const normalise = (path) => String(path ?? "").replace(/\/+$/, "") || HOME;

const currentPath = () => normalise(window.location.pathname);

/* One subscription list, so every mounted reader re-renders on one navigation. */
const subscribers = new Set();

function announce() {
  const path = currentPath();
  for (const notify of subscribers) notify(path);
}

/** The current path, and a re-render whenever it moves — ours or the browser's. */
export function useRoute() {
  const [path, setPath] = useState(currentPath);

  useEffect(() => {
    subscribers.add(setPath);
    // The address can move between the first render and this effect.
    setPath(currentPath());
    window.addEventListener("popstate", announce);
    return () => {
      subscribers.delete(setPath);
      // The last reader to leave takes the listener with it.
      if (!subscribers.size) window.removeEventListener("popstate", announce);
    };
  }, []);

  return path;
}

/**
 * Move the address bar without loading the page again.
 *
 * The scroll reset belongs to the route change: a new view starts at its top.
 * It is `instant` on purpose, because `html` scrolls smoothly for the in-page
 * anchors and a route that glided down from 3000px would read as a slideshow.
 * Repeating the current route still resets — that is how the logo and the
 * identity in the header take a reader home when they are already there.
 */
export function navigate(to, { replace = false } = {}) {
  const path = normalise(to);
  if (path !== currentPath()) {
    window.history[replace ? "replaceState" : "pushState"]({}, "", path);
    announce();
  }
  window.scrollTo({ top: 0, left: 0, behavior: "instant" });
}

/**
 * Props for an in-app link: a real `href`, so the address is visible, copyable
 * and crawlable, plus the click that spares the page a reload. Modified clicks
 * — a new tab, a download — are left to the browser, which is what a reader who
 * holds ⌘ or Ctrl is asking for.
 */
export const routeLink = (to, options) => ({
  href: to,
  onClick: (event) => {
    if (event.defaultPrevented || event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    navigate(to, options);
  },
});

const decode = (segment) => {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
};

/** A round is a positive whole number, because a jornada is counted, not named. */
const isRound = (segment) => /^[1-9][0-9]*$/.test(segment ?? "");

/**
 * What a path means.
 *
 * `/competicion/<tab>` is the section and its tab (S14), and `/competicion/liga/<n>`
 * adds the round — the shape the standalone jornada page had, kept because the
 * round is the part people share. `/equipo/<slug>` is still one dynamic segment
 * of its own: a club page is not a tab of anything.
 *
 * The retired paths are matched before anything else and answered with the tab
 * they became plus a `redirect`, so `App` can replace the address without the
 * reader ever seeing a page under a path the site no longer has. Everything
 * unmatched is `unknown`, and the app decides what to do with that.
 */
export function matchRoute(path) {
  const [first, second, third, ...rest] = normalise(path).split("/").filter(Boolean);
  if (!first) return { name: "home", params: {} };

  /* ---- The fold (S14): four retired paths, each one answered by the tab it
     belongs to now (S22 moved the club list into the liga tab). ---- */
  if (first === "jornada") {
    if (third || rest.length) return UNKNOWN;
    /* A second segment that is not a round is not a reason to send a shared link
       home: the tab opens on its default round and the address is corrected,
       the way a bad round already landed before the fold. */
    const matchday = isRound(second) ? second : null;
    return {
      name: "competicion",
      params: { tab: "liga", matchday },
      redirect: `/competicion/liga${matchday ? `/${matchday}` : ""}`,
    };
  }
  if (RETIRED.has(first)) {
    if (second) return UNKNOWN;
    /* `/clasificacion` was the league table, and the table is the left column of
       the liga tab: it opens there, next to the jornadas it is read with.
       `/equipos` was the club list, and that list is a card of the liga tab now
       (S22), so it lands on the same tab. `/copa` is the only one that is still a
       tab of its own. */
    const tab = first === "copa" ? "copa" : "liga";
    return { name: "competicion", params: { tab }, redirect: `/competicion/${tab}` };
  }

  /* ---- Competición and its tabs. ---- */
  if (first === "competicion") {
    if (!second) return { name: "competicion", params: { tab: COMPETITION_TABS[0] } };
    /* `/competicion/equipos` was the third tab, and the club list is a card of
       the liga tab now (S22): the deep link is served with the league and the
       address is corrected, the way the retired paths are. Every other segment
       in that place is unknown. */
    if (second === "equipos") {
      if (third || rest.length) return UNKNOWN;
      return {
        name: "competicion",
        params: { tab: "liga", matchday: null },
        redirect: "/competicion/liga",
      };
    }
    if (!COMPETITION_TABS.includes(second)) return UNKNOWN;
    if (rest.length) return UNKNOWN;
    /* Only the liga tab counts rounds; a `/competicion/copa/3` names nothing. */
    if (!third) return { name: "competicion", params: { tab: second, matchday: null } };
    if (second !== "liga" || !isRound(third)) return UNKNOWN;
    return { name: "competicion", params: { tab: "liga", matchday: third } };
  }

  /* ---- One dynamic segment, and one only: a club's own page (S7). ---- */
  if (second) {
    if (third || rest.length) return UNKNOWN;
    if (first === "equipo") return { name: "team", params: { slug: decode(second) } };
    return UNKNOWN;
  }

  if (SECTIONS.has(first)) return { name: first, params: {} };
  return UNKNOWN;
}
