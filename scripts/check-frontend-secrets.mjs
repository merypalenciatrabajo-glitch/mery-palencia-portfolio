import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";

const projectRoot = path.resolve(import.meta.dirname, "..");
const targets = [
  path.join(projectRoot, "client", "src"),
  path.join(projectRoot, "admin", "src"),
  path.join(projectRoot, "client", "dist"),
  path.join(projectRoot, "admin", "dist"),
  path.join(projectRoot, "dist", "public"),
];

const forbiddenPatterns = [
  ["Firebase Admin import", /firebase-admin/],
  ["service account JSON variable", /FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON/],
  ["private key variable", /FIREBASE_ADMIN_PRIVATE_KEY/],
  ["Google credentials path", /GOOGLE_APPLICATION_CREDENTIALS/],
  ["private key material", /-----BEGIN PRIVATE KEY-----/],
];

async function collectFiles(target) {
  try {
    const targetStat = await stat(target);
    if (targetStat.isFile()) return [target];
  } catch {
    return [];
  }

  const entries = await readdir(target, { withFileTypes: true });
  const files = await Promise.all(
    entries.map((entry) =>
      collectFiles(path.join(target, entry.name))
    )
  );
  return files.flat();
}

const violations = [];
for (const target of targets) {
  for (const file of await collectFiles(target)) {
    const content = await readFile(file, "utf8");
    for (const [label, pattern] of forbiddenPatterns) {
      if (pattern.test(content)) {
        violations.push(`${label}: ${path.relative(projectRoot, file)}`);
      }
    }
  }
}

if (violations.length > 0) {
  console.error("Frontend secret boundary check failed:\n" + violations.join("\n"));
  process.exit(1);
}

console.log("Frontend secret boundary check passed.");
