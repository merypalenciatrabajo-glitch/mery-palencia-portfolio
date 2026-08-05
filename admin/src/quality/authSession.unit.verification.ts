import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const firebaseSource = readFileSync(
  resolve(__dirname, "../lib/firebase.ts"),
  "utf8"
);
const authContextSource = readFileSync(
  resolve(__dirname, "../contexts/AuthContext.tsx"),
  "utf8"
);
const sidebarSource = readFileSync(
  resolve(__dirname, "../components/Sidebar.tsx"),
  "utf8"
);

describe("admin authentication lifecycle", () => {
  it("persists Firebase sessions using durable browser storage", () => {
    expect(firebaseSource).toContain("initializeAuth");
    expect(firebaseSource).toContain("indexedDBLocalPersistence");
    expect(firebaseSource).toContain("browserLocalPersistence");
  });

  it("restores auth state and observes refreshed ID tokens", () => {
    expect(authContextSource).toContain("onIdTokenChanged");
    expect(authContextSource).toMatch(/setLoading\(false\)/);
  });

  it("revalidates the current user when the native app becomes active", () => {
    expect(authContextSource).toContain('addListener("appStateChange"');
    expect(authContextSource).toContain("currentUser.reload()");
    expect(authContextSource).toContain("currentUser.getIdTokenResult(true)");
  });

  it("centralizes logout and reports failures to the user", () => {
    expect(authContextSource).toContain("logout: () => Promise<void>");
    expect(sidebarSource).toContain("await logout()");
    expect(sidebarSource).toContain('role="alert"');
    expect(sidebarSource).toContain("Cerrando sesión...");
  });
});
