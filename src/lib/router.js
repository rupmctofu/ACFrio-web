/**
 * A router of our own, because the site has a handful of routes and no more.
 *
 * A routing library would be more code and more bytes than the routes it would
 * serve here. What the site actually needs is a path in the address bar, a
 * history entry so the back button works, and a re-render when the path
 * changes; that is `pushState` plus `popstate`, and it is all in this file.
 *
 * The paths are the shareable ones (S7): a `/jornada/7` or an `/equipo/<slug>`
 * can be pasted into the group and opened by whoever reads it. Serving a direct
 * load of one is the hosting's job, not ours — `vercel.json` rewrites them to
 * `index.html`, and Vite already answers them in dev and preview — so the app
 * only ever mounts on a path it can match.
 */
import { useEffect, useState } from "react";

const HOME = "/";

/**
 * The fixed sections. Anything else is either a dynamic segment or unknown.
 *
 * `reglamento` is one of these and not one of the bar's six: the pills already
 * fill the width at 1024, so the league rules are opened from the dashboard
 * card and from the footer and the bar simply lights nothing while a reader is
 * there. It is a plain section all the same — one page, one address.
 */
const SECTIONS = new Set([
  "jornada",
  "equipos",
  "clasificacion",
  "copa",
  "logros",
  "reglamento",
]);

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

/**
 * What a path means.
 *
 * One level of dynamic segment, and one only: `/equipo/<slug>` is the team page
 * (S7) and `/jornada/<n>` is a round. The team view arrives in the next task,
 * but the shape it will read is settled here, so the router does not have to
 * change under it later. `/copa` is a plain section, like `/clasificacion` and
 * `/logros`: the cup needs no segment because it has one group and one knockout,
 * and the shelf has one page because the catalogue is one list. Everything it
 * cannot match is `unknown`, and the app decides what to do with that.
 */
export function matchRoute(path) {
  const [first, second, ...rest] = normalise(path).split("/").filter(Boolean);
  if (!first) return { name: "home", params: {} };
  if (!second) {
    return SECTIONS.has(first) ? { name: first, params: {} } : { name: "unknown", params: {} };
  }
  if (rest.length) return { name: "unknown", params: {} };
  if (first === "equipo") return { name: "team", params: { slug: decode(second) } };
  if (first === "jornada") return { name: "jornada", params: { matchday: second } };
  return { name: "unknown", params: {} };
}
