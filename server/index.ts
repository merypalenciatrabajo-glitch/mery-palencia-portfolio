import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import { createApp } from "./app.js";
import { loadServerConfig } from "./config.js";
import { configureHttpTimeouts } from "./http-server.js";
import { createJsonLogger } from "./logger.js";
import { installGracefulShutdown } from "./lifecycle.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const config = loadServerConfig();
  const logger = createJsonLogger();
  const staticPath = path.resolve(__dirname, "public");
  const app = createApp({ config, staticPath, logger });
  const server = createServer(app);
  configureHttpTimeouts(server, config);
  installGracefulShutdown(server, logger, config.shutdownTimeoutMs);

  server.listen(config.port, () => {
    logger.info("server_started", {
      environment: config.nodeEnv,
      port: config.port,
    });
  });
}

startServer().catch((error: unknown) => {
  const logger = createJsonLogger();
  logger.error("server_start_failed", {
    errorName: error instanceof Error ? error.name : "UnknownError",
  });
  process.exitCode = 1;
});
