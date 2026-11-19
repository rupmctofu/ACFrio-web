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
 * How many matches the club has actually played, across competitions.
 * One place for the arithmetic: the attendance bar and the per-player
 * percentage both divide by it, so a cup matchday can never count in the
 * numerator and be missing from the denominator.
 */
export const playedMatches = () =>
  competitions.reduce(
    (total, competition) =>
      total +
      competition.fixtures.filter(
        (fixture) => fixture.status === "played" && clubSide(fixture) !== null,
      ).length,
    0,
  );

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
 * Attendance per player, most attended first, as the owner asked: a 0-100 bar
 * where the denominator is the club's played matches from the official table,
 * so the bar is arithmetic, never a guess. Players the club has not reported
 * yet simply do not appear until a name arrives.
 */
export function perPlayerAttendance() {
  const counts = new Map();
  for (const match of record.attendance) {
    for (const name of match.players) {
      counts.set(name, (counts.get(name) ?? 0) + 1);
    }
  }
  /*
   * The denominator is every match the club has played, not the league's own
   * count: once a cup matchday has a team sheet, a cup-only appearance measured
   * against the league total would read as a part-time player.
   */
  const played = playedMatches();
  return [...counts.entries()]
    .map(([name, count]) => ({
      name,
      count,
      pct: played > 0 ? Math.round((count / played) * 100) : 0,
      photo: playerPhoto(name),
    }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}
