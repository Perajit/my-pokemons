export default {
  "*.{ts,tsx,css,json}": "prettier --write",
  "apps/web/**/*.{ts,tsx}": (files) =>
    `pnpm --filter @my-pokemons/web exec eslint --fix ${files.join(" ")}`,
};
