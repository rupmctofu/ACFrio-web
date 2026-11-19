/**
 * The club code: `ACF-<NOMBRE>-<DORSAL>`, e.g. `ACF-RUP-8`.
 *
 * What this is: a deliberate way to say who you are. Typing a code you were
 * handed beats tapping a face you might tap by accident, and it is short enough
 * to be sent through the group and remembered.
 *
 * What this is NOT: a secret. Every code is derivable from the squad list the
 * page already publishes — the name and the number are on screen — so it stops
 * a mistap, not an impersonation. Making it real would need the server to verify
 * it and to allow one claim per player, and that is a different piece of work.
 * The owner chose this shape knowingly.
 *
 * A player with no shirt number (Genís) uses the squad id, which is also unique.
 */
export const CODE_PREFIX = "ACF";

/** Uppercase, no accents, nothing that is not a letter or a digit. */
export const normalise = (value) =>
  String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");

/** The number a code carries: the shirt, or the squad id when there is none. */
export const codeNumber = (player) => String(player?.number ?? player?.id ?? "");

/** The code for one player, or an empty string if the player is unusable. */
export function codeFor(player) {
  const name = normalise(player?.name);
  const number = codeNumber(player);
  if (!name || !number) return "";
  return `${CODE_PREFIX}-${name}-${number}`;
}

/**
 * Reads what someone typed, in whatever shape: `acf-rup-8`, `ACF RUP 8`,
 * ` Acf-Rúp-8 `. Returns the normalised name and number, or null when the input
 * cannot be a club code at all.
 */
export function parseCode(input) {
  const parts = String(input ?? "")
    .trim()
    .split(/[\s-]+/)
    .filter(Boolean)
    .map(normalise);

  if (parts.length !== 3 || parts[0] !== CODE_PREFIX) return null;
  const [, name, number] = parts;
  if (!name || !/^\d+$/.test(number)) return null;
  return { name, number };
}

/** The player a code belongs to, or null when no one matches. */
export function resolvePlayer(input, squad = []) {
  const parsed = parseCode(input);
  if (!parsed) return null;
  return (
    squad.find(
      (player) => normalise(player.name) === parsed.name && codeNumber(player) === parsed.number,
    ) ?? null
  );
}
