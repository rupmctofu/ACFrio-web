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
import { league, clubRow } from "./competition";

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
 * Goals the team has scored in the league but that have no scorer recorded yet.
 * The team total comes from the official table, so the gap is arithmetic, not a guess.
 */
export function unassignedGoals() {
  const own = clubRow(league);
  if (!own) return 0;
  return Math.max(0, own.goalsFor - totalRecordedGoals());
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
