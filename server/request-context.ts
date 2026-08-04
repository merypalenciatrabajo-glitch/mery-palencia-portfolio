import { randomUUID } from "node:crypto";
import type { RequestHandler } from "express";
import type { AppLogger } from "./logger.js";

export function createRequestContext(logger: AppLogger): RequestHandler {
  return (req, res, next) => {
    const requestId = randomUUID();
    const startedAt = performance.now();

    res.locals.requestId = requestId;
    res.setHeader("X-Request-ID", requestId);
    res.once("finish", () => {
      logger.info("request_completed", {
        requestId,
        method: req.method,
        path: req.path,
        status: res.statusCode,
        durationMs: Math.round(performance.now() - startedAt),
      });
    });

    next();
  };
}
