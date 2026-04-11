/**
 * publish-update.mjs
 *
 * FASE 1 — release:prepare "descripción"
 *   Calcula la versión siguiente, actualiza CURRENT_VERSION en el código
 *   y build.gradle. NO sube nada todavía.
 *   Después debes: pnpm release:build → generar APK en Android Studio → pnpm release:publish
 *
 * FASE 2 — release:publish "descripción"
 *   Lee CURRENT_VERSION del código (ya actualizado), sube el APK a GitHub
 *   y actualiza Firestore. El APK debe haber sido generado DESPUÉS de release:prepare.
 *
 * Flujo completo:
 *   1. pnpm release:prepare "descripción"   ← bump versión en código
 *   2. pnpm release:build                   ← build + cap sync
 *   3. Android Studio → Build → Build APK(s)
 *   4. pnpm release:publish "descripción"   ← sube APK + actualiza Firestore
 *   5. git add -A && git commit -m "chore: bump version vX.Y.Z" && git push
 */

import { existsSync, readFileSync, statSync, writeFileSync } from "fs";
import { readFile } from "fs/promises";
import fetch from "node-fetch";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dir = dirname(fileURLToPath(import.meta.url));
const [,, command = "prepare", changelog = ""] = process.argv;

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

// ─────────────────────────────────────────────────────────────────────────────
// FASE 1: prepare — bump versión en código ANTES de compilar
// ─────────────────────────────────────────────────────────────────────────────
if (command === "prepare") {
  const newVersion = nextVersion(currentVersion);
  console.log(`\n🔖 Preparando: ${currentVersion} → ${newVersion}`);

  // Actualizar CURRENT_VERSION en useAppUpdate.ts
  writeFileSync(hookPath, hookContent.replace(/CURRENT_VERSION = "[^"]+"/, `CURRENT_VERSION = "${newVersion}"`));
  console.log(`✅ CURRENT_VERSION → ${newVersion} en useAppUpdate.ts`);

  // Actualizar build.gradle
  const gradlePath = resolve(__dir, "../android/app/build.gradle");
  const gradleContent = readFileSync(gradlePath, "utf-8");
  const versionCode = parseInt(newVersion.replace(/\./g, ""), 10);
  const updatedGradle = gradleContent
    .replace(/versionCode\s+\d+/, `versionCode ${versionCode}`)
    .replace(/versionName\s+"[^"]+"/, `versionName "${newVersion}"`);
  writeFileSync(gradlePath, updatedGradle);
  console.log(`✅ build.gradle → versionCode ${versionCode}, versionName "${newVersion}"`);

  console.log(`
✅ Versión ${newVersion} lista en el código.

Próximos pasos:
  1. pnpm release:build          ← build + cap sync
  2. Android Studio → Build → Build APK(s)
  3. pnpm release:publish "${changelog || 'descripción del cambio'}"
`);
  process.exit(0);
}

// ─────────────────────────────────────────────────────────────────────────────
// FASE 2: publish — sube el APK (ya compilado con la versión correcta)
// ─────────────────────────────────────────────────────────────────────────────
if (command === "publish") {
  // La versión a publicar ES la que ya está en el código (fue actualizada en prepare)
  const publishVersion = currentVersion;
  console.log(`\n🚀 Publicando v${publishVersion}...`);

  // Verificar APK
  const apkPath = resolve(__dir, "../android/app/release/app-release.apk");
  if (!existsSync(apkPath)) {
    console.error("❌ APK no encontrado. Genera el APK desde Android Studio primero.");
    process.exit(1);
  }

  // Verificar que el APK es reciente (menos de 2 horas)
  const apkAge = (Date.now() - statSync(apkPath).mtimeMs) / 1000 / 60;
  if (apkAge > 120) {
    console.warn(`⚠️  El APK tiene ${Math.round(apkAge)} minutos. ¿Seguro que es el correcto?`);
  }

  if (!GITHUB_TOKEN || !GITHUB_REPO) {
    console.error("❌ Faltan GITHUB_TOKEN y GITHUB_REPO en .env");
    process.exit(1);
  }

  const ghHeaders = {
    Authorization: `Bearer ${GITHUB_TOKEN}`,
    Accept: "application/vnd.github+json",
    "Content-Type": "application/json",
  };

  const sizeMB = (statSync(apkPath).size / 1024 / 1024).toFixed(1);
  console.log(`📦 Subiendo APK v${publishVersion} (${sizeMB} MB)...`);

  // Crear release en GitHub
  const createRes = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases`, {
    method: "POST",
    headers: ghHeaders,
    body: JSON.stringify({ tag_name: `v${publishVersion}`, name: `v${publishVersion}`, body: changelog }),
  });

  let uploadUrl;
  if (createRes.ok) {
    uploadUrl = (await createRes.json()).upload_url;
  } else {
    const err = await createRes.json();
    if (err.errors?.[0]?.code !== "already_exists") {
      console.error("❌ Error creando release:", JSON.stringify(err)); process.exit(1);
    }
    const existing = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases/tags/v${publishVersion}`, { headers: ghHeaders });
    const existingData = await existing.json();
    uploadUrl = existingData.upload_url;
    const oldAsset = existingData.assets?.find(a => a.name === `admin-v${publishVersion}.apk`);
    if (oldAsset) {
      await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases/assets/${oldAsset.id}`, {
        method: "DELETE", headers: ghHeaders,
      });
    }
  }

  // Subir APK
  const apkBuffer = await readFile(apkPath);
  const uploadRes = await fetch(`${uploadUrl.replace("{?name,label}", "")}?name=admin-v${publishVersion}.apk`, {
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

  // Actualizar Firestore
  console.log(`🔥 Actualizando Firestore: settings/appVersion → version="${publishVersion}"...`);
  const firestorePayload = {
    fields: {
      version:   { stringValue: publishVersion },
      apkUrl:    { stringValue: apkUrl },
      changelog: { stringValue: changelog },
      updatedAt: { stringValue: new Date().toISOString() },
    },
  };
  console.log("   Payload Firestore:", JSON.stringify(firestorePayload.fields, null, 2));
  const fsRes = await fetch(
    `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/settings/appVersion?key=${FIREBASE_API_KEY}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(firestorePayload),
    }
  );
  if (!fsRes.ok) { console.error("❌ Error Firestore:", await fsRes.text()); process.exit(1); }
  const fsData = await fsRes.json();
  console.log(`✅ Firestore actualizado — version escrita: "${fsData.fields?.version?.stringValue}"`);
  console.log(`   APK URL escrita: "${fsData.fields?.apkUrl?.stringValue}"`);

  console.log(`
🎉 v${publishVersion} publicada correctamente.
   APK: ${apkUrl}

Último paso:
   git add -A && git commit -m "chore: bump version v${publishVersion}" && git push
`);
  process.exit(0);
}

console.error(`❌ Comando desconocido: "${command}". Usa "prepare" o "publish".`);
process.exit(1);
