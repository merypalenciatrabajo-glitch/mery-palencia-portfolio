import type { Server } from "node:http";
import type { AppLogger } from "./logger.js";

export async function closeServerGracefully(
  server: Server,
  logger: AppLogger,
  timeoutMs: number
) {
  if (!server.listening) return;

  logger.info("server_shutdown_started", { timeoutMs });
  server.closeIdleConnections?.();

  await new Promise<void>((resolve, reject) => {
    let forced = false;
    const timeout = setTimeout(() => {
      forced = true;
      server.closeAllConnections?.();
    }, timeoutMs);
    timeout.unref();

    server.close((error) => {
      clearTimeout(timeout);
      if (error) {
        reject(error);
        return;
      }

      logger.info("server_shutdown_completed", { forced });
      resolve();
    });
  });
}

export function installGracefulShutdown(
  server: Server,
  logger: AppLogger,
  timeoutMs: number
) {
  let shutdownPromise: Promise<void> | undefined;

  const shutdown = (signal: NodeJS.Signals) => {
    if (shutdownPromise) return;
    logger.info("server_shutdown_signal_received", { signal });
    shutdownPromise = closeServerGracefully(server, logger, timeoutMs).catch(
      (error: unknown) => {
        logger.error("server_shutdown_failed", {
          errorName: error instanceof Error ? error.name : "UnknownError",
        });
        process.exitCode = 1;
      }
    );
  };

  const onSigint = () => shutdown("SIGINT");
  const onSigterm = () => shutdown("SIGTERM");
  process.once("SIGINT", onSigint);
  process.once("SIGTERM", onSigterm);

  return () => {
    process.off("SIGINT", onSigint);
    process.off("SIGTERM", onSigterm);
  };
}
