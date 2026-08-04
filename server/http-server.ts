import type { Server } from "node:http";
import type { ServerConfig } from "./config.js";

export function configureHttpTimeouts(server: Server, config: ServerConfig) {
  server.requestTimeout = config.httpTimeouts.requestMs;
  server.headersTimeout = config.httpTimeouts.headersMs;
  server.keepAliveTimeout = config.httpTimeouts.keepAliveMs;
  server.setTimeout(config.httpTimeouts.requestMs);
}
