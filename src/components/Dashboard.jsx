import Standings from "./Standings.jsx";
import { IdentityDoor } from "./WhoAreYou.jsx";
import NextMatchCard from "./cards/NextMatchCard.jsx";
import BreakingTicker from "./cards/BreakingTicker.jsx";
import ScorersCard from "./cards/ScorersCard.jsx";
import FormCard from "./cards/FormCard.jsx";
import FixturesCard from "./cards/FixturesCard.jsx";
import CupCard from "./cards/CupCard.jsx";
import CopaStatsCard from "./cards/CopaStatsCard.jsx";
import AttendanceCard from "./cards/AttendanceCard.jsx";
import MvpCard from "./cards/MvpCard.jsx";
import GalleryCard from "./cards/GalleryCard.jsx";
import NewsCard from "./cards/NewsCard.jsx";
import BrandModule from "./cards/BrandModule.jsx";

/**
 * Home grid: a full-width news band, then the centre column as the page's
 * protagonist — the next league match, the next cup match, the cup's own
 * statistics, the club's newsroom and the photo gallery — while standings,
 * scorers and form sit on the left and calendar, attendance, the MVP vote and the
 * brand module on the right. Every card reads only synced or club-reported data.
 *
 * The MVP card sits directly under the attendance card, the two surfaces about
 * the last played match together: who turned up, then who was the best of them.
 * It renders NOTHING unless there is a played match, a device bound to a player
 * and a configured backend, so on most visits the grid is exactly what it was;
 * it carries `max-lg:order-7`, which pushes standings, form, news, gallery and
 * the brand module one step down in the phone sequence and changes nothing on
 * desktop.
 *
 * The two fixture cards are one pair, not two unrelated modules (S6): the league
 * fixture on top and the cup fixture under it, same anatomy, and exactly one of
 * them is the active card — the one whose kickoff comes first owns the red hero
 * surface and the only attendance block (S10). When the next league match is more
 * than a week away the league card shrinks to its flat grey note and the cup card
 * takes the hero surface (S7, S8). The cup's 0/15 counter and team list moved to
 * their own card right below the pair (S9).
 *
 * The card hierarchy is otherwise unchanged: only the active fixture card owns
 * `.surface-hero` and the scorers card the accent surface (see `.surface-hero` /
 * `.surface-accent` in index.css); everything else stays on the base panel. The
 * club identity lives in the fixed header, so the grid starts with the fixture
 * itself, and it starts high: the blurred photograph is the page's ground, not a
 * band above it (owner, L28), so `pt-28` clears the fixed header and no more.
 */
export default function Dashboard() {
  return (
    <section id="partidos" className="relative pb-16 pt-28">
      <div className="wrap">
        {/* The club-code door, first thing in the grid: nobody has to scroll
            past three cards to say who they are. Once the device knows, it
            leaves, and the fixed header is the only place left that says who
            is looking — there is no chip beside the news any more. */}
        <IdentityDoor />

        {/*
         * The satirical feed, now the whole row. The identity chip used to share
         * this line and was dropped when identity moved into the fixed header
         * for good (owner), so the band reads across the page instead of around
         * a pill. Phones still drop the ticker — a headline moving sideways on a
         * 390px screen is unreadable, and the column order there is about the
         * fixture, not the news — so the margin belongs to the band itself.
         */}
        <div className="mb-6 hidden lg:block">
          <BreakingTicker />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* On phones the columns dissolve (display: contents) and every card
              gets its own order, so the owner's mobile sequence is: the two
              fixture cards, the cup's stats, calendar, scorers, attendance, the
              MVP vote, then the rest, gallery last. On desktop the three columns
              return untouched. */}
          <div className="flex max-lg:contents flex-col gap-6 lg:col-span-4">
            <Standings className="max-lg:order-8" />
            <ScorersCard className="max-lg:order-5" />
            <FormCard className="max-lg:order-9" />
          </div>

          <div className="flex max-lg:contents flex-col gap-6 lg:col-span-5">
            <NextMatchCard className="max-lg:order-1" />
            {/* The centre column holds the two fixtures, the cup's stats, the
                newsroom and the album: the content a visitor came to look at. */}
            <CupCard className="max-lg:order-2" />
            <CopaStatsCard className="max-lg:order-3" />
            <NewsCard className="max-lg:order-10" />
            <GalleryCard className="max-lg:order-11" />
          </div>

          <div className="flex max-lg:contents flex-col gap-6 lg:col-span-3">
            <FixturesCard className="max-lg:order-4" />
            <AttendanceCard className="max-lg:order-6" />
            <MvpCard className="max-lg:order-7" />
            <BrandModule className="max-lg:order-12 mt-auto" />
          </div>
        </div>
      </div>
    </section>
  );
}
