import type { Auth } from "firebase-admin/auth";
import type { ServerConfig } from "./config.js";
import { getFirebaseAdminAuth } from "./firebase-admin.js";

export interface ReadinessResult {
  status: "ready";
  dependencies: {
    firebaseAuth: "ok";
  };
}

export type ReadinessCheck = () => Promise<ReadinessResult>;

function withTimeout<T>(promise: Promise<T>, timeoutMs: number) {
  return new Promise<T>((resolve, reject) => {
    const timeout = setTimeout(
      () => reject(new Error("Firebase health check timed out")),
      timeoutMs
    );
    timeout.unref();

    promise.then(
      (value) => {
        clearTimeout(timeout);
        resolve(value);
      },
      (error) => {
        clearTimeout(timeout);
        reject(error);
      }
    );
  });
}

export function createFirebaseReadinessCheck(
  config: ServerConfig,
  getAuth: () => Auth = getFirebaseAdminAuth
): ReadinessCheck {
  let cached:
    | { expiresAt: number; promise: Promise<ReadinessResult> }
    | undefined;

  return () => {
    const now = Date.now();
    if (cached && cached.expiresAt > now) return cached.promise;

    const promise = withTimeout(
      getAuth().listUsers(1),
      config.healthCheck.firebaseTimeoutMs
    ).then(() => ({
      status: "ready" as const,
      dependencies: { firebaseAuth: "ok" as const },
    }));

    cached = {
      expiresAt: now + config.healthCheck.cacheMs,
      promise,
    };
    promise.catch(() => {
      if (cached?.promise === promise) cached = undefined;
    });
    return promise;
  };
}
