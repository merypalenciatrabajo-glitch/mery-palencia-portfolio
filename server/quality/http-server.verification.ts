import { createServer } from "node:http";
import { describe, expect, it } from "vitest";
import type { ServerConfig } from "../config";
import { configureHttpTimeouts } from "../http-server";

describe("HTTP server timeouts", () => {
  it("applies request, header, keep-alive and socket timeouts", () => {
    const server = createServer();
    const config = {
      httpTimeouts: {
        requestMs: 30_000,
        headersMs: 10_000,
        keepAliveMs: 5_000,
      },
    } as ServerConfig;

    configureHttpTimeouts(server, config);

    expect(server.requestTimeout).toBe(30_000);
    expect(server.headersTimeout).toBe(10_000);
    expect(server.keepAliveTimeout).toBe(5_000);
    expect(server.timeout).toBe(30_000);
  });
});
