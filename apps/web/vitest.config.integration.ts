import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "node",
    fileParallelism: false,
    alias: { "@": resolve(__dirname, "src") },
    include: ["tests/integration/**/*.test.ts"],
    setupFiles: ["./src/test/setup.ts"],
    env: {
      DATABASE_URL:
        process.env.DATABASE_URL_TEST ??
        "postgresql://postgres:postgres@localhost:5432/my_pokemons_test",
    },
  },
});
