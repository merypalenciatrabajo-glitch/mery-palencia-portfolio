import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const targets = [
  { file: 'vercel.json', output: 'dist/public' },
  { file: 'client/vercel.json', output: 'dist' },
  { file: 'admin/vercel.json', output: 'dist' },
];

for (const target of targets) {
  const config = JSON.parse(await readFile(path.join(root, target.file), 'utf8'));
  if (config.installCommand !== 'pnpm install --frozen-lockfile') {
    throw new Error(`${target.file}: installation must use the frozen pnpm lockfile`);
  }
  if (config.outputDirectory !== target.output) {
    throw new Error(`${target.file}: expected outputDirectory ${target.output}`);
  }
  if (!config.rewrites?.some((rewrite) => rewrite.source === '/(.*)' && rewrite.destination === '/index.html')) {
    throw new Error(`${target.file}: missing SPA fallback rewrite`);
  }
  const globalHeaders = config.headers?.find((entry) => entry.source === '/(.*)')?.headers ?? [];
  for (const required of ['X-Content-Type-Options', 'X-Frame-Options', 'Referrer-Policy', 'Permissions-Policy']) {
    if (!globalHeaders.some((header) => header.key === required)) {
      throw new Error(`${target.file}: missing ${required}`);
    }
  }
}

console.log(`Validated ${targets.length} Vercel configurations.`);
