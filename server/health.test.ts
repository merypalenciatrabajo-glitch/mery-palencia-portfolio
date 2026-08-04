import type { Auth } from "firebase-admin/auth";
import { describe, expect, it, vi } from "vitest";
import type { ServerConfig } from "./config";
import { createFirebaseReadinessCheck } from "./health";

const config = {
  healthCheck: { firebaseTimeoutMs: 1_000, cacheMs: 30_000 },
} as ServerConfig;

describe("Firebase readiness check", () => {
  it("verifies Firebase Auth and caches successful checks", async () => {
    const listUsers = vi.fn().mockResolvedValue({ users: [] });
    const check = createFirebaseReadinessCheck(config, () => ({
      listUsers,
    }) as unknown as Auth);

    await expect(check()).resolves.toMatchObject({ status: "ready" });
    await expect(check()).resolves.toMatchObject({ status: "ready" });
    expect(listUsers).toHaveBeenCalledTimes(1);
  });

  it("does not cache dependency failures", async () => {
    const listUsers = vi
      .fn()
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce({ users: [] });
    const check = createFirebaseReadinessCheck(config, () => ({
      listUsers,
    }) as unknown as Auth);

    await expect(check()).rejects.toThrow("offline");
    await expect(check()).resolves.toMatchObject({ status: "ready" });
    expect(listUsers).toHaveBeenCalledTimes(2);
  });
});
