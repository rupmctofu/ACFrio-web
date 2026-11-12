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

const INITIAL_STOPWORDS = new Set(["FC", "CF", "CD", "UD", "SC", "C.F.", "F.C."]);

/**
 * Initials for a club the source publishes no crest for. Real letters from the
 * real name, never a drawn placeholder badge.
 */
export function teamInitials(slug) {
  const name = teamName(slug);
  const letters = name
    .replace(/[^A-Za-zÀ-ÿ0-9 ]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .filter((word) => !INITIAL_STOPWORDS.has(word.toUpperCase()))
    .map((word) => word[0].toUpperCase())
    .join("")
    .slice(0, 3);
  return letters || name.slice(0, 2).toUpperCase();
}

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

const byKickoffAsc = (a, b) => kickoff(a).localeCompare(kickoff(b));
const byKickoffDesc = (a, b) => kickoff(b).localeCompare(kickoff(a));

/** Every club fixture of the given status, across every competition. */
function clubFixturesWithStatus(status) {
  const collected = [];
  for (const item of competitions) {
    for (const fixture of clubFixturesOf(item)) {
      if (fixture.status === status) collected.push(withCompetition(item, fixture));
    }
  }
  return collected;
}

/** The next fixture of the club across every competition, by kickoff. */
export function nextFixture() {
  return clubFixturesWithStatus("scheduled").sort(byKickoffAsc)[0] ?? null;
}

/** The most recent played fixture of the club across every competition. */
export function lastFixture() {
  return clubFixturesWithStatus("played").sort(byKickoffDesc)[0] ?? null;
}

/** The following fixtures of the club, soonest first, ready for a slider. */
export function nextFixtures(limit = 6) {
  const all = clubFixturesWithStatus("scheduled").sort(byKickoffAsc);
  return limit == null ? all : all.slice(0, limit);
}

/** The last played fixtures of the club, most recent first, for the form card. */
export function recentResults(limit = 3) {
  const all = clubFixturesWithStatus("played").sort(byKickoffDesc);
  return limit == null ? all : all.slice(0, limit);
}

/**
 * A competition table plus the honest count of what the source has published.
 * `hasResults` is false until a matchday is played, because a table of zeros is
 * the source's initial order, not a ranking worth presenting as one.
 */
export function tableSummary(competition) {
  if (!competition) {
    return { competition: null, rows: [], playedMatches: 0, matchCount: 0, hasResults: false };
  }
  const playedMatches = competition.fixtures.filter(
    (fixture) => fixture.status === "played"
  ).length;
  return {
    competition,
    rows: competition.table,
    playedMatches,
    matchCount: competition.fixtures.length,
    hasResults: playedMatches > 0,
  };
}

export const leagueTable = () => tableSummary(league);
export const cupTable = () => tableSummary(cup);

/** "Local" or "Visitante" from the club's point of view, or null. */
export function homeAwayLabel(fixture) {
  const side = clubSide(fixture);
  if (side === "home") return "Local";
  if (side === "away") return "Visitante";
  return null;
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

/** The club's own goals and the rival's in a played fixture, or null. */
export function clubScore(fixture) {
  if (!fixture?.score) return null;
  const side = clubSide(fixture);
  if (!side) return null;
  return { own: fixture.score[side], rival: fixture.score[side === "home" ? "away" : "home"] };
}

/** True when the club won, drew or lost the given played fixture. */
export function resultOf(fixture) {
  const score = clubScore(fixture);
  if (!score) return null;
  if (score.own > score.rival) return "win";
  if (score.own < score.rival) return "loss";
  return "draw";
}
