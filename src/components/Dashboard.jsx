import Standings from "./Standings.jsx";
import NextMatchCard from "./cards/NextMatchCard.jsx";
import ScorersCard from "./cards/ScorersCard.jsx";
import FormCard from "./cards/FormCard.jsx";
import FixturesCard from "./cards/FixturesCard.jsx";
import CupCard from "./cards/CupCard.jsx";

/**
 * Home grid: the next match in the centre, standings, scorers and form on the
 * left, calendar and cup on the right. Every card reads only synced data.
 */
export default function Dashboard() {
  return (
    <section id="partidos" className="relative pb-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          <div className="order-2 flex flex-col gap-5 lg:order-none lg:col-span-4">
            <Standings className="flex-1" />
            <ScorersCard />
            <FormCard />
          </div>

          <NextMatchCard className="order-1 lg:order-none lg:col-span-5" />

          <div className="order-3 flex flex-col gap-5 lg:order-none lg:col-span-3">
            <FixturesCard />
            <CupCard />
          </div>
        </div>
      </div>
    </section>
  );
}
