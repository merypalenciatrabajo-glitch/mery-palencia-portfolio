import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/firebase.live.test.ts"],
    testTimeout: 15_000,
    hookTimeout: 15_000,
    maxWorkers: 1,
  },
});
