import type { RequestHandler } from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../app";
import type { ServerConfig } from "../config";
import { createJsonLogger, silentLogger, type AppLogger } from "../logger";
import type { ReadinessCheck } from "../health";

function testConfig(overrides: Partial<ServerConfig> = {}): ServerConfig {
  return {
    nodeEnv: "test",
    port: 3000,
    allowedOrigins: new Set(["https://admin.example.com"]),
    apiRateLimit: { windowMs: 60_000, limit: 100 },
    authRateLimit: { windowMs: 60_000, limit: 20 },
    trustProxyHops: 0,
    httpTimeouts: {
      requestMs: 30_000,
      headersMs: 10_000,
      keepAliveMs: 5_000,
    },
    shutdownTimeoutMs: 10_000,
    healthCheck: {
      firebaseTimeoutMs: 3_000,
      cacheMs: 30_000,
    },
    rateLimitStore: "memory",
    ...overrides,
  };
}

function appWith(
  config: ServerConfig,
  authMiddleware?: RequestHandler,
  logger: AppLogger = silentLogger,
  readinessCheck?: ReadinessCheck
) {
  return createApp({
    config,
    staticPath: "C:/path-that-does-not-exist",
    authMiddleware,
    logger,
    readinessCheck,
  });
}

describe("Express API security", () => {
  it("returns normalized liveness and readiness responses", async () => {
    const readinessCheck: ReadinessCheck = async () => ({
      status: "ready",
      dependencies: { firebaseAuth: "ok" },
    });
    const app = appWith(
      testConfig(),
      undefined,
      silentLogger,
      readinessCheck
    );

    const live = await request(app).get("/api/health/live");
    expect(live.status).toBe(200);
    expect(live.body.data.status).toBe("ok");
    expect(live.body.meta.requestId).toBe(live.headers["x-request-id"]);

    const ready = await request(app).get("/api/health/ready");
    expect(ready.status).toBe(200);
    expect(ready.body.data.dependencies.firebaseAuth).toBe("ok");
  });

  it("reports readiness dependency failures without exposing details", async () => {
    const readinessCheck: ReadinessCheck = async () => {
      throw new Error("credential details must stay private");
    };
    const response = await request(
      appWith(testConfig(), undefined, silentLogger, readinessCheck)
    ).get("/api/health/ready");

    expect(response.status).toBe(503);
    expect(response.body.error.code).toBe("service_unavailable");
    expect(JSON.stringify(response.body)).not.toContain("credential details");
  });

  it("accepts allowed and same-origin requests", async () => {
    const app = appWith(testConfig());

    const allowed = await request(app)
      .get("/api/health")
      .set("Origin", "https://admin.example.com");
    expect(allowed.status).toBe(200);
    expect(allowed.headers["access-control-allow-origin"]).toBe(
      "https://admin.example.com"
    );

    const sameOrigin = await request(app)
      .get("/api/health")
      .set("Host", "portfolio.example.com")
      .set("X-Forwarded-Proto", "https")
      .set("Origin", "https://portfolio.example.com");
    expect(sameOrigin.status).toBe(200);
  });

  it("rejects origins outside the allowlist", async () => {
    const response = await request(appWith(testConfig()))
      .get("/api/health")
      .set("Origin", "https://attacker.example");

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe("origin_not_allowed");
    expect(response.body.error.requestId).toBe(response.headers["x-request-id"]);
  });

  it("allows CORS preflight for authenticated API requests", async () => {
    const response = await request(appWith(testConfig()))
      .options("/api/auth/session")
      .set("Origin", "https://admin.example.com")
      .set("Access-Control-Request-Method", "GET")
      .set("Access-Control-Request-Headers", "authorization");

    expect(response.status).toBe(204);
    expect(response.headers["access-control-allow-origin"]).toBe(
      "https://admin.example.com"
    );
    expect(response.headers["access-control-allow-headers"]).toContain(
      "Authorization"
    );
  });

  it("rejects unexpected query input", async () => {
    const response = await request(appWith(testConfig())).get(
      "/api/health?unexpected=true"
    );

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("validation_error");
  });

  it("rejects malformed JSON request bodies", async () => {
    const response = await request(appWith(testConfig()))
      .post("/api/unknown")
      .set("Content-Type", "application/json")
      .send('{"incomplete":');

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("invalid_json");
  });

  it("rejects JSON request bodies larger than 16 KB", async () => {
    const response = await request(appWith(testConfig()))
      .post("/api/unknown")
      .set("Content-Type", "application/json")
      .send(JSON.stringify({ value: "x".repeat(17 * 1024) }));

    expect(response.status).toBe(413);
    expect(response.body.error.code).toBe("payload_too_large");
  });

  it("applies a global API rate limit", async () => {
    const config = testConfig({
      apiRateLimit: { windowMs: 60_000, limit: 2 },
    });
    const app = appWith(config);

    expect((await request(app).get("/api/unknown")).status).toBe(404);
    expect((await request(app).get("/api/unknown")).status).toBe(404);
    const limited = await request(app).get("/api/unknown");
    expect(limited.status).toBe(429);
    expect(limited.body.error.code).toBe("rate_limit_exceeded");
  });

  it("applies a stricter authentication rate limit", async () => {
    const rejectAuth: RequestHandler = (_req, res) => {
      res.status(401).json({ error: "missing_token" });
    };
    const config = testConfig({
      apiRateLimit: { windowMs: 60_000, limit: 100 },
      authRateLimit: { windowMs: 60_000, limit: 2 },
    });
    const app = appWith(config, rejectAuth);

    expect((await request(app).get("/api/auth/session")).status).toBe(401);
    expect((await request(app).get("/api/auth/session")).status).toBe(401);
    const limited = await request(app).get("/api/auth/session");
    expect(limited.status).toBe(429);
  });

  it("normalizes successful authenticated session responses", async () => {
    const authenticate: RequestHandler = (req, _res, next) => {
      req.firebaseUser = {
        uid: "admin-1",
        email: "admin@example.com",
        role: "admin",
      } as Express.Request["firebaseUser"];
      next();
    };
    const response = await request(
      appWith(testConfig(), authenticate)
    ).get("/api/auth/session");

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual({
      uid: "admin-1",
      email: "admin@example.com",
      role: "admin",
    });
    expect(response.body.meta.requestId).toBe(response.headers["x-request-id"]);
  });

  it("sets browser security headers and HSTS only in production", async () => {
    const development = await request(appWith(testConfig())).get("/api/health");
    expect(development.headers["content-security-policy"]).toContain(
      "default-src 'self'"
    );
    expect(development.headers["x-content-type-options"]).toBe("nosniff");
    expect(development.headers["x-frame-options"]).toBe("DENY");
    expect(development.headers["permissions-policy"]).toContain("camera=()",
    );
    expect(development.headers["cache-control"]).toBe("no-store");
    expect(development.headers["strict-transport-security"]).toBeUndefined();

    const production = await request(
      appWith(testConfig({ nodeEnv: "production", trustProxyHops: 1 }))
    ).get("/api/health");
    expect(production.headers["strict-transport-security"]).toContain(
      "max-age=31536000"
    );
  });

  it("normalizes unexpected errors without logging credentials", async () => {
    const lines: string[] = [];
    const logger = createJsonLogger((line) => lines.push(line));
    const failWithSensitiveMessage: RequestHandler = () => {
      throw new Error("Bearer secret-token user@example.com");
    };

    const response = await request(
      appWith(testConfig(), failWithSensitiveMessage, logger)
    )
      .get("/api/auth/session?token=query-secret")
      .set("Authorization", "Bearer header-secret");

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("validation_error");
    const serialized = lines.join("\n");
    expect(serialized).not.toContain("header-secret");
    expect(serialized).not.toContain("query-secret");
  });

  it("returns a safe 500 response for unexpected middleware failures", async () => {
    const lines: string[] = [];
    const logger = createJsonLogger((line) => lines.push(line));
    const failWithSensitiveMessage: RequestHandler = () => {
      throw new Error("Bearer secret-token user@example.com");
    };

    const response = await request(
      appWith(testConfig(), failWithSensitiveMessage, logger)
    ).get("/api/auth/session");

    expect(response.status).toBe(500);
    expect(response.body.error.code).toBe("internal_error");
    expect(response.body.error.requestId).toBe(response.headers["x-request-id"]);
    const serialized = lines.join("\n");
    expect(serialized).toContain('"event":"request_failed"');
    expect(serialized).not.toContain("secret-token");
    expect(serialized).not.toContain("user@example.com");
  });
});
