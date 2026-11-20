#!/usr/bin/env node
/**
 * Exports the owner's night-pitch photograph for the next-match card.
 *
 * The card paints this photo under its own veil, so it only ever needs two
 * widths and never the full frame: `object-cover` decides the crop at run time
 * against the real card box, which is tall and narrow on a phone and short and
 * wide on a desktop. Cropping here as well would only throw away the part of
 * the frame another viewport needs.
 *
 * Source lives in `design/sources/` rather than `public/`, because the deploy
 * ships everything under `public/` and the untouched 2.3 MB photograph is
 * source material, not a served asset.
 *
 * Run: npm run assets:backdrop
 */
import { mkdir, stat } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const SOURCE = "design/sources/futbol-nocturno.png";
const OUT_DIR = "public/assets/backgrounds";
const BASE = "pitch-nocturno";
const WIDTHS = [900, 1536];
const QUALITY = 72;

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const meta = await sharp(SOURCE).metadata();
  const writes = [];

  for (const width of WIDTHS) {
    const target = path.join(OUT_DIR, `${BASE}-${width}.webp`);
    const info = await sharp(SOURCE)
      // Never upscale: a 1536 export of a 1024-wide original is just a bigger file.
      .resize({ width: Math.min(width, meta.width), withoutEnlargement: true })
      .webp({ quality: QUALITY })
      .toFile(target);
    const bytes = (await stat(target)).size;
    writes.push({ target, info, bytes });
  }

  console.log(`source ${SOURCE} — ${meta.width}x${meta.height}`);
  for (const { target, info, bytes } of writes) {
    console.log(
      `${target} — ${info.width}x${info.height}, ${(bytes / 1024).toFixed(0)} kB`
    );
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
