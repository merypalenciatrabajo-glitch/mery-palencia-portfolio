import { describe, expect, it } from "vitest";
import { getSignInErrorMessage } from "@/lib/authErrors";

describe("administrator sign-in errors", () => {
  it("distinguishes connectivity and throttling failures", () => {
    expect(getSignInErrorMessage({ code: "auth/network-request-failed" })).toContain(
      "No hay conexión",
    );
    expect(getSignInErrorMessage({ code: "auth/too-many-requests" })).toContain(
      "Demasiados intentos",
    );
  });

  it("keeps credential failures generic to avoid account enumeration", () => {
    const invalid = getSignInErrorMessage({ code: "auth/invalid-credential" });
    const disabled = getSignInErrorMessage({ code: "auth/user-disabled" });

    expect(invalid).toBe(disabled);
    expect(invalid).not.toContain("usuario");
  });
});
