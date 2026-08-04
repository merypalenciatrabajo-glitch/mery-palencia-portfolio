import type { RequestHandler } from "express";
import type { DecodedIdToken } from "firebase-admin/auth";
import { z } from "zod";
import { getFirebaseAdminAuth } from "./firebase-admin.js";
import { sendApiError } from "./api-errors.js";

declare global {
  namespace Express {
    interface Request {
      firebaseUser?: DecodedIdToken;
    }
  }
}

export class HttpAuthError extends Error {
  constructor(
    public readonly status: 401 | 403,
    public readonly code: "missing_token" | "invalid_token" | "forbidden"
  ) {
    super(code);
  }
}

const bearerAuthorizationSchema = z
  .string()
  .trim()
  .regex(/^Bearer\s+[^\s]+$/i);

export function extractBearerToken(authorization: string | undefined) {
  const parsed = bearerAuthorizationSchema.safeParse(authorization);
  if (!parsed.success) return null;

  const match = parsed.data.match(/^Bearer\s+([^\s]+)$/i);
  return match?.[1] ?? null;
}

export function hasContentRole(token: DecodedIdToken) {
  return (
    token.admin === true ||
    token.role === "admin" ||
    token.role === "editor"
  );
}

export async function verifyAuthorizationHeader(
  authorization: string | undefined,
  verifyToken: (token: string) => Promise<DecodedIdToken>
) {
  const token = extractBearerToken(authorization);
  if (!token) throw new HttpAuthError(401, "missing_token");

  try {
    return await verifyToken(token);
  } catch {
    throw new HttpAuthError(401, "invalid_token");
  }
}

export const requireFirebaseAuth: RequestHandler = async (req, res, next) => {
  let adminAuth;
  try {
    adminAuth = getFirebaseAdminAuth();
  } catch {
    sendApiError(res, 503, "auth_unavailable");
    return;
  }

  try {
    req.firebaseUser = await verifyAuthorizationHeader(
      req.header("authorization"),
      (token) => adminAuth.verifyIdToken(token, true)
    );
    next();
  } catch (error) {
    const authError = error as HttpAuthError;
    sendApiError(
      res,
      authError.status ?? 401,
      authError.code ?? "invalid_token"
    );
  }
};

export const requireContentRole: RequestHandler = (req, res, next) => {
  if (!req.firebaseUser || !hasContentRole(req.firebaseUser)) {
    sendApiError(res, 403, "forbidden");
    return;
  }

  next();
};
