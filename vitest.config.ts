import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    globals: true,
    environment: "happy-dom",
    setupFiles: ["./src/test/setup.ts"],
    include: [
      "src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
      "tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
    ],
    exclude: [
      "node_modules",
      "dist",
      "src/test/rateLimiter.test.ts",
      "coverage",
    ],
    // Coverage configuration
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      reportsDirectory: "./coverage",
      exclude: [
        "node_modules/**",
        "src/test/**",
        "**/*.d.ts",
        "**/*.config.*",
        "**/index.ts",
        "src/main.tsx",
        "src/vite-env.d.ts",
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 70,
        statements: 80,
        // Enforce thresholds (fail CI if not met)
        perFile: true,
      },
    },
    // Test timeouts
    testTimeout: 10000,
    hookTimeout: 10000,
    // reporters
    reporters: ["default", "hanging-process"],
    // Collapsed single line for CI
    silent: false,
    // Fake timers configuration
    fakeTimers: {
      toFake: ["setTimeout", "setInterval"],
    },
  },
  // Optimize dependencies
  optimizeDeps: {
    include: ["vitest", "@vitest/coverage-v8"],
  },
});
