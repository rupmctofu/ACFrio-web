/**
 * Selectors over the club's own record (src/data/club-record.json).
 *
 * This file holds data the official competition source does not publish:
 * goalscorers, cards and who turned up to each match. It is maintained by hand
 * from what the club reports, so nothing here is derived or guessed; what the
 * club has not confirmed yet is reported as pending instead of being invented.
 */
import record from "./club-record.json";
import teamData from "./teamData.json";
import { competitions, clubSide, league, clubRow } from "./competition";

export const season = record.season;
export const updatedAt = record.updatedAt;
export const dataSource = record.source;

const normalize = (value) => value.trim().toLowerCase();

/** The attendance entries the club has filled in by hand, possibly none. */
const attendance = Array.isArray(record.attendance) ? record.attendance : [];

/** Goalscorers, highest first. */
export function scorers() {
  return [...record.scorers].sort((a, b) => b.goals - a.goals || a.player.localeCompare(b.player));
}

export const totalRecordedGoals = () =>
  record.scorers.reduce((total, scorer) => total + scorer.goals, 0);

/**
 * Goals the club has recorded for one competition only.
 * The scorer list is a season total — a player's cup goals count there — while
 * the official table counts league goals exclusively. Anything comparing the
 * two has to ask for the league figure, or it is subtracting apples from pears.
 */
export const recordedGoalsIn = (competitionKey) =>
  record.scorers.reduce((total, scorer) => total + (scorer[competitionKey] ?? 0), 0);

/** Goals the team has scored in the league but that have no scorer recorded yet.
 * The team total comes from the official table, so the gap is arithmetic, not a guess.
 */
export function unassignedGoals() {
  const own = clubRow(league);
  if (!own) return 0;
  return Math.max(0, own.goalsFor - recordedGoalsIn("league"));
}

/** Cards reported by the club, highest first. */
export function cards() {
  return [...record.cards].sort(
    (a, b) => (b.yellow + b.red) - (a.yellow + a.red) || a.player.localeCompare(b.player),
  );
}

export const isComplete = () => unassignedGoals() === 0;

/**
 * The players the club reports for one matchday of one competition. An empty
 * list means the club has not named anybody yet: no placeholder is returned.
 */
export function attendanceFor(competitionKey, matchday) {
  const entry = attendance.find(
    (item) => item.competition === competitionKey && item.matchday === matchday,
  );
  return (entry?.players ?? []).filter((name) => Boolean(name) && normalize(name) !== "");
}

/**
 * Every fixture the club has actually played, across competitions, oldest
 * first, each one carrying its own `date` (the source's ISO day).
 *
 * One place for the filter, so the club total and each player's own total are
 * counted off the same list and can never disagree about how many matches
 * there were. The order matters: a player's denominator is a slice of this
 * list from his debut onwards, which is only a prefix while the matches are in
 * order.
 */
export function playedFixtures() {
  const played = [];
  for (const competition of competitions) {
    for (const fixture of competition.fixtures) {
      if (fixture.status === "played" && clubSide(fixture) !== null) played.push(fixture);
    }
  }
  return played.sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * How many matches the club has actually played, across competitions.
 * The club-wide denominator, still the right figure for anything that asks
 * about the team rather than about one player.
 */
export const playedMatches = () => playedFixtures().length;

/** How many distinct players have turned up to at least one match. */
export function totalAppearances() {
  const players = new Set();
  for (const entry of attendance) {
    for (const name of entry.players ?? []) {
      const key = normalize(name ?? "");
      if (key) players.add(key);
    }
  }
  return players.size;
}

/** True once the club has named at least one player for at least one match. */
export const hasAnyAttendance = () => totalAppearances() > 0;

/**
 * The portrait of a player named in the club record, matched against the squad
 * by name. Returns null when the club has not listed that player, so callers
 * show initials instead of a photo that may belong to someone else.
 */
export function playerPhoto(name) {
  const match = teamData.squad.find((player) => normalize(player.name) === normalize(name));
  if (!match) return null;
  // The small faces render at 28-36px, so the downscaled avatar copy is enough;
  // the card art (the same cutout at full size) stays for the squad slider.
  return match.photo?.replace("/players/", "/players/avatar/") ?? null;
}

/**
 * The date a player joined the squad, as the same ISO day the fixtures use, or
 * null when he has been here since the first matchday. Only a player the club
 * says started late carries a `joinedAt`; everybody else keeps the club-wide
 * denominator, unchanged.
 */
export function playerJoinedAt(name) {
  const match = teamData.squad.find((player) => normalize(player.name) === normalize(name));
  return match?.joinedAt ?? null;
}

/**
 * The attendance ranking, as a pure function of three inputs so the rule can be
 * read (and tested) without the club's real record:
 *   matchdays  the club's hand-kept entries — names per match, no dates of their own
 *   fixtures   the played fixtures, oldest first, each with an ISO `date`
 *   joinedAt   the ISO day a player joined, or null when he was here from the start
 *
 * A player is counted over `of` matches: the whole club total when he has no
 * join date, and the matches played since he joined otherwise. That is the
 * owner's rule (S12): someone who arrived late is a hundred per cent of the
 * matches he could have played, not a fraction of a season he was not in.
 */
export function attendanceRows({ matchdays = [], fixtures = [], joinedAt = () => null } = {}) {
  const counts = new Map();
  for (const match of matchdays) {
    for (const name of match.players ?? []) {
      counts.set(name, (counts.get(name) ?? 0) + 1);
    }
  }

  return [...counts.entries()]
    .map(([name, count]) => {
      const since = joinedAt(name);
      const of = since
        ? fixtures.filter((fixture) => fixture.date >= since).length
        : fixtures.length;
      /*
       * An appearance listed before the player's own debut would be a
       * bookkeeping mistake, and a bar wider than its track is worse than a
       * capped one: the count still prints, but the percentage never overflows.
       */
      const pct = of > 0 ? Math.min(100, Math.round((count / of) * 100)) : 0;
      return { name, count, of, pct };
    })
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

/**
 * Attendance per player, most attended first: a 0-100 bar where the denominator
 * is the matches that player could have played, so the bar is arithmetic, never
 * a guess. Players the club has not reported yet simply do not appear until a
 * name arrives.
 */
export function perPlayerAttendance() {
  return attendanceRows({
    matchdays: attendance,
    fixtures: playedFixtures(),
    joinedAt: playerJoinedAt,
  }).map((row) => ({ ...row, photo: playerPhoto(row.name) }));
}
