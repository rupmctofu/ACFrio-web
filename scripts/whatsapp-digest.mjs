/**
 * Turns a WhatsApp chat export into headline candidates.
 *
 * The club's group is where the voice of the dressing room actually lives, but it
 * is also full of things that must never reach a public page: phone numbers,
 * links, private conversations between people who never agreed to appear on the
 * site. So this script never writes a file and never ships anything: it reads the
 * exports the owner left in `whatsapp/`, drops everything that looks personal or
 * unusable, and prints what is left for the owner to copy by hand. Selection and
 * consent stay with the human; the machine only does the boring part.
 *
 * Run: npm run whatsapp:digest [-- <path>]
 */
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/** Short enough to be a card headline, long enough to say something. */
const MIN_CHARS = 25;
const MAX_CHARS = 140;

/** `[17/11/26, 22:31:05] Ander: texto` and `17/11/26 22:31 - Ander: texto`. */
const LINE_PATTERNS = [
  /^\[?(\d{1,2}\/\d{1,2}\/\d{2,4}),?\s+(\d{1,2}:\d{2})(?::\d{2})?\]?\s*[-–]?\s*([^:]{1,40}):\s*(.*)$/,
  /^([^:]{1,40}):\s*(.*)$/,
];

const PHONE = /(\+?\d[\d\s().-]{7,}\d)/;
const URL = /(https?:\/\/|www\.|\.com\b|\.es\b)/i;
const MEDIA = /(multimedia omitido|imagen omitida|vídeo omitido|audio omitido|sticker omitido|se eliminó este mensaje|<adjunto|GIF omitido)/i;
const SYSTEM = /(los mensajes y las llamadas están cifrados|cifrado de extremo a extremo|cambió el asunto|añadió a|cambió el ícono|creó el grupo|salió del grupo|te unió|los mensajes temporales)/i;
const ONLY_EMOJI = /^[\p{Extended_Pictographic}\p{Emoji_Component}\s]+$/u;

/**
 * WhatsApp writes the clock as `10:49:22 AM`, so the author capture swallows the
 * `AM]` that follows it, and the message body often starts with an invisible
 * left-to-right mark. Both are noise for a headline.
 */
const cleanAuthor = (value) =>
  value
    .replace(/^\[?\s*(?:a\.?m\.?|p\.?m\.?)\]\s*/i, "")
    .replace(/^\]\s*/, "")
    .trim();

const cleanText = (value) => value.replace(/[\u200e\u200f\u202a-\u202e]/g, "").trim();

/** Why a line was rejected, so the owner can audit the filter instead of trusting it. */
function reject(text) {
  const clean = text.trim();
  if (!clean) return "vacía";
  if (MEDIA.test(clean)) return "multimedia";
  if (SYSTEM.test(clean)) return "sistema";
  if (PHONE.test(clean.replace(/\b\d{1,2}:\d{2}\b/g, ""))) return "teléfono";
  if (URL.test(clean)) return "enlace";
  if (ONLY_EMOJI.test(clean)) return "solo emoji";
  if (clean.length < MIN_CHARS) return "demasiado corta";
  if (clean.length > MAX_CHARS) return "demasiado larga";
  return null;
}

/**
 * The shorter a line is inside the usable window the more it reads like a quote
 * and less like a paragraph, which is what the news card wants.
 */
const score = (text) => 1 - Math.abs(text.length - 70) / 140;

async function collect(dir) {
  const entries = (await readdir(dir)).filter((name) => name.endsWith(".txt"));
  const candidates = [];
  const dropped = new Map();

  for (const name of entries) {
    const raw = await readFile(path.join(dir, name), "utf8");
    for (const line of raw.split(/\r?\n/)) {
      if (!line.trim()) continue;
      if (SYSTEM.test(line)) {
        dropped.set("sistema", (dropped.get("sistema") ?? 0) + 1);
        continue;
      }

      const match = LINE_PATTERNS.map((re) => re.exec(line)).find(Boolean);
      const author = match ? cleanAuthor(match[match.length - 2]) : "";
      const text = cleanText(match ? match[match.length - 1] : line);
      const reason = reject(text);
      if (reason) {
        dropped.set(reason, (dropped.get(reason) ?? 0) + 1);
        continue;
      }
      candidates.push({ author, text: text.trim(), file: name });
    }
  }

  candidates.sort((a, b) => score(b.text) - score(a.text));
  return { candidates, dropped, files: entries.length };
}

/*
 * A busy group yields well over a thousand usable lines, which is not a
 * shortlist, it is the chat again. The tool prints the best handful and says how
 * many it left out, so the owner reviews a page instead of an archive.
 */
const LIMIT = Number(process.env.WHATSAPP_LIMIT ?? 40);
const target = process.argv[2] ? path.resolve(process.argv[2]) : path.join(ROOT, "whatsapp");

let result;
try {
  result = await collect(target);
} catch (error) {
  console.error(`No se pudo leer ${target}: ${error.message}`);
  process.exit(1);
}

if (!result.files) {
  console.log(`No hay ficheros .txt en ${target}. Deja ahí la exportación y vuelve a lanzarlo.`);
  process.exit(0);
}

const shown = result.candidates.slice(0, LIMIT);
console.log(
  `${result.files} fichero(s) · ${result.candidates.length} candidatas · mostrando ${shown.length}\n`,
);
console.log("Descarte por motivo:", [...result.dropped].map(([k, v]) => `${k}: ${v}`).join(" · ") || "ninguno");
console.log("\nPega en src/data/news.json las que quieras, con su etiqueta:\n");

for (const item of shown) {
  const json = JSON.stringify({ tag: "Vestuario", text: item.text });
  console.log(`${json}${item.author ? `   ← ${item.author}` : ""}`);
}
