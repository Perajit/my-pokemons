# What This Is

A web-based Pokémon petting game. Users buy Pokémon with coins, keep them alive by feeding and playing with them, and earn coins and badges for keeping them active.

## Monorepo Structure

```
apps/web/          — Next.js 16, App Router, TypeScript, Tailwind (main app)
packages/config/   — shared ESLint rules, TypeScript base config, milestone constants
packages/core/     — pure game logic functions (no DB, no framework deps)
packages/database/ — Prisma schema + client singleton, exported as @my-pokemons/database
```

Tooling: pnpm workspaces + Turborepo.

## Tech Stack

- **Framework**: Next.js 16, React 19
- **Auth**: Auth.js v5 (NextAuth), Credentials provider, JWT sessions, no Prisma adapter
- **DB**: Prisma + PostgreSQL (`docker-compose.yml` at repo root for local dev)
- **Client fetching**: SWR or TanStack Query
- **Styling**: Tailwind CSS v4 + shadcn/ui — Radix-based components in `apps/web/src/components/ui`, `cn` helper in `src/lib/utils.ts`; add components with `pnpm dlx shadcn@latest add <name>`
- **Fonts**: Nunito (body / `--font-sans`), Fredoka (headings / `--font-heading`) via `next/font/google`
- **Testing**: Vitest + React Testing Library (unit/component), Playwright (E2E)

## Game Mechanics

- User starts with `INITIAL_COINS` (env, default 500)
- Each Pokémon has **Fullness** and **Mood** (0–100, float)
- **Heart** = (0.6 × Fullness) + (0.4 × Mood) — derived, never stored; no clamping needed since inputs are already clamped
- Fullness and Mood decay at `fullnessDecayPerHour` / `moodDecayPerHour` (Float, per hour)
- Decay is **lazy**: computed on every API read using elapsed time from `lastCalculatedAt`
- When both Fullness and Mood reach 0 → Pokémon faints: `isActive=false`, `faintedAt=now`
- Fainted Pokémon are view-only — Feed and Play are blocked
- If `!isActive` on API read → skip decay calculation entirely, return as-is
- **Feed** → +`feedFullnessGain` Fullness, +`feedCoinReward` coins; cooldown: `FEED_COOLDOWN_SECONDS`
- **Play** → +`playMoodGain` Mood, +`playCoinReward` coins; cooldown: `PLAY_COOLDOWN_SECONDS`
- All stat values clamped to [0, 100] after any mutation
- **activeStreak** = `floor((now − acquiredAt) / 24h)` if active; `floor((faintedAt − acquiredAt) / 24h)` if fainted — derived, not stored

## Milestone Badges (`packages/config/src/milestones.ts`)

Awarded per Pokémon for consecutive active days. `BadgeType` enum is Prisma-generated — imported from `@my-pokemons/database`, not redefined.

```ts
// BadgeType enum defined in Prisma schema (packages/database)
// BADGE_LABELS is a const (not enum — TS enums don't support computed keys)
export const BADGE_LABELS = {
  [BadgeType.STREAK_1D]: "New Friend",
  [BadgeType.STREAK_7D]: "Close Friend",
  [BadgeType.STREAK_30D]: "Best Friend",
  [BadgeType.STREAK_90D]: "True Companion",
  [BadgeType.STREAK_365D]: "Lifetime Companion",
} as const satisfies Record<BadgeType, string>;

type MilestoneConfig = { badge: BadgeType; days: number; coinReward: number };

export const MILESTONE_CONFIG: MilestoneConfig[] = [
  { badge: BadgeType.STREAK_1D, days: 1, coinReward: 5 },
  { badge: BadgeType.STREAK_7D, days: 7, coinReward: 15 },
  { badge: BadgeType.STREAK_30D, days: 30, coinReward: 40 },
  { badge: BadgeType.STREAK_90D, days: 90, coinReward: 100 },
  { badge: BadgeType.STREAK_365D, days: 365, coinReward: 300 },
];

export const HEART_WEIGHTS = { fullness: 0.6, mood: 0.4 } as const;
```

## Data Model

Schema lives in `packages/database/prisma/schema.prisma`.

```
User             — id, email, passwordHash, name?, coins (default 500), createdAt
Pokemon          — id, pokeApiId*, name, description, price,
                   fullnessDecayPerHour, moodDecayPerHour,
                   feedFullnessGain, feedCoinReward,
                   playMoodGain, playCoinReward
UserPokemon      — id, userId†, pokemonId,
                   currentFullness (default 60), currentMood (default 60),
                   isActive, faintedAt?, lastFedAt?, lastPlayedAt?,
                   lastCalculatedAt (default now), acquiredAt (default now)
                   @@index([userId]), @@index([userId, isActive])
UserPokemonBadge — id, userPokemonId, badge (BadgeType), earnedAt
                   @@unique([userPokemonId, badge])
BadgeType enum   — STREAK_1D, STREAK_7D, STREAK_30D, STREAK_90D, STREAK_365D
```

\* `@unique` † indexed

Pokémon sprite URL: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/{pokeApiId}.png`

`next/image` requires `raw.githubusercontent.com` in `remotePatterns` inside `apps/web/next.config.ts`.

## packages/core — Game Logic Functions

All functions are pure (no DB, no side effects). Called from API route handlers and services in `apps/web`.

- `calculateElapsedHours(from, to)` — Returns hours between two dates.
  Called as the first step in every handler that reads a UserPokemon.

- `applyDecay(currentValue, decayPerHour, elapsedHours)` — Applies decay to one state value (fullness OR mood), clamped [0,100]. Caller invokes twice, once per state.
  Called after `calculateElapsedHours`, before saving.

- `hasFainted(fullness, mood)` — Returns `true` when both states are 0.
  Called after applying decay; if true → set `isActive=false`, `faintedAt=now`.

- `calculateHeart(fullness, mood)` — Returns `(HEART_WEIGHTS.fullness × f) + (HEART_WEIGHTS.mood × m)`.
  Called on every GET response — computed, never stored.

- `isOnCooldown(lastActionAt, cooldownSeconds, now)` — Returns `true` while `lastActionAt + cooldownSeconds` is still in the future. Null `lastActionAt` → never on cooldown.

- `cooldownEndsAt(lastActionAt, cooldownSeconds)` — Returns the absolute `Date` when the cooldown ends, or `null` if `lastActionAt` is null. Returned to the client so it can compute remaining time from `Date.now()` each tick (avoids drift).

- `applyFeed(currentFullness, feedFullnessGain)` — Adds gain to fullness, clamped [0,100].
  Called in the Feed route, after cooldown passes.

- `applyPlay(currentMood, playMoodGain)` — Adds gain to mood, clamped [0,100].
  Called in the Play route, after cooldown passes.

- `checkMilestones(acquiredAt, faintedAt, existingBadges, config)` — Computes `activeDays`, returns `MilestoneConfig[]` for newly unlocked milestones not yet in `existingBadges`. Caller creates badge rows and credits coins.
  Called in Feed/Play routes only.

## API Event Flows

### Shared sync steps (runs at the start of every handler that reads a UserPokemon)

1. Load `UserPokemon` from DB
2. If `!isActive` → return early, skip all computation
3. `elapsed = calculateElapsedHours(lastCalculatedAt, now)`
4. `newFullness = applyDecay(currentFullness, fullnessDecayPerHour, elapsed)`
5. `newMood = applyDecay(currentMood, moodDecayPerHour, elapsed)`
6. If `hasFainted(newFullness, newMood)` → set `isActive=false`, `faintedAt=now`
7. Save updated state + `lastCalculatedAt=now` to DB

### GET /api/my-pokemons or /api/my-pokemons/[id]

1. Run shared sync steps (for all or one UserPokemon)
2. Compute `calculateHeart(fullness, mood)` and `activeDays` for response
3. Compute `cooldownEndsAt` for feed and play from `lastFedAt`/`lastPlayedAt` + cooldown minutes — client computes remaining seconds from `Date.now()` to avoid timer drift
4. Return enriched data

### feedAction / playAction — server actions

Business logic in `src/services/pokemon.ts`. Same pattern as `buyPokemonAction`.

**feedAction(userPokemonId)**
1. Run shared sync steps → throw `FaintedError` if fainted
2. `checkCooldown(lastFedAt, FEED_COOLDOWN_SECONDS, now)` → throw `CooldownError` if blocked
3. `newFullness = applyFeed(currentFullness, feedFullnessGain)`
4. Add `feedCoinReward` to `user.coins`
5. `newMilestones = checkMilestones(...)` — wired up in milestones phase; skip for now
6. Set `lastFedAt=now`, save `UserPokemon` + `User` in DB transaction
7. `revalidatePath("/", "layout")` — refreshes coin balance
8. Return `{ ok: true }` or `{ ok: false; error: string }`

**playAction(userPokemonId)** — same pattern; substitute `lastPlayedAt`, `PLAY_COOLDOWN_SECONDS`, `applyPlay`, `playMoodGain`, `playCoinReward`

Note: cooldown is returned as `cooldownEndsAt: Date | null` (not `remainingSeconds`) so the client computes remaining time from `Date.now()` on each tick — prevents drift across background tabs and slow networks.

### buyPokemonAction — shop buy

Server action in `src/app/(app)/shop/actions.ts`; business logic in `src/services/shop.ts`.

1. `auth()` → return `{ ok: false, error: "Unauthorized" }` if no session
2. `db.pokemon.findUnique` → throw `NotFoundError` if not found
3. Open interactive transaction:
   - `tx.user.updateMany({ where: { id: userId, coins: { gte: price } } })` — atomically checks and deducts coins in one statement (prevents race condition)
   - If `count === 0` → throw `InsufficientCoinsError` (tx rolls back, no `UserPokemon` created)
   - `tx.userPokemon.create` — defaults apply: `currentFullness=60`, `currentMood=60`, `lastCalculatedAt=now`, `acquiredAt=now`
4. `revalidatePath("/", "layout")` — refreshes coin balance across all pages
5. Return `{ ok: true }` or `{ ok: false; error: string }`

### Client polling (every `NEXT_PUBLIC_POLLING_INTERVAL_SECONDS` + `refetchOnWindowFocus`)

Calls `GET /api/my-pokemons` — server handles all state sync, client just re-renders

## Env Vars

Two-file convention, following Next.js:
- `apps/web/.env` — **committed**, non-sensitive defaults so the app works out of the box
- `apps/web/.env.local` — **gitignored**, per-developer overrides (secrets, dev-only knobs). Loaded after `.env` so it overrides. Not loaded in `NODE_ENV=test`.
- Root `.gitignore` ignores `.env` globally (to protect `packages/database/.env` which contains the DB credentials). `apps/web/.gitignore` re-includes `.env` with `!.env`.

Time-based env vars use **seconds** (not minutes) so any timer can be cranked down to single-digit values for manual verification.

```env
# apps/web/.env (committed defaults)
NEXT_PUBLIC_POLLING_INTERVAL_SECONDS=300   # 5 min
FEED_COOLDOWN_SECONDS=1800                  # 30 min
PLAY_COOLDOWN_SECONDS=1200                  # 20 min

# apps/web/.env.local (per-developer, secret/override)
DATABASE_URL=postgresql://...
AUTH_SECRET=...
# NEXT_PUBLIC_POLLING_INTERVAL_SECONDS=10  # fast polling while developing
```

All env reads use `parseInt(process.env.X ?? "<default>", 10)` so the app works without `.env.local` existing.

Starting values are baked into the schema as `@default` — not env vars:
- `User.coins` → 500
- `UserPokemon.currentFullness` → 60
- `UserPokemon.currentMood` → 60

Can be changed to env vars later if per-environment tuning is needed.

## Implementation Progress

- [x] Auth & DB foundation — User model, Auth.js v5 login/register/logout, middleware
- [x] Shop & Collection — browse Pokémon, buy with coins, view collection
- [x] Gameplay
  - [x] Decay system — fullness/mood/heart, lazy sync-on-read, collection card + detail page, SWR polling
  - [x] Feed & Play — server actions, atomic cooldown guard, live countdown, coin rewards
- [ ] Nickname — `UserPokemon.nickname`, defaults to species name at acquire; rename UI on detail page
- [ ] Milestones & badges — streak tracking, coin rewards, `packages/config` + `packages/core`
- [ ] Account management — avatar, profile settings, account menu

## Dev Workflow

Unit and component tests are colocated with their source as `*.test.ts` /
`*.test.tsx`. Component tests use React Testing Library and need a
`// @vitest-environment jsdom` docblock at the top of the file. Integration
tests live in `apps/web/tests/integration/`. E2E specs live in
`apps/web/tests/e2e/`.

### TDD workflow

Write the test first, then the implementation. Skip the "run to see red"
step — go straight to writing the implementation, then run the test once.
The expected-to-fail run wastes a cycle.

### Definition of done

All of the following must pass before an implementation is considered complete.

```bash
pnpm --filter @my-pokemons/web test           # unit + component tests (Vitest)
pnpm lint                                      # lint all packages
pnpm build                                     # full build
```

(Formatting is handled by the pre-commit `lint-staged` hook: `prettier --write`
and `eslint --fix` run on staged files. CI's `pnpm format:check` is the
safety net. No need to run `pnpm format` / `pnpm format:check` manually.)

When test files change, also verify coverage (90% threshold is enforced):

```bash
pnpm --filter @my-pokemons/web test:coverage
```

When services, server actions, auth logic, DB schema, or API routes change, also run integration tests:

```bash
DATABASE_URL_TEST=postgresql://postgres:postgres@localhost:5432/my_pokemons_test \
  pnpm --filter @my-pokemons/web test:integration
```

Integration test files run sequentially (`fileParallelism: false`) because they share one test database and truncate tables in `beforeEach` — parallel execution causes files to delete each other's seed data mid-test.

### E2E — run occasionally, not on every change

Playwright drives a real browser against a real DB, so it is slow. Run it
before finishing a feature, or when auth / routing / page flows change — not
after every edit.

```bash
pnpm dev                                       # terminal 1
pnpm --filter @my-pokemons/web test:e2e        # terminal 2 (Playwright, in tests/e2e/)
```

## Local Dev Setup

```bash
docker compose up -d                                      # start Postgres
pnpm --filter @my-pokemons/database db:sync              # apply schema + generate Prisma client
pnpm dev
```

Both `packages/database/.env` and `apps/web/.env.local` are gitignored. Each developer creates them locally with:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/my_pokemons_dev"
```

`DATABASE_URL` intentionally lives in both files — Prisma CLI reads `packages/database/.env` and Next.js reads `apps/web/.env.local`. Keep them in sync if the connection string ever changes.
