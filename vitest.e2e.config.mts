import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: ["tests/e2e/**/*.test.mts"],
    globalSetup: "./tests/e2e/global-setup.mjs",
    testTimeout: 60_000,
    hookTimeout: 120_000,
    fileParallelism: false,
  },
  resolve: {
    alias: { "@app": path.resolve(__dirname, "app") },
  },
});
