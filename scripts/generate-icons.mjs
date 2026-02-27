#!/usr/bin/env node
/**
 * Generate SnCode app icons + Windows installer assets.
 *
 * Output (all in build/):
 *   icon.png               1024x1024  All platforms
 *   icon-512.png            512x512   Linux
 *   icon.ico                multi-res Windows
 *   installerSidebar.bmp    164x314   NSIS sidebar
 *   installerHeader.bmp     150x57    NSIS header
 *
 * Design: Inset dark squircle, "Sn" monogram with depth. Monochromatic.
 */

import sharp from "sharp";
import pngToIco from "png-to-ico";
import { readFileSync, writeFileSync, mkdirSync, unlinkSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const buildDir = join(__dirname, "..", "build");
mkdirSync(buildDir, { recursive: true });
const packageJson = JSON.parse(readFileSync(join(__dirname, "..", "package.json"), "utf8"));
const appVersion = packageJson.version ?? "0.0.0";
const installerVersionLabel = `v${appVersion}`;

/* ─────────────────────────── SVGs ─────────────────────────── */

const SIZE = 1024;

const logoSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0.8" y2="1">
      <stop offset="0%" stop-color="#1c1c20"/>
      <stop offset="100%" stop-color="#0e0e11"/>
    </linearGradient>

    <!-- Border stroke glow at corners -->
    <radialGradient id="borderTR" cx="0.88" cy="0.12" r="0.4">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="1"/>
      <stop offset="30%" stop-color="#ffffff" stop-opacity="0.15"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="borderBL" cx="0.12" cy="0.88" r="0.4">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="1"/>
      <stop offset="30%" stop-color="#ffffff" stop-opacity="0.15"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>

    <!-- Edge vignette for inset depth -->
    <radialGradient id="vignette" cx="0.5" cy="0.48" r="0.52">
      <stop offset="0%" stop-color="#000000" stop-opacity="0"/>
      <stop offset="75%" stop-color="#000000" stop-opacity="0"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0.3"/>
    </radialGradient>

    <!-- Subtle top-center light for dimension -->
    <radialGradient id="topLight" cx="0.5" cy="0.25" r="0.45">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.03"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>

    <!-- Text depth: shadow beneath letters -->
    <filter id="td" x="-5%" y="-5%" width="110%" height="120%">
      <feDropShadow dx="0" dy="5" stdDeviation="5" flood-color="#000" flood-opacity="0.7"/>
    </filter>
  </defs>

  <!-- Background squircle (inset — no outer shadow) -->
  <rect x="64" y="64" width="896" height="896" rx="212" ry="212" fill="url(#bg)"/>

  <!-- Vignette darkening at edges -->
  <rect x="64" y="64" width="896" height="896" rx="212" ry="212" fill="url(#vignette)"/>

  <!-- Subtle top light -->
  <rect x="64" y="64" width="896" height="896" rx="212" ry="212" fill="url(#topLight)"/>

  <!-- Border: top-right corner glow -->
  <rect x="62" y="62" width="900" height="900" rx="214" ry="214"
        fill="none" stroke="url(#borderTR)" stroke-width="8"/>
  <!-- Border: bottom-left corner glow -->
  <rect x="62" y="62" width="900" height="900" rx="214" ry="214"
        fill="none" stroke="url(#borderBL)" stroke-width="8"/>

  <!-- "S" — bold, white, with depth -->
  <text x="240" y="695"
        font-family="Bahnschrift,'SF Pro Display','Segoe UI',sans-serif"
        font-size="540" font-weight="700" fill="#ffffff"
        filter="url(#td)" letter-spacing="-10">S</text>

  <!-- "n" — visible gray, with depth -->
  <text x="565" y="695"
        font-family="Bahnschrift,'SF Pro Display','Segoe UI',sans-serif"
        font-size="380" font-weight="600" fill="#b4b4bc"
        filter="url(#td)" letter-spacing="-4">n</text>
</svg>`;

// NSIS sidebar: 164x314 — centered branding
const sidebarSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="164" height="314" viewBox="0 0 164 314">
  <defs>
    <linearGradient id="sbg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#1a1a1e"/>
      <stop offset="100%" stop-color="#0e0e11"/>
    </linearGradient>
  </defs>
  <rect width="164" height="314" fill="url(#sbg)"/>

  <!-- Right-edge separator -->
  <rect x="162" y="0" width="2" height="314" fill="rgba(255,255,255,0.08)"/>

  <!-- Large "Sn" mark, centered -->
  <text x="82" y="125" text-anchor="middle"
        font-family="Bahnschrift,'Segoe UI',sans-serif"
        font-size="80" font-weight="700" fill="#ffffff">S<tspan font-size="55" font-weight="600" fill="#b4b4bc">n</tspan></text>

  <!-- Separator -->
  <rect x="56" y="142" width="52" height="1" rx="0.5" fill="rgba(255,255,255,0.1)"/>

  <!-- App name, centered -->
  <text x="82" y="170" text-anchor="middle"
        font-family="Bahnschrift,'Segoe UI',sans-serif"
        font-size="18" font-weight="600" fill="#d4d4d8" letter-spacing="2">SnCode</text>

  <!-- Tagline, centered -->
  <text x="82" y="192" text-anchor="middle"
        font-family="Bahnschrift,'Segoe UI',sans-serif"
        font-size="11" fill="#71717a" letter-spacing="0.5">AI Coding Agent</text>

  <!-- Version, bottom center -->
  <text x="82" y="296" text-anchor="middle"
        font-family="Bahnschrift,'Segoe UI',sans-serif"
        font-size="10" fill="#52525b">${installerVersionLabel}</text>
</svg>`;

// NSIS header: 150x57 — clean centered bar
const headerSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="150" height="57" viewBox="0 0 150 57">
  <defs>
    <linearGradient id="hbg" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#1a1a1e"/>
      <stop offset="100%" stop-color="#131316"/>
    </linearGradient>
  </defs>
  <rect width="150" height="57" fill="url(#hbg)"/>

  <!-- Bottom separator -->
  <rect x="0" y="55" width="150" height="2" fill="rgba(255,255,255,0.08)"/>

  <!-- "SnCode" centered -->
  <text x="75" y="36" text-anchor="middle"
        font-family="Bahnschrift,'Segoe UI',sans-serif"
        font-size="22" font-weight="600" fill="#e4e4e7" letter-spacing="1.5">SnCode</text>
</svg>`;

/* ─────────── BMP conversion (24-bit, no alpha) ─────────── */

function rawToBmp24(rgba, w, h, bgR = 0x0e, bgG = 0x0e, bgB = 0x11) {
  const rowBytes = w * 3;
  const pad = (4 - (rowBytes % 4)) % 4;
  const stride = rowBytes + pad;
  const dataSize = stride * h;
  const buf = Buffer.alloc(14 + 40 + dataSize);

  buf.write("BM", 0);
  buf.writeUInt32LE(buf.length, 2);
  buf.writeUInt32LE(0, 6);
  buf.writeUInt32LE(54, 10);

  buf.writeUInt32LE(40, 14);
  buf.writeInt32LE(w, 18);
  buf.writeInt32LE(h, 22);
  buf.writeUInt16LE(1, 26);
  buf.writeUInt16LE(24, 28);
  buf.writeUInt32LE(0, 30);
  buf.writeUInt32LE(dataSize, 34);
  buf.writeInt32LE(2835, 38);
  buf.writeInt32LE(2835, 42);

  for (let y = 0; y < h; y++) {
    const srcY = (h - 1 - y) * w * 4;
    const dstY = 54 + y * stride;
    for (let x = 0; x < w; x++) {
      const si = srcY + x * 4;
      const di = dstY + x * 3;
      const a = rgba[si + 3] / 255;
      buf[di + 0] = Math.round(rgba[si + 2] * a + bgB * (1 - a));
      buf[di + 1] = Math.round(rgba[si + 1] * a + bgG * (1 - a));
      buf[di + 2] = Math.round(rgba[si + 0] * a + bgR * (1 - a));
    }
  }
  return buf;
}

/* ──────────────────── Generation ──────────────────── */

async function generate() {
  console.log("Generating SnCode icons + installer assets…\n");

  const png1024 = await sharp(Buffer.from(logoSvg))
    .resize(1024, 1024).png().toBuffer();
  writeFileSync(join(buildDir, "icon.png"), png1024);
  console.log("  icon.png             1024x1024");

  const png512 = await sharp(Buffer.from(logoSvg))
    .resize(512, 512).png().toBuffer();
  writeFileSync(join(buildDir, "icon-512.png"), png512);
  console.log("  icon-512.png          512x512");

  const icoSizes = [16, 24, 32, 48, 64, 128, 256];
  const tempPaths = [];
  for (const s of icoSizes) {
    const p = join(buildDir, `_tmp_${s}.png`);
    const b = await sharp(Buffer.from(logoSvg)).resize(s, s).png().toBuffer();
    writeFileSync(p, b);
    tempPaths.push(p);
  }
  writeFileSync(join(buildDir, "icon.ico"), await pngToIco(tempPaths));
  for (const p of tempPaths) { try { unlinkSync(p); } catch { /* ignore */ } }
  console.log("  icon.ico              multi-res");
  console.log("  icon.icns             (auto via electron-builder on macOS)");

  const sW = 164, sH = 314;
  const sidebarRaw = await sharp(Buffer.from(sidebarSvg))
    .resize(sW, sH).ensureAlpha().raw().toBuffer();
  writeFileSync(join(buildDir, "installerSidebar.bmp"), rawToBmp24(sidebarRaw, sW, sH));
  console.log("  installerSidebar.bmp  164x314");

  const hW = 150, hH = 57;
  const headerRaw = await sharp(Buffer.from(headerSvg))
    .resize(hW, hH).ensureAlpha().raw().toBuffer();
  writeFileSync(join(buildDir, "installerHeader.bmp"), rawToBmp24(headerRaw, hW, hH));
  console.log("  installerHeader.bmp   150x57");

  console.log("\nDone! All assets in build/");
}

generate().catch((err) => {
  console.error("Icon generation failed:", err);
  process.exit(1);
});
