/**
 * Selectors over the club's own record (src/data/club-record.json).
 *
 * This file holds data the official competition source does not publish:
 * goalscorers and cards. It is maintained by hand from what the club reports,
 * so nothing here is derived or guessed; what the club has not confirmed yet is
 * reported as pending instead of being invented.
 */
import record from "./club-record.json";
import { league, clubRow } from "./competition";

export const season = record.season;
export const updatedAt = record.updatedAt;
export const dataSource = record.source;

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
