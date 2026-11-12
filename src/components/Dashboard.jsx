import Standings from "./Standings.jsx";
import NextMatchCard from "./cards/NextMatchCard.jsx";
import NewsCard from "./cards/NewsCard.jsx";
import ScorersCard from "./cards/ScorersCard.jsx";
import FormCard from "./cards/FormCard.jsx";
import FixturesCard from "./cards/FixturesCard.jsx";
import CupCard from "./cards/CupCard.jsx";
import AttendanceCard from "./cards/AttendanceCard.jsx";

/**
 * Home grid: the next match opens the centre column with the vestuario satire
 * feed below it; standings, scorers and form sit on the left, calendar, cup and
 * attendance on the right. Every card reads only synced or club-reported data.
 *
 * The card hierarchy is deliberate: the next match owns the hero surface and the
 * scorers card the accent surface (see `.surface-hero` / `.surface-accent` in
 * index.css); everything else stays on the base panel. The club identity lives
 * in the fixed header, so the grid starts with the fixture itself.
 */
export default function Dashboard() {
  return (
    <section id="partidos" className="relative pb-16 pt-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="order-2 flex flex-col gap-6 lg:order-none lg:col-span-4">
            <Standings className="flex-1" />
            <ScorersCard />
            <FormCard />
          </div>

          <div className="order-1 flex flex-col gap-6 lg:order-none lg:col-span-5">
            <NextMatchCard />
            <NewsCard className="flex-1" />
          </div>

          <div className="order-3 flex flex-col gap-6 lg:order-none lg:col-span-3">
            <FixturesCard />
            <CupCard />
            <AttendanceCard />
          </div>
        </div>
      </div>
    </section>
  );
}
