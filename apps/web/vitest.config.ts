import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "node",
    alias: { "@": resolve(__dirname, "src") },
    include: ["src/**/*.test.{ts,tsx}"],
    setupFiles: ["./src/test/setup.ts"],
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/**/*.test.{ts,tsx}",
        "src/lib/auth.ts",
        "src/lib/auth-utils.ts",
        "src/lib/db.ts",
        "src/proxy.ts",
        "src/app/api/**",
        "src/test/**",
        "src/components/**",
        "src/app/layout.tsx",
      ],
      thresholds: {
        lines: 90,
        functions: 90,
        branches: 90,
      },
    },
  },
});
