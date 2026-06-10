import { defineConfig } from "vitest/config";

// Coverage-only config: runs the unit and integration projects together so the
// 90% perFile gate measures DB-orchestration files (covered by integration)
// alongside the pure-logic files (covered by unit). Requires the test Postgres.
export default defineConfig({
  test: {
    projects: ["./vitest.config.ts", "./vitest.config.integration.ts"],
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
        "src/app/\\(app\\)/layout.tsx",
        "src/app/\\(app\\)/page.tsx",
        "src/app/\\(app\\)/collection/page.tsx",
        "src/app/\\(app\\)/shop/page.tsx",
        "src/app/\\(app\\)/collection/\\[id\\]/page.tsx",
        "src/app/\\(auth\\)/layout.tsx",
      ],
      thresholds: {
        lines: 90,
        functions: 90,
        branches: 90,
        perFile: true,
      },
    },
  },
});
