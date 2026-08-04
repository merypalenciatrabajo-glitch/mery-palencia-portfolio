import { createServer } from "node:http";
import { describe, expect, it, vi } from "vitest";
import { closeServerGracefully } from "./lifecycle";
import type { AppLogger } from "./logger";

describe("graceful server shutdown", () => {
  it("stops accepting connections and records completion", async () => {
    const info = vi.fn();
    const logger: AppLogger = { info, error: vi.fn() };
    const server = createServer((_req, res) => res.end("ok"));
    await new Promise<void>((resolve) => server.listen(0, resolve));

    await closeServerGracefully(server, logger, 1_000);

    expect(server.listening).toBe(false);
    expect(info).toHaveBeenCalledWith(
      "server_shutdown_completed",
      expect.objectContaining({ forced: false })
    );
  });
});
