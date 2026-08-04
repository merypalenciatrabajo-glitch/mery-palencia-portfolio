import express, { type RequestHandler } from "express";
import path from "node:path";
import {
  createErrorHandler,
  sendApiError,
  sendApiSuccess,
} from "./api-errors.js";
import { requireContentRole, requireFirebaseAuth } from "./auth.js";
import { loadServerConfig, type ServerConfig } from "./config.js";
import { createJsonLogger, silentLogger, type AppLogger } from "./logger.js";
import { createRequestContext } from "./request-context.js";
import {
  createApiRateLimiter,
  createAuthRateLimiter,
  createCorsHandlers,
} from "./security.js";
import { validateEmptyQuery } from "./validation.js";
import { createSecurityHeaders } from "./security-headers.js";
import {
  createFirebaseReadinessCheck,
  type ReadinessCheck,
} from "./health.js";

interface CreateAppOptions {
  config?: ServerConfig;
  staticPath: string;
  authMiddleware?: RequestHandler;
  roleMiddleware?: RequestHandler;
  logger?: AppLogger;
  readinessCheck?: ReadinessCheck;
}

export function createApp({
  config = loadServerConfig(),
  staticPath,
  authMiddleware = requireFirebaseAuth,
  roleMiddleware = requireContentRole,
  logger = config.nodeEnv === "test" ? silentLogger : createJsonLogger(),
  readinessCheck = createFirebaseReadinessCheck(config),
}: CreateAppOptions) {
  const app = express();
  app.disable("x-powered-by");

  if (config.trustProxyHops > 0) {
    app.set("trust proxy", config.trustProxyHops);
  }

  app.use(createRequestContext(logger));
  app.use(createSecurityHeaders(config));

  app.use("/api", ...createCorsHandlers(config.allowedOrigins));
  app.use(
    "/api",
    createApiRateLimiter(config),
    express.json({ limit: "16kb", strict: true })
  );

  const sendLiveness = (_req: express.Request, res: express.Response) => {
    sendApiSuccess(res, 200, {
      status: "ok",
      service: "mery-palencia-portfolio",
      uptimeSeconds: Math.floor(process.uptime()),
    });
  };
  app.get("/api/health", validateEmptyQuery, sendLiveness);
  app.get("/api/health/live", validateEmptyQuery, sendLiveness);
  app.get("/api/health/ready", validateEmptyQuery, (_req, res) => {
    void readinessCheck().then(
      (result) => sendApiSuccess(res, 200, result),
      () => sendApiError(res, 503, "service_unavailable")
    );
  });

  app.get(
    "/api/auth/session",
    createAuthRateLimiter(config),
    validateEmptyQuery,
    authMiddleware,
    roleMiddleware,
    (req, res) => {
      const user = req.firebaseUser!;
      sendApiSuccess(res, 200, {
        uid: user.uid,
        email: user.email ?? null,
        role:
          user.role === "admin" || user.role === "editor"
            ? user.role
            : "admin",
      });
    }
  );

  app.use("/api", (_req, res) => {
    sendApiError(res, 404, "not_found");
  });

  app.use(express.static(staticPath));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(staticPath, "index.html"));
  });

  app.use(createErrorHandler(logger));

  return app;
}
