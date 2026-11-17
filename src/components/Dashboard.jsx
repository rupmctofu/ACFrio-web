import Standings from "./Standings.jsx";
import WhoAreYou from "./WhoAreYou.jsx";
import NextMatchCard from "./cards/NextMatchCard.jsx";
import BreakingTicker from "./cards/BreakingTicker.jsx";
import ScorersCard from "./cards/ScorersCard.jsx";
import FormCard from "./cards/FormCard.jsx";
import FixturesCard from "./cards/FixturesCard.jsx";
import CupCard from "./cards/CupCard.jsx";
import AttendanceCard from "./cards/AttendanceCard.jsx";
import GalleryCard from "./cards/GalleryCard.jsx";

/**
 * Home grid: a full-width news band, then the next match at the top of the
 * centre column with the cup table and the club's own photo gallery under it;
 * standings, scorers and form sit on the left, calendar and attendance on the
 * right. Every card reads only synced or club-reported data.
 *
 * The card hierarchy is deliberate: the next match owns the hero surface and the
 * scorers card the accent surface (see `.surface-hero` / `.surface-accent` in
 * index.css); everything else stays on the base panel. The club identity lives
 * in the fixed header, so the grid starts with the fixture itself.
 */
export default function Dashboard() {
  return (
    <section id="partidos" className="relative pb-16 pt-24">
      <div className="wrap">
        {/* The passwordless door, first thing in the grid: nobody has to scroll
            past three cards to say who they are. */}
        <WhoAreYou />

        {/* The satirical feed reads as a band across the page, not as a card in
            the centre column (owner, L19). Phones drop it entirely: a headline
            moving sideways on a 390px screen is unreadable, and the column order
            there is about the fixture, not the news. */}
        <div className="mb-6 hidden lg:block">
          <BreakingTicker />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* On phones the columns dissolve (display: contents) and every card
              gets its own order, so the owner's mobile sequence is: match,
              calendar, scorers, attendance, then the rest, gallery last. On
              desktop the three columns return untouched. */}
          <div className="flex max-lg:contents flex-col gap-6 lg:col-span-4">
            <Standings className="max-lg:order-6" />
            <ScorersCard className="max-lg:order-4" />
            <FormCard className="max-lg:order-7" />
          </div>

          <div className="flex max-lg:contents flex-col gap-6 lg:col-span-5">
            <NextMatchCard className="max-lg:order-2" />
            {/* The cup sits above the gallery (owner, L21): the competition table
                belongs with the fixture, not at the bottom of the right column. */}
            <CupCard className="max-lg:order-8" />
            <GalleryCard className="max-lg:order-9" />
          </div>

          <div className="flex max-lg:contents flex-col gap-6 lg:col-span-3">
            <FixturesCard className="max-lg:order-3" />
            <AttendanceCard className="max-lg:order-5" />
          </div>
        </div>
      </div>
    </section>
  );
}
