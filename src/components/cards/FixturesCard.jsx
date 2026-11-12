import { CalendarDays } from "lucide-react";
import {
  CLUB_SLUG,
  fixtureDateLabel,
  fixtureTimeLabel,
  nextFixtures,
  teamName,
} from "../../data/competition";
import Card from "./Card.jsx";
import { Crest } from "./Crest.jsx";

const COMPETITION_TAG = { league: "Liga", cup: "Copa" };

function FixtureSlide({ fixture }) {
  return (
    <li className="min-w-[11.5rem] snap-start border border-acf-line bg-acf-dark/60 p-3 clip-edge">
      <p className="font-display text-lg leading-none tracking-wide text-acf-red">
        {fixtureDateLabel(fixture)}
      </p>
      <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.12em] text-acf-grey">
        {fixtureTimeLabel(fixture)} · J{fixture.matchday} ·{" "}
        {COMPETITION_TAG[fixture.competitionKey] ?? fixture.competitionName}
      </p>

      <div className="mt-2.5 space-y-1.5">
        {[fixture.home, fixture.away].map((team) => (
          <div key={team.slug} className="flex items-center gap-1.5">
            <Crest slug={team.slug} size="sm" />
            <span
              title={teamName(team.slug)}
              className={`truncate text-[10px] font-bold uppercase ${
                team.slug === CLUB_SLUG ? "text-acf-red" : "text-acf-snow/70"
              }`}
            >
              {teamName(team.slug)}
            </span>
          </div>
        ))}
      </div>

      <p className="mt-2 truncate text-[9px] uppercase tracking-[0.12em] text-acf-grey">
        {fixture.field ?? "Campo por confirmar"}
      </p>
    </li>
  );
}

/** Horizontal slider of the club's following fixtures with their real dates. */
export default function FixturesCard({ className = "" }) {
  const fixtures = nextFixtures(6);

  return (
    <Card
      title="Calendario"
      hint={fixtures.length ? "Siguientes partidos · desliza" : "Sin partidos programados"}
      icon={CalendarDays}
      className={className}
      bodyClassName="flex"
    >
      {fixtures.length ? (
        <ul className="flex w-full snap-x snap-mandatory gap-3 overflow-x-auto px-4 py-4 squad-scrollbar">
          {fixtures.map((fixture) => (
            <FixtureSlide
              key={`${fixture.competitionKey}-${fixture.matchday}-${fixture.date}`}
              fixture={fixture}
            />
          ))}
        </ul>
      ) : (
        <p className="p-5 text-sm text-acf-grey">
          La fuente oficial no publica más partidos programados.
        </p>
      )}
    </Card>
  );
}
