import cors from "cors";
import type { Request, RequestHandler } from "express";
import { MemoryStore, rateLimit, type Store } from "express-rate-limit";
import type { ServerConfig } from "./config.js";
import { sendApiError } from "./api-errors.js";
import { FirestoreRateLimitStore } from "./firestore-rate-limit-store.js";

function requestOrigin(req: Request) {
  const forwardedProtocol = req.header("x-forwarded-proto")
    ?.split(",")[0]
    ?.trim();
  const protocol = forwardedProtocol || req.protocol;
  const host = req.header("host");
  return host ? `${protocol}://${host}` : null;
}

export function createCorsHandlers(
  allowedOrigins: ReadonlySet<string>
): RequestHandler[] {
  const enforceAllowedOrigin: RequestHandler = (req, res, next) => {
    const origin = req.header("origin");
    const sameOrigin = origin && origin === requestOrigin(req);

    if (origin && !sameOrigin && !allowedOrigins.has(origin)) {
      sendApiError(res, 403, "origin_not_allowed");
      return;
    }

    next();
  };

  const applyCors = cors({
    origin: true,
    credentials: false,
    methods: ["GET", "HEAD", "OPTIONS"],
    allowedHeaders: ["Authorization", "Content-Type"],
    maxAge: 600,
  });

  return [enforceAllowedOrigin, applyCors];
}

function createLimiter(
  options: ServerConfig["apiRateLimit"] | ServerConfig["authRateLimit"],
  store: Store
) {
  return rateLimit({
    windowMs: options.windowMs,
    limit: options.limit,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    store,
    passOnStoreError: false,
    handler: (_req, res) => {
      sendApiError(res, 429, "rate_limit_exceeded");
    },
  });
}

export function createRateLimitStore(
  config: ServerConfig,
  prefix: "api" | "auth"
): Store {
  const options =
    prefix === "api" ? config.apiRateLimit : config.authRateLimit;
  return config.rateLimitStore === "firestore"
    ? new FirestoreRateLimitStore(options.windowMs, prefix)
    : new MemoryStore();
}

export function createApiRateLimiter(config: ServerConfig) {
  return createLimiter(config.apiRateLimit, createRateLimitStore(config, "api"));
}

export function createAuthRateLimiter(config: ServerConfig) {
  return createLimiter(
    config.authRateLimit,
    createRateLimitStore(config, "auth")
  );
}
