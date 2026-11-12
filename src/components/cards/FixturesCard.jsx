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
    <li className="min-w-[11.5rem] snap-start rounded-tile border border-acf-line-soft bg-acf-panel-light/60 p-3">
      <p className="text-[11px] font-extrabold uppercase leading-none tracking-[0.1em] text-white">
        {fixtureDateLabel(fixture)}
      </p>
      <p className="mt-1.5 text-[8px] font-semibold uppercase tracking-[0.16em] text-acf-dim">
        {fixtureTimeLabel(fixture)} · J{fixture.matchday} ·{" "}
        {COMPETITION_TAG[fixture.competitionKey] ?? fixture.competitionName}
      </p>

      <div className="mt-3 space-y-1.5">
        {[fixture.home, fixture.away].map((team) => (
          <div key={team.slug} className="flex items-center gap-1.5">
            <Crest slug={team.slug} size="sm" />
            <span
              title={teamName(team.slug)}
              className={`truncate text-[10px] font-bold uppercase tracking-[0.04em] ${
                team.slug === CLUB_SLUG ? "text-acf-red" : "text-acf-snow/60"
              }`}
            >
              {teamName(team.slug)}
            </span>
          </div>
        ))}
      </div>

      <p className="mt-2.5 truncate text-[8px] font-semibold uppercase tracking-[0.16em] text-acf-dim">
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
        <ul className="flex w-full snap-x snap-mandatory gap-2.5 overflow-x-auto px-5 pb-5 pt-1 squad-scrollbar">
          {fixtures.map((fixture) => (
            <FixtureSlide
              key={`${fixture.competitionKey}-${fixture.matchday}-${fixture.date}`}
              fixture={fixture}
            />
          ))}
        </ul>
      ) : (
        <p className="px-5 py-4 text-sm text-acf-grey">
          La fuente oficial no publica más partidos programados.
        </p>
      )}
    </Card>
  );
}
