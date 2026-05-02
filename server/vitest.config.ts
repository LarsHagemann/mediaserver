import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    pool: "forks",
    include: ["src/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      exclude: ["src/**/*.test.ts", "src/index.ts"],
    },
    testTimeout: 60000,
    hookTimeout: 120000,
    onConsoleLog: () => false,
  },
  resolve: {
    conditions: ["node", "import", "module", "default"],
  },
});
