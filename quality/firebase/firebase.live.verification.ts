import { describe, expect, it } from "vitest";
import { getFirebaseAdminAuth } from "../../server/firebase-admin";

const required = (name: string) => {
  const value = process.env[name];
  if (!value) throw new Error(`Missing live-test variable: ${name}`);
  return value;
};

describe("Firebase Auth live integration", () => {
  it("can reach the configured Firebase Auth project", async () => {
    const result = await getFirebaseAdminAuth().listUsers(1);
    expect(Array.isArray(result.users)).toBe(true);
  });

  it("rejects an actually expired ID token", async () => {
    await expect(
      getFirebaseAdminAuth().verifyIdToken(
        required("FIREBASE_TEST_EXPIRED_ID_TOKEN"),
        true
      )
    ).rejects.toMatchObject({ code: "auth/id-token-expired" });
  });

  it("rejects an actually revoked ID token", async () => {
    await expect(
      getFirebaseAdminAuth().verifyIdToken(
        required("FIREBASE_TEST_REVOKED_ID_TOKEN"),
        true
      )
    ).rejects.toMatchObject({ code: "auth/id-token-revoked" });
  });
});
