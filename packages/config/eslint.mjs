export const baseRules = {
  "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
  "@typescript-eslint/no-explicit-any": "error",
  "@typescript-eslint/consistent-type-imports": [
    "error",
    { prefer: "type-imports" },
  ],
  "react/self-closing-comp": "error",
  "react/jsx-curly-brace-presence": [
    "error",
    { props: "never", children: "never" },
  ],
  "react/no-array-index-key": "warn",
  "no-console": ["warn", { allow: ["warn", "error"] }],
  "prefer-const": "error",
  "no-var": "error",
  eqeqeq: ["error", "always"],
  curly: ["error", "all"],
};
