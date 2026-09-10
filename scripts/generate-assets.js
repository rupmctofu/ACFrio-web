import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { createCanvas, GlobalFonts, loadImage } from "@napi-rs/canvas";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, "..");
const PUBLIC = join(ROOT, "public");

GlobalFonts.registerFromPath(join(__dirname, "fonts", "BebasNeue-Regular.ttf"), "BebasNeue");

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

  // --- 1. Background: landing-bg.jpg cropped to center ---
  const bgPath = join(PUBLIC, "assets", "backgrounds", "landing-bg.jpg");
  const bgResized = await sharp(bgPath)
    .resize(W, H, { fit: "cover", position: "center" })
    .png()
    .toBuffer();
  const bgImg = await loadImage(bgResized);
  ctx.drawImage(bgImg, 0, 0, W, H);

  // --- 2. Dark overlay (matching landing: bg-acf-dark/70) ---
  ctx.fillStyle = "rgba(13,13,13,0.70)";
  ctx.fillRect(0, 0, W, H);

  // --- 3. Red fog layers (simulating Vanta fog / CSS fallback) ---
  // Layer 1 — top-center warm glow
  const fog1 = ctx.createRadialGradient(W * 0.5, H * 0.15, 0, W * 0.5, H * 0.15, W * 0.55);
  fog1.addColorStop(0, "rgba(230,28,36,0.22)");
  fog1.addColorStop(0.5, "rgba(176,20,27,0.08)");
  fog1.addColorStop(1, "rgba(13,13,13,0)");
  ctx.fillStyle = fog1;
  ctx.fillRect(0, 0, W, H);

  // Layer 2 — left side drift
  const fog2 = ctx.createRadialGradient(W * 0.2, H * 0.45, 0, W * 0.2, H * 0.45, W * 0.5);
  fog2.addColorStop(0, "rgba(230,28,36,0.16)");
  fog2.addColorStop(0.6, "rgba(176,20,27,0.04)");
  fog2.addColorStop(1, "rgba(13,13,13,0)");
  ctx.fillStyle = fog2;
  ctx.fillRect(0, 0, W, H);

  // Layer 3 — right side drift
  const fog3 = ctx.createRadialGradient(W * 0.8, H * 0.5, 0, W * 0.8, H * 0.5, W * 0.45);
  fog3.addColorStop(0, "rgba(230,28,36,0.14)");
  fog3.addColorStop(0.55, "rgba(176,20,27,0.05)");
  fog3.addColorStop(1, "rgba(13,13,13,0)");
  ctx.fillStyle = fog3;
  ctx.fillRect(0, 0, W, H);

  // Layer 4 — bottom ambient red
  const fog4 = ctx.createRadialGradient(W * 0.5, H * 0.85, 0, W * 0.5, H * 0.85, W * 0.6);
  fog4.addColorStop(0, "rgba(230,28,36,0.12)");
  fog4.addColorStop(0.5, "rgba(176,20,27,0.03)");
  fog4.addColorStop(1, "rgba(13,13,13,0)");
  ctx.fillStyle = fog4;
  ctx.fillRect(0, 0, W, H);

  // --- 4. Film grain texture ---
  drawGrainTexture(ctx, W, H);

  // --- 5. Bottom fade to black (matching landing) ---
  const bottomFade = ctx.createLinearGradient(0, H - 160, 0, H);
  bottomFade.addColorStop(0, "rgba(13,13,13,0)");
  bottomFade.addColorStop(1, "rgba(13,13,13,0.85)");
  ctx.fillStyle = bottomFade;
  ctx.fillRect(0, H - 160, W, 160);

  // --- 6. Shield with red glow halo behind ---
  const shieldSize = 260;
  const shieldX = W / 2 - shieldSize / 2;
  const shieldY = 60;

  // Red glow halo (matching landing: blur-3xl opacity-10 scale-150)
  const haloSize = shieldSize * 1.8;
  const haloGrad = ctx.createRadialGradient(
    W / 2, shieldY + shieldSize / 2, shieldSize * 0.3,
    W / 2, shieldY + shieldSize / 2, haloSize / 2
  );
  haloGrad.addColorStop(0, "rgba(230,28,36,0.18)");
  haloGrad.addColorStop(0.5, "rgba(230,28,36,0.06)");
  haloGrad.addColorStop(1, "rgba(230,28,36,0)");
  ctx.fillStyle = haloGrad;
  ctx.fillRect(0, 0, W, H);

  // Draw shield
  await drawShieldOnCanvas(ctx, shieldX, shieldY, shieldSize);

  // --- 7. "AC FRÍO" in Bebas Neue (matching landing header style) ---
  ctx.fillStyle = WHITE;
  ctx.font = "90px BebasNeue";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("AC FRÍO", W / 2, 380);

  // --- 8. "Sangre fría" in Inter (matching landing tagline) ---
  ctx.fillStyle = "rgba(232,232,232,0.90)";
  ctx.font = "italic 500 36px Inter, sans-serif";
  ctx.fillText("Sangre fría", W / 2, 440);

  // --- 9. "Juego al Rojo" accent line ---
  ctx.fillStyle = RED;
  ctx.font = "bold 20px Inter, sans-serif";
  ctx.fillText("J U E G O   A L   R O J O", W / 2, 485);

  // --- 10. URL at bottom ---
  ctx.fillStyle = GREY;
  ctx.font = "400 16px Inter, sans-serif";
  ctx.fillText("acfrio-web.vercel.app", W / 2, H - 30);

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
