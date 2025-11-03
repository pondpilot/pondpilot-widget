import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup.js"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "dist/**",
        "examples/**",
        "node_modules/**",
        "tests/**",
        "build.js",
        "vite.config.*",
      ],
    },
    restoreMocks: true,
    clearMocks: true,
  },
});
