import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["quality/firebase/firebase.rules.verification.ts"],
    testTimeout: 15_000,
    hookTimeout: 15_000,
  },
});
