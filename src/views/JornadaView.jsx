import { useEffect } from "react";
import { CalendarDays } from "lucide-react";
import {
  clubSide,
  fixtureDateLabel,
  fixtureTimeLabel,
  league,
  matchdayFixtures,
  teamFullName,
  teamName,
} from "../data/competition.js";
import Card from "../components/cards/Card.jsx";
import { Crest } from "../components/cards/Crest.jsx";
import { navigate, routeLink } from "../lib/router.js";

/**
 * `/jornada/<n>` — everything that happened on one matchday (S4, S7).
 *
 * In this league a matchday is three matches, all on the same night at the same
 * time, so a round fits in one panel and is worth a page of its own: a rival can
 * be sent the link and read the whole night, not only their own result.
 *
 * A round is chosen in two ways, because both are things people actually share:
 * the path segment (`/jornada/7`, the one that goes in the group) and the query
 * (`?jornada=7`, which is what a plain link or a bookmark tends to look like).
 * The path wins when both are present.
 */

/* The rounds the source publishes, in order. Nothing is invented: a round exists
   because it has at least one fixture in the synced calendar. */
const ROUNDS = [...new Set(league.fixtures.map((fixture) => fixture.matchday))].sort(
  (a, b) => a - b,
);

/* A round that is already being played is the one a reader came to see. */
const PLAYED_ROUNDS = ROUNDS.filter((round) =>
  matchdayFixtures("league", round).some((fixture) => fixture.status === "played"),
);

/** The round to open when the URL does not name one: the last played, else the first. */
const defaultRound = () => PLAYED_ROUNDS.at(-1) ?? ROUNDS[0] ?? null;

/** A round number from whatever the URL carried, or null when it is not one. */
const asRound = (value) => {
  const number = Number(String(value ?? "").trim());
  return Number.isInteger(number) && number > 0 ? number : null;
};

const PILL =
  "block min-w-8 rounded-full px-2.5 py-1 text-center text-row font-bold tabular-nums transition-colors";
const PILL_ACTIVE = "bg-acf-red text-white";
const PILL_IDLE =
  "border border-acf-line text-acf-snow/60 hover:border-white/25 hover:bg-white/[0.06] hover:text-white";

/**
 * One club of the round, as a link to its page (S7).
 *
 * The home club is drawn right-aligned with its crest on the inside, so the two
 * badges flank whatever sits between them — the result, or the pitch — and the
 * two names sit at the outer ends of the line. That is the way a fixture line is
 * read everywhere else on the site.
 */
function TeamLink({ slug, side }) {
  return (
    <a
      {...routeLink(`/equipo/${slug}`)}
      title={teamFullName(slug)}
      className={`flex min-w-0 items-center gap-2 rounded-tile py-1 text-acf-snow/85 transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acf-red ${
        side === "home" ? "flex-row-reverse justify-start text-right" : "justify-start"
      }`}
    >
      <Crest slug={slug} size="sm" />
      <span className="min-w-0 truncate text-row font-bold uppercase tracking-[0.04em]">
        {teamName(slug)}
      </span>
    </a>
  );
}

/**
 * One match: the two clubs and, in the middle, the result when the night is
 * over or the pitch when it is not. The field is what tells a player which of
 * the three annexes they are on; on these nights the time tells nobody anything,
 * because all three kick off at 22:30.
 */
function MatchRow({ fixture }) {
  const result = fixture.status === "played" && fixture.score ? fixture.score : null;
  const ours = clubSide(fixture) !== null;
  const field = (fixture.field ?? "Campo por confirmar").replace("Camp ", "");

  return (
    <li
      className={`grid grid-cols-[1fr_auto_1fr] items-center gap-x-3 px-4 py-4 sm:px-6 ${
        ours ? "bg-acf-red/[0.08]" : ""
      }`}
    >
      <TeamLink slug={fixture.home.slug} side="home" />

      {result ? (
        <span className="whitespace-nowrap font-display text-xl font-medium leading-none tabular-nums text-white">
          <span className="sr-only">Resultado: </span>
          {result.home}
          <span className="mx-1 text-acf-dim">–</span>
          {result.away}
        </span>
      ) : (
        <span className="whitespace-nowrap text-[0.5625rem] font-semibold uppercase tracking-[0.1em] text-acf-dim">
          <span className="sr-only">Campo: </span>
          {field}
        </span>
      )}

      <TeamLink slug={fixture.away.slug} side="away" />
    </li>
  );
}

export default function JornadaView({ matchday: fromPath }) {
  const fromQuery = new URLSearchParams(window.location.search).get("jornada");
  const wanted = asRound(fromPath) ?? asRound(fromQuery);
  const round = ROUNDS.includes(wanted) ? wanted : defaultRound();
  const matches = round === null ? [] : matchdayFixtures("league", round);
  const first = matches[0] ?? null;

  /*
   * A pasted round that this season does not have lands on the round that does,
   * and the address is corrected with it: a link that shows a different round
   * from the one it names is worse than a corrected link.
   */
  useEffect(() => {
    if (fromPath != null && round !== null && asRound(fromPath) !== round) {
      navigate(`/jornada/${round}`, { replace: true });
    }
  }, [fromPath, round]);

  const head = first
    ? `${fixtureDateLabel(first)} · ${fixtureTimeLabel(first)}`
    : "Sin fecha publicada";

  return (
    <section className="relative pb-16 pt-28">
      <div className="wrap">
        <header className="max-w-2xl">
          <p className="text-micro font-semibold uppercase tracking-[0.3em] text-acf-red-soft">
            {league.name}
          </p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Jornada
          </h1>
          <p className="mt-3 text-row leading-relaxed text-acf-snow/70">
            Tres partidos, una noche, la misma hora. Aquí está todo lo que pasó.
          </p>
        </header>

        {round === null ? (
          <Card
            title="Sin jornadas"
            hint="La fuente oficial no publica partidos todavía"
            icon={CalendarDays}
            className="mt-8"
          >
            <p className="px-6 pb-5 text-row text-acf-grey">
              Cuando el calendario oficial tenga partidos, aparecerán aquí.
            </p>
          </Card>
        ) : (
          <Card
            title={`Jornada ${round}`}
            hint={`${head} · ${matches.length} partidos`}
            icon={CalendarDays}
            href={league.sources.calendar}
            linkLabel="Abrir el calendario oficial de la liga en CEGARRAF"
            className="mt-8"
            bodyClassName="flex flex-col"
          >
            <ul className="divide-y divide-acf-line-soft border-t border-acf-line-soft">
              {matches.map((fixture) => (
                <MatchRow
                  key={`${fixture.home.slug}-${fixture.away.slug}`}
                  fixture={fixture}
                />
              ))}
            </ul>

            {/* The way to another round, in the panel that shows this one: the
                reader moves between rounds without leaving the table. */}
            <div className="mt-auto border-t border-acf-line-soft px-4 py-4 sm:px-6">
              <p className="text-micro font-semibold uppercase tracking-[0.2em] text-acf-dim">
                Otra jornada
              </p>
              <nav aria-label="Elegir jornada" className="mt-2.5 flex flex-wrap gap-1.5">
                {ROUNDS.map((option) => {
                  const active = option === round;
                  return (
                    <a
                      key={option}
                      {...routeLink(`/jornada/${option}`)}
                      aria-current={active ? "page" : undefined}
                      aria-label={`Jornada ${option}`}
                      className={`${PILL} ${active ? PILL_ACTIVE : PILL_IDLE}`}
                    >
                      {option}
                    </a>
                  );
                })}
              </nav>
            </div>
          </Card>
        )}
      </div>
    </section>
  );
}
