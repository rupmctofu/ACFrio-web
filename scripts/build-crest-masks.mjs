/**
 * One-ink copies of the club crests.
 *
 * The official source publishes each crest as a single 80x80 webp, in colour and
 * with no transparency, and publishes nothing larger and no SVG — the "thumbs"
 * path has no bigger sibling. Tracing those 80px bitmaps would hand back a blob
 * that is no longer the club's mark, so this script does the honest version of
 * "one ink": it keeps every line of the crest and throws away only the paper,
 * turning luminance into an alpha channel. The result is a mask, which the page
 * paints with `currentColor`, so the same file is grey on a quiet card and can
 * be any other tone without a second asset.
 *
 * Run with `node scripts/build-crest-masks.mjs` after a crest sync. It reads
 * `public/assets/badges/*.webp` and writes `public/assets/badges/ink/<slug>.png`.
 */
import { readdir, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BADGES = path.join(ROOT, "public/assets/badges");
const OUT = path.join(BADGES, "ink");

const luminance = (r, g, b) => 0.2126 * r + 0.7152 * g + 0.0722 * b;

/**
 * Whether the crest is drawn on light paper or on a dark field. Two of the nine
 * sit on white and the rest on near-black, so the ink cannot be assumed: the
 * four corners decide, and the case is inverted instead of guessed per file.
 */
async function paperIsLight(input) {
  const { data, info } = await sharp(input)
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const at = (x, y) => {
    const i = (y * info.width + x) * info.channels;
    return luminance(data[i], data[i + 1], data[i + 2]);
  };

  const corners = [
    at(0, 0),
    at(info.width - 1, 0),
    at(0, info.height - 1),
    at(info.width - 1, info.height - 1),
  ];

  return corners.reduce((sum, value) => sum + value, 0) / corners.length > 128;
}

async function maskOf(file) {
  const light = await paperIsLight(file);
  const { data, info } = await sharp(file)
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const pixels = info.width * info.height;
  const out = Buffer.alloc(pixels * 4);

  for (let i = 0; i < pixels; i += 1) {
    const value = luminance(data[i * info.channels], data[i * info.channels + 1], data[i * info.channels + 2]);
    // On light paper the ink is what is dark; on a dark field it is what is bright.
    // A floor of 24 cuts the haze the paper leaves behind, then the range is
    // stretched back to 255 so the crest keeps its full weight.
    const raw = light ? 255 - value : value;
    const alpha = Math.max(0, Math.min(255, Math.round(((raw - 24) * 255) / 231)));
    out[i * 4] = 255;
    out[i * 4 + 1] = 255;
    out[i * 4 + 2] = 255;
    out[i * 4 + 3] = alpha;
  }

  return sharp(out, { raw: { width: info.width, height: info.height, channels: 4 } })
    .png({ compressionLevel: 9 })
    .toBuffer();
}

await mkdir(OUT, { recursive: true });

const files = (await readdir(BADGES)).filter(
  // The club's own mark is real vector artwork (`logo-ACF.svg`) and is masked
  // straight from the SVG at runtime, so it has no bitmap ink to derive here.
  (name) => name.endsWith(".webp") && name !== "ac-frio.webp",
);
const failures = [];

for (const name of files) {
  const slug = name.replace(/\.webp$/, "");
  try {
    const png = await maskOf(path.join(BADGES, name));
    await writeFile(path.join(OUT, `${slug}.png`), png);
  } catch (error) {
    failures.push(`${slug}: ${error.message}`);
  }
}

console.log(`ink masks: ${files.length - failures.length}/${files.length} written to public/assets/badges/ink`);
for (const failure of failures) console.error(failure);
