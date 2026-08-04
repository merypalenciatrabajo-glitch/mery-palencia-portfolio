import { z } from "zod";

const environmentSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65_535).default(3000),
  CORS_ALLOWED_ORIGINS: z.string().optional(),
  API_RATE_LIMIT_WINDOW_MS: z.coerce
    .number()
    .int()
    .min(1_000)
    .max(86_400_000)
    .default(900_000),
  API_RATE_LIMIT_MAX: z.coerce.number().int().min(1).max(100_000).default(120),
  AUTH_RATE_LIMIT_WINDOW_MS: z.coerce
    .number()
    .int()
    .min(1_000)
    .max(86_400_000)
    .default(300_000),
  AUTH_RATE_LIMIT_MAX: z.coerce.number().int().min(1).max(10_000).default(30),
  TRUST_PROXY_HOPS: z.coerce.number().int().min(0).max(10).optional(),
  REQUEST_TIMEOUT_MS: z.coerce.number().int().min(1_000).max(120_000).default(30_000),
  HEADERS_TIMEOUT_MS: z.coerce.number().int().min(1_000).max(60_000).default(10_000),
  KEEP_ALIVE_TIMEOUT_MS: z.coerce.number().int().min(1_000).max(30_000).default(5_000),
  SHUTDOWN_TIMEOUT_MS: z.coerce.number().int().min(1_000).max(60_000).default(10_000),
  FIREBASE_HEALTHCHECK_TIMEOUT_MS: z.coerce.number().int().min(500).max(30_000).default(3_000),
  HEALTHCHECK_CACHE_MS: z.coerce.number().int().min(0).max(300_000).default(30_000),
  RATE_LIMIT_STORE: z.enum(["memory", "firestore"]).optional(),
});

export interface ServerConfig {
  nodeEnv: "development" | "test" | "production";
  port: number;
  allowedOrigins: ReadonlySet<string>;
  apiRateLimit: {
    windowMs: number;
    limit: number;
  };
  authRateLimit: {
    windowMs: number;
    limit: number;
  };
  trustProxyHops: number;
  httpTimeouts: {
    requestMs: number;
    headersMs: number;
    keepAliveMs: number;
  };
  shutdownTimeoutMs: number;
  healthCheck: {
    firebaseTimeoutMs: number;
    cacheMs: number;
  };
  rateLimitStore: "memory" | "firestore";
}

function parseAllowedOrigins(value: string | undefined, nodeEnv: string) {
  const defaults =
    nodeEnv === "production"
      ? []
      : ["http://localhost:3000", "http://localhost:3001"];
  const configured = value
    ? value.split(",").map((origin) => origin.trim()).filter(Boolean)
    : [];

  const origins = new Set([...defaults, ...configured]);
  for (const origin of origins) {
    if (origin === "*") {
      throw new Error("CORS_ALLOWED_ORIGINS cannot contain a wildcard");
    }

    let url: URL;
    try {
      url = new URL(origin);
    } catch {
      throw new Error(`Invalid CORS origin: ${origin}`);
    }

    if (url.origin !== origin || !["http:", "https:"].includes(url.protocol)) {
      throw new Error(`CORS origins must contain only scheme and host: ${origin}`);
    }
  }

  return origins;
}

export function loadServerConfig(
  environment: NodeJS.ProcessEnv = process.env
): ServerConfig {
  const parsed = environmentSchema.safeParse(environment);
  if (!parsed.success) {
    const names = parsed.error.issues
      .map((issue) => issue.path.join("."))
      .filter(Boolean)
      .join(", ");
    throw new Error(`Invalid server configuration: ${names}`);
  }

  const env = parsed.data;
  if (env.HEADERS_TIMEOUT_MS > env.REQUEST_TIMEOUT_MS) {
    throw new Error(
      "Invalid server configuration: HEADERS_TIMEOUT_MS must not exceed REQUEST_TIMEOUT_MS"
    );
  }
  const allowedOrigins = parseAllowedOrigins(
    env.CORS_ALLOWED_ORIGINS,
    env.NODE_ENV
  );
  if (env.NODE_ENV === "production" && allowedOrigins.size === 0) {
    throw new Error(
      "Invalid server configuration: CORS_ALLOWED_ORIGINS is required in production"
    );
  }

  return {
    nodeEnv: env.NODE_ENV,
    port: env.PORT,
    allowedOrigins,
    apiRateLimit: {
      windowMs: env.API_RATE_LIMIT_WINDOW_MS,
      limit: env.API_RATE_LIMIT_MAX,
    },
    authRateLimit: {
      windowMs: env.AUTH_RATE_LIMIT_WINDOW_MS,
      limit: env.AUTH_RATE_LIMIT_MAX,
    },
    trustProxyHops:
      env.TRUST_PROXY_HOPS ?? (env.NODE_ENV === "production" ? 1 : 0),
    httpTimeouts: {
      requestMs: env.REQUEST_TIMEOUT_MS,
      headersMs: env.HEADERS_TIMEOUT_MS,
      keepAliveMs: env.KEEP_ALIVE_TIMEOUT_MS,
    },
    shutdownTimeoutMs: env.SHUTDOWN_TIMEOUT_MS,
    healthCheck: {
      firebaseTimeoutMs: env.FIREBASE_HEALTHCHECK_TIMEOUT_MS,
      cacheMs: env.HEALTHCHECK_CACHE_MS,
    },
    rateLimitStore:
      env.RATE_LIMIT_STORE ??
      (env.NODE_ENV === "production" ? "firestore" : "memory"),
  };
}
