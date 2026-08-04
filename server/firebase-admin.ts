import {
  applicationDefault,
  cert,
  getApps,
  initializeApp,
  type App,
  type ServiceAccount,
} from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

let adminApp: App | undefined;

function requireString(
  value: unknown,
  name: string
): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`Missing required Firebase Admin setting: ${name}`);
  }

  return value;
}

function readServiceAccountJson(rawValue: string): ServiceAccount {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawValue);
  } catch {
    throw new Error("FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON is not valid JSON");
  }

  if (typeof parsed !== "object" || parsed === null) {
    throw new Error("FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON must contain an object");
  }

  const account = parsed as Record<string, unknown>;
  return {
    projectId: requireString(account.project_id, "project_id"),
    clientEmail: requireString(account.client_email, "client_email"),
    privateKey: requireString(account.private_key, "private_key"),
  };
}

function readServiceAccountFromEnvironment(): ServiceAccount | null {
  const json = process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON;
  if (json) return readServiceAccountJson(json);

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

  if (!projectId && !clientEmail && !privateKey) return null;

  return {
    projectId: requireString(projectId, "FIREBASE_ADMIN_PROJECT_ID"),
    clientEmail: requireString(clientEmail, "FIREBASE_ADMIN_CLIENT_EMAIL"),
    privateKey: requireString(
      privateKey,
      "FIREBASE_ADMIN_PRIVATE_KEY"
    ).replace(/\\n/g, "\n"),
  };
}

export function getFirebaseAdminApp(): App {
  if (!adminApp) {
    const existingApp = getApps()[0];
    if (existingApp) {
      adminApp = existingApp;
    } else {
      const serviceAccount = readServiceAccountFromEnvironment();
      adminApp = initializeApp({
        credential: serviceAccount
          ? cert(serviceAccount)
          : applicationDefault(),
        projectId:
          serviceAccount?.projectId ?? process.env.FIREBASE_ADMIN_PROJECT_ID,
      });
    }
  }

  return adminApp;
}

export function getFirebaseAdminAuth(): Auth {
  return getAuth(getFirebaseAdminApp());
}

export function getFirebaseAdminFirestore(): Firestore {
  return getFirestore(getFirebaseAdminApp());
}
