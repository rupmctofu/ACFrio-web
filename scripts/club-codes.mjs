/**
 * Prints the club code of every player, so the owner can send them through the
 * group. Nothing is written anywhere: the codes are derived from the squad, and
 * the list only exists on screen.
 *
 * Run: npm run codes
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { codeFor } from "../src/lib/club-code.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const squad = JSON.parse(readFileSync(path.join(ROOT, "src/data/teamData.json"), "utf8")).squad;

const rows = squad.map((player) => ({
  name: player.name,
  number: player.number ?? `${player.id} (sin dorsal)`,
  code: codeFor(player),
}));

const width = Math.max(...rows.map((row) => row.name.length));
console.log("Códigos del club\n");
for (const row of rows) {
  console.log(`${row.name.padEnd(width)}  ${String(row.number).padStart(3)}   ${row.code}`);
}
console.log(`\n${rows.length} códigos. Formato: ACF-<nombre>-<dorsal>.`);
