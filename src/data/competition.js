/**
 * Selectors over the synced competition data (src/data/competition.json).
 *
 * The JSON is produced by `node scripts/sync-competition.mjs` from the official
 * CEGARRAF pages. Nothing here invents a value: when the source does not
 * publish something (a crest, a played match), the selector returns null and the
 * caller decides how to show the gap.
 */
import competition from "./competition.json";

export const CLUB_SLUG = competition.club.slug;
export const club = competition.club;
export const generatedAt = competition.generatedAt;

export const competitions = competition.competitions;
export const findCompetition = (key) => competitions.find((item) => item.key === key) ?? null;
export const league = findCompetition("league");
export const cup = findCompetition("cup");

export const teamName = (slug) => competition.teams[slug]?.name ?? slug;
export const teamCrest = (slug) => competition.teams[slug]?.crest ?? null;

/** Which side of the fixture the club plays, or null when it is not involved. */
export function clubSide(fixture) {
  if (fixture.home.slug === CLUB_SLUG) return "home";
  if (fixture.away.slug === CLUB_SLUG) return "away";
  return null;
}

export const opponentOf = (fixture) =>
  clubSide(fixture) === "home" ? fixture.away : fixture.home;

const kickoff = (fixture) => `${fixture.date}T${fixture.time ?? "00:00"}`;

const withCompetition = (competition, fixture) => ({
  ...fixture,
  competitionKey: competition.key,
  competitionName: competition.name,
  competitionSource: competition.sources.calendar,
});

const clubFixturesOf = (competition) =>
  competition.fixtures.filter((fixture) => clubSide(fixture) !== null);

/** The next fixture of the club across every competition, by kickoff. */
export function nextFixture() {
  const candidates = [];
  for (const item of competitions) {
    for (const fixture of clubFixturesOf(item)) {
      if (fixture.status === "scheduled") candidates.push(withCompetition(item, fixture));
    }
  }
  candidates.sort((a, b) => kickoff(a).localeCompare(kickoff(b)));
  return candidates[0] ?? null;
}

/** The most recent played fixture of the club across every competition. */
export function lastFixture() {
  const candidates = [];
  for (const item of competitions) {
    for (const fixture of clubFixturesOf(item)) {
      if (fixture.status === "played") candidates.push(withCompetition(item, fixture));
    }
  }
  candidates.sort((a, b) => kickoff(b).localeCompare(kickoff(a)));
  return candidates[0] ?? null;
}

/** The row of the club in a competition table. */
export const clubRow = (competition) =>
  competition.table.find((row) => row.slug === CLUB_SLUG) ?? null;

/** The team directly above the club in the table: the realistic next target. */
export function nextTargetRow(competition) {
  const own = clubRow(competition);
  if (!own || own.rank === null || own.rank <= 1) return null;
  return competition.table.find((row) => row.rank === own.rank - 1) ?? null;
}

const dateFormatter = new Intl.DateTimeFormat("es-ES", {
  weekday: "short",
  day: "numeric",
  month: "short",
});

/** "jue, 26 nov" — the format the site already used, now fed by real dates. */
export function fixtureDateLabel(fixture) {
  if (!fixture.date) return "Fecha por confirmar";
  const date = new Date(`${fixture.date}T${fixture.time ?? "00:00"}:00`);
  return Number.isNaN(date.getTime()) ? fixture.date : dateFormatter.format(date);
}

export const fixtureTimeLabel = (fixture) => fixture.time ?? "—";

export const fixtureKickoffIso = (fixture) =>
  fixture.date ? `${fixture.date}T${fixture.time ?? "00:00"}:00` : null;

export const matchdayLabel = (fixture) =>
  `Jornada ${fixture.matchday} · ${fixture.competitionName}`;

export const scoreLabel = (fixture) =>
  fixture.score ? `${fixture.score.home} - ${fixture.score.away}` : null;

/** True when the club won, drew or lost the given played fixture. */
export function resultOf(fixture) {
  if (!fixture.score) return null;
  const side = clubSide(fixture);
  if (!side) return null;
  const own = fixture.score[side];
  const rival = fixture.score[side === "home" ? "away" : "home"];
  if (own > rival) return "win";
  if (own < rival) return "loss";
  return "draw";
}
