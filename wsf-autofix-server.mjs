/**
 * WSF Autofix Local Server
 * Receives error webhooks from WebSecure Forge (Railway via ngrok)
 * and writes them to wsf-pending-fix.json for Kiro to process.
 *
 * Usage:
 *   node wsf-autofix-server.mjs
 *
 * Then expose with ngrok:
 *   ngrok http 4242
 *
 * Set in WebSecure Forge Railway env vars:
 *   AUTOFIX_TUNNEL_URL=https://xxxx.ngrok-free.app
 *   AUTOFIX_SECRET=your-secret-here
 */

import http from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = 4242;
const SECRET = process.env.AUTOFIX_SECRET ?? "";
const PENDING_FILE = path.join(__dirname, "wsf-pending-fix.json");

const server = http.createServer((req, res) => {
  if (req.method !== "POST" || req.url !== "/wsf-autofix") {
    res.writeHead(404).end();
    return;
  }

  // Validate secret
  if (SECRET && req.headers["x-wsf-secret"] !== SECRET) {
    res.writeHead(401).end(JSON.stringify({ error: "Unauthorized" }));
    return;
  }

  let body = "";
  req.on("data", chunk => { body += chunk; });
  req.on("end", () => {
    try {
      const payload = JSON.parse(body);

      // Read existing queue
      let queue = [];
      if (fs.existsSync(PENDING_FILE)) {
        try { queue = JSON.parse(fs.readFileSync(PENDING_FILE, "utf8")); } catch {}
      }

      // Add new error to queue
      queue.push({ ...payload, receivedAt: new Date().toISOString(), status: "pending" });

      // Write back (Kiro Hook watches this file)
      fs.writeFileSync(PENDING_FILE, JSON.stringify(queue, null, 2));

      console.log(`[WSF Autofix] Error recibido: ${payload.projectName} — ${payload.message?.slice(0, 80)}`);
      res.writeHead(200).end(JSON.stringify({ ok: true }));
    } catch (e) {
      console.error("[WSF Autofix] Error parsing payload:", e);
      res.writeHead(400).end(JSON.stringify({ error: "Bad request" }));
    }
  });
});

server.listen(PORT, () => {
  console.log(`[WSF Autofix] Servidor local escuchando en http://localhost:${PORT}`);
  console.log(`[WSF Autofix] Expón con: ngrok http ${PORT}`);
  console.log(`[WSF Autofix] Errores pendientes en: wsf-pending-fix.json`);
});
