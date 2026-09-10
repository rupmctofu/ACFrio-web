import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { createCanvas, GlobalFonts, loadImage } from "@napi-rs/canvas";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, "..");
const PUBLIC = join(ROOT, "public");

GlobalFonts.registerFromPath("C:/Windows/Fonts/arialbd.ttf", "ArialBold");
GlobalFonts.registerFromPath("C:/Windows/Fonts/arial.ttf", "Arial");

const SVG_LOGO_PATH = join(PUBLIC, "assets", "logo-acf.png");
const svgLogo = readFileSync(SVG_LOGO_PATH);

const RED = "#E61C24";
const RED_DARK = "#B0141B";
const DARK = "#0D0D0D";
const PANEL = "#161616";
const WHITE = "#FFFFFF";
const GREY = "#8A8A8A";

function ensureDir(dir) {
  mkdirSync(dir, { recursive: true });
}

async function generateIcon(size, outputPath) {
  const resized = await sharp(svgLogo)
    .resize(size, size, { fit: "contain", background: DARK })
    .png()
    .toBuffer();
  writeFileSync(outputPath, resized);
  console.log(`  ✓ ${outputPath}`);
}

async function generateFaviconIco() {
  const sizes = [16, 32];
  const buffers = await Promise.all(
    sizes.map((s) =>
      sharp(svgLogo)
        .resize(s, s, { fit: "contain", background: DARK })
        .png()
        .toBuffer()
    )
  );
  const icoBuffer = await sharp(buffers[1])
    .png()
    .toBuffer();
  writeFileSync(join(PUBLIC, "favicon.ico"), icoBuffer);
  console.log(`  ✓ ${join(PUBLIC, "favicon.ico")}`);
}

async function drawShieldOnCanvas(ctx, x, y, shieldSize) {
  const shieldPng = await sharp(svgLogo)
    .resize(Math.round(shieldSize), Math.round(shieldSize), {
      fit: "contain",
      background: "transparent",
    })
    .png()
    .toBuffer();
  const img = await loadImage(shieldPng);
  ctx.drawImage(img, Math.round(x), Math.round(y), Math.round(shieldSize), Math.round(shieldSize));
}

function drawGradientBg(ctx, w, h) {
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, DARK);
  grad.addColorStop(0.5, "#111111");
  grad.addColorStop(1, DARK);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
}

function drawGrainTexture(ctx, w, h) {
  for (let i = 0; i < 3000; i++) {
    const x = Math.random() * w;
    const y = Math.random() * h;
    const alpha = Math.random() * 0.06;
    ctx.fillStyle = `rgba(255,255,255,${alpha})`;
    ctx.fillRect(x, y, 1, 1);
  }
}

function drawRedGlow(ctx, cx, cy, radius) {
  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
  grad.addColorStop(0, "rgba(230,28,36,0.2)");
  grad.addColorStop(0.6, "rgba(230,28,36,0.05)");
  grad.addColorStop(1, "rgba(230,28,36,0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
}

function drawRedLine(ctx, y, w) {
  const grad = ctx.createLinearGradient(0, y, w, y);
  grad.addColorStop(0, "rgba(230,28,36,0)");
  grad.addColorStop(0.2, RED);
  grad.addColorStop(0.5, RED);
  grad.addColorStop(0.8, RED);
  grad.addColorStop(1, "rgba(230,28,36,0)");
  ctx.strokeStyle = grad;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, y);
  ctx.lineTo(w, y);
  ctx.stroke();
}

async function generateOGImage() {
  const W = 1200;
  const H = 630;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");

  drawGradientBg(ctx, W, H);
  drawGrainTexture(ctx, W, H);
  drawRedGlow(ctx, W / 2, H * 0.35, 400);
  drawRedLine(ctx, H - 40, W);

  const shieldSize = 220;
  await drawShieldOnCanvas(ctx, W / 2 - shieldSize / 2, 60, shieldSize);

  ctx.fillStyle = WHITE;
  ctx.font = "bold 72px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("AC FRÍO", W / 2, 330);

  ctx.fillStyle = GREY;
  ctx.font = "500 28px sans-serif";
  ctx.fillText("Sangre Fría · Juego al Rojo", W / 2, 390);

  ctx.fillStyle = RED;
  ctx.font = "bold 22px sans-serif";
  ctx.fillText("Equipo de Fútbol 7 · Fundado 2026 · Madrid", W / 2, 450);

  ctx.fillStyle = GREY;
  ctx.font = "400 18px sans-serif";
  ctx.fillText("acfrio-web.vercel.app", W / 2, H - 60);

  const buf = canvas.toBuffer("image/png");
  const out = join(PUBLIC, "og-image.png");
  writeFileSync(out, buf);
  console.log(`  ✓ ${out}`);
}

async function generateLargeInstagram() {
  const S = 1080;
  const canvas = createCanvas(S, S);
  const ctx = canvas.getContext("2d");

  drawGradientBg(ctx, S, S);
  drawGrainTexture(ctx, S, S);
  drawRedGlow(ctx, S / 2, S * 0.38, 380);
  drawRedLine(ctx, S - 50, S);
  drawRedLine(ctx, 50, S);

  const shieldSize = 320;
  await drawShieldOnCanvas(ctx, S / 2 - shieldSize / 2, 100, shieldSize);

  ctx.fillStyle = WHITE;
  ctx.font = "bold 96px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("AC FRÍO", S / 2, 510);

  ctx.fillStyle = GREY;
  ctx.font = "500 36px sans-serif";
  ctx.fillText("Sangre Fría", S / 2, 580);

  ctx.fillStyle = RED;
  ctx.font = "bold 28px sans-serif";
  ctx.fillText("0°C ES TEMPERATURA AMBIENTE", S / 2, 960);

  const buf = canvas.toBuffer("image/png");
  const out = join(PUBLIC, "assets", "large-images", "large-instagram.png");
  writeFileSync(out, buf);
  console.log(`  ✓ ${out}`);
}

async function generateLargeFacebook() {
  const W = 1200;
  const H = 630;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");

  drawGradientBg(ctx, W, H);
  drawGrainTexture(ctx, W, H);
  drawRedGlow(ctx, W * 0.3, H * 0.4, 350);
  drawRedLine(ctx, H - 30, W);

  const shieldSize = 260;
  await drawShieldOnCanvas(ctx, 100, H / 2 - shieldSize / 2, shieldSize);

  ctx.fillStyle = WHITE;
  ctx.font = "bold 80px sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText("AC FRÍO", 440, H * 0.35);

  ctx.fillStyle = GREY;
  ctx.font = "500 32px sans-serif";
  ctx.fillText("Sangre Fría · Juego al Rojo", 440, H * 0.5);

  ctx.fillStyle = RED;
  ctx.font = "bold 24px sans-serif";
  ctx.fillText("0°C ES TEMPERATURA AMBIENTE", 440, H * 0.65);

  const buf = canvas.toBuffer("image/png");
  const out = join(PUBLIC, "assets", "large-images", "large-facebook.png");
  writeFileSync(out, buf);
  console.log(`  ✓ ${out}`);
}

async function main() {
  ensureDir(join(PUBLIC, "assets", "large-images"));
  ensureDir(join(PUBLIC));

  console.log("Generating icons...");
  await generateFaviconIco();
  await generateIcon(180, join(PUBLIC, "apple-touch-icon.png"));
  await generateIcon(192, join(PUBLIC, "android-chrome-192.png"));
  await generateIcon(512, join(PUBLIC, "android-chrome-512.png"));

  console.log("Generating OG image...");
  await generateOGImage();

  console.log("Generating large images...");
  await generateLargeInstagram();
  await generateLargeFacebook();

  console.log("\nAll assets generated successfully!");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
