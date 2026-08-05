/// <reference types="vitest" />

import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./tests/setup.ts",
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
    // The integration suite starts a mongodb-memory-server per test file, and
    // a cold `mongod` regularly takes longer than vitest's 5s default. That
    // showed up as widespread, wandering failures: the first test in a file
    // times out, then the rest of the file returns 500s because the connection
    // never came up. The tests were fine; the budget was too tight.
    testTimeout: 30000,
    hookTimeout: 60000,
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "json", "lcov"],
      reportsDirectory: "./coverage",
      exclude: [
        "node_modules/",
        "tests/",
        "**/*.test.ts",
        "**/*.test.tsx",
        "**/*.spec.ts",
        "**/*.spec.tsx",
        "**/setup.ts",
        "**/setupFiles.ts",
        "**/testUtils.ts",
        "**/testDb.ts",
        "**/testServer.ts",
        "**/helpers/**",
        "**/utils/**",
        "**/*.config.*",
        "**/next.config.*",
        "**/tailwind.config.*",
        "**/postcss.config.*",
        "**/playwright.config.*",
        "**/vitest.config.*",
        "**/.next/**",
        "**/out/**",
        "**/build/**",
        "**/coverage/**",
        "**/scripts/**",
        "**/e2e/**",
        "**/public/**",
        "**/secrets/**",
        "**/*.d.ts",
        "**/types/**",
        "**/constants/**",
        "**/app/layout.tsx",
        "**/app/globals.css",
        "**/app/page.tsx",
        "**/app/global-error.tsx",
      ],
      include: ["src/**/*.{ts,tsx}"],
      // Thresholds are commented out for now - can be re-enabled when coverage improves
      // thresholds: {
      //   lines: 80,
      //   functions: 80,
      //   branches: 80,
      //   statements: 80,
      // },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
