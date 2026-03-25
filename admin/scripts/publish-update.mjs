/**
 * publish-update.mjs
 * Uso: node scripts/publish-update.mjs [changelog]
 *
 * Flujo correcto:
 *   1. pnpm release:prepare "descripción"  ← sube APK actual, publica versión SIGUIENTE en Firestore,
 *                                             actualiza CURRENT_VERSION en el código
 *   2. pnpm release:sync                   ← build + cap sync (embebe la nueva versión en el código)
 *   3. Generar APK en Android Studio
 *   4. Instalar APK → ya tiene la versión correcta, no mostrará aviso
 *
 * Versiones: patch sube de 2 en 2 → 1.0.0 → 1.0.2 → 1.0.4 → 1.1.0 → 1.1.2 ...
 */

import { existsSync, readFileSync, statSync, writeFileSync } from "fs";
import { readFile } from "fs/promises";
import fetch from "node-fetch";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dir = dirname(fileURLToPath(import.meta.url));
const [,, changelog = ""] = process.argv;

// ── Leer CURRENT_VERSION del código ──────────────────────────────────────────
const hookPath = resolve(__dir, "../src/hooks/useAppUpdate.ts");
const hookContent = readFileSync(hookPath, "utf-8");
const match = hookContent.match(/CURRENT_VERSION = "([^"]+)"/);
if (!match) { console.error("❌ No se encontró CURRENT_VERSION en useAppUpdate.ts"); process.exit(1); }
const currentVersion = match[1];

// ── Calcular versión siguiente ────────────────────────────────────────────────
function nextVersion(v) {
  let [maj, min, patch] = v.split(".").map(Number);
  patch += 2;
  if (patch >= 6) { patch = 0; min += 1; }
  if (min >= 10)  { min = 0;   maj += 1; }
  return `${maj}.${min}.${patch}`;
}
const newVersion = nextVersion(currentVersion);
console.log(`\n🔖 ${currentVersion} → ${newVersion}`);

// ── Verificar APK ─────────────────────────────────────────────────────────────
const apkPath = resolve(__dir, "../android/app/build/outputs/apk/release/app-release.apk");
if (!existsSync(apkPath)) {
  console.error("❌ APK no encontrado. Genera el APK desde Android Studio primero.");
  process.exit(1);
}

// ── Leer .env ─────────────────────────────────────────────────────────────────
const envRaw = readFileSync(resolve(__dir, "../.env"), "utf-8");
const env = Object.fromEntries(
  envRaw.split("\n")
    .filter(l => l.includes("=") && !l.trimStart().startsWith("#"))
    .map(l => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; })
);

const { GITHUB_TOKEN, GITHUB_REPO } = env;
const FIREBASE_PROJECT_ID = "admin-portafolio-1bafe";
const FIREBASE_API_KEY = "AIzaSyCOhB75_HC1TtyOj-H2RXfYtc3IS70Zfp0";

if (!GITHUB_TOKEN || !GITHUB_REPO) {
  console.error("❌ Faltan GITHUB_TOKEN y GITHUB_REPO en .env");
  process.exit(1);
}

// ── Subir APK a GitHub Releases ───────────────────────────────────────────────
const sizeMB = (statSync(apkPath).size / 1024 / 1024).toFixed(1);
console.log(`📦 Subiendo APK v${newVersion} (${sizeMB} MB)...`);

const ghHeaders = {
  Authorization: `Bearer ${GITHUB_TOKEN}`,
  Accept: "application/vnd.github+json",
  "Content-Type": "application/json",
};

// Crear release
const createRes = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases`, {
  method: "POST",
  headers: ghHeaders,
  body: JSON.stringify({ tag_name: `v${newVersion}`, name: `v${newVersion}`, body: changelog }),
});

let uploadUrl;
if (createRes.ok) {
  uploadUrl = (await createRes.json()).upload_url;
} else {
  const err = await createRes.json();
  if (err.errors?.[0]?.code !== "already_exists") {
    console.error("❌ Error creando release:", JSON.stringify(err)); process.exit(1);
  }
  // Release ya existe — obtener upload_url
  const existing = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases/tags/v${newVersion}`, { headers: ghHeaders });
  const existingData = await existing.json();
  uploadUrl = existingData.upload_url;

  // Borrar asset anterior si existe
  const oldAsset = existingData.assets?.find(a => a.name === `admin-v${newVersion}.apk`);
  if (oldAsset) {
    await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases/assets/${oldAsset.id}`, {
      method: "DELETE", headers: ghHeaders,
    });
  }
}

// Subir archivo
const apkBuffer = await readFile(apkPath);
const uploadRes = await fetch(`${uploadUrl.replace("{?name,label}", "")}?name=admin-v${newVersion}.apk`, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${GITHUB_TOKEN}`,
    Accept: "application/vnd.github+json",
    "Content-Type": "application/vnd.android.package-archive",
  },
  body: apkBuffer,
});

if (!uploadRes.ok) {
  console.error("❌ Error subiendo APK:", await uploadRes.text()); process.exit(1);
}

const apkUrl = (await uploadRes.json()).browser_download_url;
console.log(`✅ APK subido: ${apkUrl}`);

// ── Actualizar Firestore ───────────────────────────────────────────────────────
console.log("🔥 Actualizando Firestore...");
const fsRes = await fetch(
  `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/settings/appVersion?key=${FIREBASE_API_KEY}`,
  {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fields: {
        version:   { stringValue: newVersion },
        apkUrl:    { stringValue: apkUrl },
        changelog: { stringValue: changelog },
        updatedAt: { stringValue: new Date().toISOString() },
      },
    }),
  }
);
if (!fsRes.ok) { console.error("❌ Error Firestore:", await fsRes.text()); process.exit(1); }
console.log("✅ Firestore actualizado");

// ── Actualizar CURRENT_VERSION en el código ───────────────────────────────────
writeFileSync(hookPath, hookContent.replace(/CURRENT_VERSION = "[^"]+"/, `CURRENT_VERSION = "${newVersion}"`));
console.log(`✅ CURRENT_VERSION → ${newVersion}`);

// ── Actualizar build.gradle ───────────────────────────────────────────────────
const gradlePath = resolve(__dir, "../android/app/build.gradle");
const gradleContent = readFileSync(gradlePath, "utf-8");
// versionCode: convierte "1.4.4" → 144 (quita puntos)
const versionCode = parseInt(newVersion.replace(/\./g, ""), 10);
const updatedGradle = gradleContent
  .replace(/versionCode\s+\d+/, `versionCode ${versionCode}`)
  .replace(/versionName\s+"[^"]+"/, `versionName "${newVersion}"`);
writeFileSync(gradlePath, updatedGradle);
console.log(`✅ build.gradle → versionCode ${versionCode}, versionName "${newVersion}"`);

console.log(`\n🚀 v${newVersion} lista. Ahora: pnpm release:sync → generar APK → instalar.\n`);
