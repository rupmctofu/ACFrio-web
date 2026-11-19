import Dashboard from "../components/Dashboard.jsx";
import Squad from "../components/Squad.jsx";
import { VOICE } from "../data/copy.js";

/**
 * `/` — the club's own page, unchanged (S3).
 *
 * This is the dashboard the site has always been: the same components, in the
 * same order, with the same copy. The routes put it behind a path and a navbar
 * link, and that is the whole difference; the club's voice is not a second
 * layer under the league, it is the front door.
 *
 * The page's only h1 lives here, where it always did: the club's name is painted
 * by the header logo and the navbar, so the heading stays for the document
 * outline and for anyone reading with a screen reader. The other views carry
 * their own h1 with their own section name.
 */
export default function HomeView() {
  return (
    <>
      <h1 className="sr-only">
        AC FRÍO · {VOICE.brand.headline} · {VOICE.brand.echo}
      </h1>
      <Dashboard />
      <Squad />
    </>
  );
}
