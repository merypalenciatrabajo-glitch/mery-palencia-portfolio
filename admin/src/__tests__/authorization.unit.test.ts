import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const appSource = readFileSync(resolve(__dirname, "../App.tsx"), "utf8");
const authSource = readFileSync(
  resolve(__dirname, "../contexts/AuthContext.tsx"),
  "utf8"
);
const firestoreRules = readFileSync(
  resolve(__dirname, "../../../firestore.rules"),
  "utf8"
);
const storageRules = readFileSync(
  resolve(__dirname, "../../../storage.rules"),
  "utf8"
);

describe("administrative authorization", () => {
  it("requires a verified content role before rendering protected routes", () => {
    expect(appSource).toContain("if (!isAdmin) return <AccessDenied />");
    expect(authSource).toContain('role === "admin"');
    expect(authSource).toContain('role === "editor"');
    expect(authSource).toContain("token.claims.admin === true");
  });

  it("denies Firestore access by default and protects every write", () => {
    expect(firestoreRules).toContain("allow read, write: if false");
    expect(firestoreRules).not.toMatch(/allow\s+write:\s*if\s+true/);
    for (const validator of [
      "validGallery(request.resource.data)",
      "validBlogPost(request.resource.data)",
      "validCommission(request.resource.data)",
      "validProcessStep(request.resource.data)",
      "validHero(request.resource.data)",
      "validAppVersion(request.resource.data)",
    ]) {
      expect(firestoreRules).toContain(`hasContentRole() && ${validator}`);
    }
    expect(firestoreRules.match(/allow delete: if hasContentRole\(\);/g)).toHaveLength(6);
  });

  it("only exposes published blog posts to unauthenticated readers", () => {
    expect(firestoreRules).toContain(
      "allow read: if hasContentRole() || resource.data.published == true"
    );
  });

  it("requires a content role for every Firebase Storage operation", () => {
    expect(storageRules).toContain("allow read: if hasContentRole()");
    expect(storageRules).toContain("allow create, update: if hasContentRole() &&");
    expect(storageRules).toContain("allow delete: if hasContentRole()");
    expect(storageRules).toContain("request.resource.size < 10 * 1024 * 1024");
    expect(storageRules).toContain("request.resource.contentType.matches('image/.*')");
    expect(storageRules).not.toMatch(/allow\s+(read|write)[^;]*if\s+true/);
  });
});
