import type { ErrorRequestHandler, Response } from "express";
import type { AppLogger } from "./logger.js";

export type ApiErrorCode =
  | "auth_unavailable"
  | "forbidden"
  | "internal_error"
  | "invalid_json"
  | "invalid_token"
  | "missing_token"
  | "not_found"
  | "origin_not_allowed"
  | "payload_too_large"
  | "rate_limit_exceeded"
  | "service_unavailable"
  | "validation_error";

interface ErrorDetails {
  issues?: Array<{ code: string; path: string }>;
}

export function sendApiError(
  res: Response,
  status: number,
  code: ApiErrorCode,
  details?: ErrorDetails
) {
  res.status(status).json({
    error: {
      code,
      requestId: res.locals.requestId ?? null,
      ...details,
    },
  });
}

export function sendApiSuccess<T>(
  res: Response,
  status: number,
  data: T
) {
  res.status(status).json({
    data,
    meta: {
      requestId: res.locals.requestId ?? null,
    },
  });
}

interface BodyParserError extends Error {
  status?: number;
  type?: string;
}

export function createErrorHandler(logger: AppLogger): ErrorRequestHandler {
  return (error: BodyParserError, req, res, _next) => {
    if (error.type === "entity.too.large") {
      sendApiError(res, 413, "payload_too_large");
      return;
    }

    if (error instanceof SyntaxError && error.status === 400) {
      sendApiError(res, 400, "invalid_json");
      return;
    }

    logger.error("request_failed", {
      requestId: res.locals.requestId ?? null,
      method: req.method,
      path: req.path,
      status: 500,
      errorName: error?.name ?? "UnknownError",
    });
    sendApiError(res, 500, "internal_error");
  };
}
