import type { DecodedIdToken } from "firebase-admin/auth";
import { describe, expect, it, vi } from "vitest";
import {
  extractBearerToken,
  hasContentRole,
  HttpAuthError,
  verifyAuthorizationHeader,
} from "./auth";

const token = (claims: Partial<DecodedIdToken> = {}) =>
  ({ uid: "user-1", ...claims }) as DecodedIdToken;

describe("Firebase bearer authentication", () => {
  it("extracts only a well-formed Bearer token", () => {
    expect(extractBearerToken("Bearer valid-token")).toBe("valid-token");
    expect(extractBearerToken("bearer valid-token")).toBe("valid-token");
    expect(extractBearerToken("Basic value")).toBeNull();
    expect(extractBearerToken("Bearer two tokens")).toBeNull();
  });

  it("verifies the supplied token without exposing it", async () => {
    const verifier = vi.fn().mockResolvedValue(token({ role: "admin" }));
    const result = await verifyAuthorizationHeader(
      "Bearer secret-token",
      verifier
    );

    expect(verifier).toHaveBeenCalledWith("secret-token");
    expect(result.uid).toBe("user-1");
  });

  it("rejects missing and invalid tokens consistently", async () => {
    await expect(
      verifyAuthorizationHeader(undefined, vi.fn())
    ).rejects.toMatchObject<HttpAuthError>({
      status: 401,
      code: "missing_token",
    });

    await expect(
      verifyAuthorizationHeader("Bearer invalid", vi.fn().mockRejectedValue(new Error()))
    ).rejects.toMatchObject<HttpAuthError>({
      status: 401,
      code: "invalid_token",
    });
  });

  it("accepts only admin-compatible content roles", () => {
    expect(hasContentRole(token({ admin: true }))).toBe(true);
    expect(hasContentRole(token({ role: "admin" }))).toBe(true);
    expect(hasContentRole(token({ role: "editor" }))).toBe(true);
    expect(hasContentRole(token({ role: "viewer" }))).toBe(false);
    expect(hasContentRole(token())).toBe(false);
  });
});
