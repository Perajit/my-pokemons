import coreWebVitalsConfig from "eslint-config-next/core-web-vitals";
import typescriptConfig from "eslint-config-next/typescript";
import prettierConfig from "eslint-config-prettier";
import { baseRules } from "@my-pokemons/config/eslint";

const eslintConfig = [
  ...coreWebVitalsConfig,
  ...typescriptConfig,
  prettierConfig,
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },
  {
    rules: baseRules,
  },
];

export default eslintConfig;
