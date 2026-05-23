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
- **Feed** → +`feedFullnessGain` Fullness, +`feedCoinReward` coins; cooldown: `FEED_COOLDOWN_MINUTES`
- **Play** → +`playMoodGain` Mood, +`playCoinReward` coins; cooldown: `PLAY_COOLDOWN_MINUTES`
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
User             — id, email, passwordHash, name?, coins, createdAt
Pokemon          — id, pokeApiId*, name, description, price,
                   fullnessDecayPerHour, moodDecayPerHour,
                   feedFullnessGain, feedCoinReward,
                   playMoodGain, playCoinReward
UserPokemon      — id, userId†, pokemonId, currentFullness, currentMood,
                   isActive, faintedAt?, lastFedAt?, lastPlayedAt?,
                   lastCalculatedAt, acquiredAt
                   @@index([userId]), @@index([userId, isActive])
UserPokemonBadge — id, userPokemonId, badge (BadgeType), earnedAt
                   @@unique([userPokemonId, badge])
BadgeType enum   — STREAK_1D, STREAK_7D, STREAK_30D, STREAK_90D, STREAK_365D
```

\* `@unique` † indexed

Pokémon sprite URL: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/{pokeApiId}.png`

`next/image` requires `raw.githubusercontent.com` in `remotePatterns` inside `apps/web/next.config.ts`.

## packages/core — Game Logic Functions

All functions are pure (no DB, no side effects). Called from API route handlers in `apps/web`.

- `calculateElapsedHours(from, to)` — Returns hours between two dates.
  Called as the first step in every handler that reads a UserPokemon.

- `applyDecay(currentValue, decayPerHour, elapsedHours)` — Applies decay to one state value (fullness OR mood), clamped [0,100]. Caller invokes twice, once per state.
  Called after `calculateElapsedHours`, before saving.

- `hasFainted(fullness, mood)` — Returns `true` when both states are 0.
  Called after applying decay; if true → set `isActive=false`, `faintedAt=now`.

- `calculateHeart(fullness, mood)` — Returns `(HEART_WEIGHTS.fullness × f) + (HEART_WEIGHTS.mood × m)`.
  Called on every GET response — computed, never stored.

- `checkCooldown(lastActionAt, cooldownMinutes, now)` — Returns `{ allowed, remainingSeconds }`. Caller passes the right `lastActionAt` and cooldown value.
  Feed route uses `lastFedAt`; Play uses `lastPlayedAt`.

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
3. Compute `checkCooldown(lastFedAt, ...)` and `checkCooldown(lastPlayedAt, ...)` — include in response for countdown timers
4. Return enriched data

### POST /api/my-pokemons/[id]/feed

1. Run shared sync steps → **400** if fainted
2. `checkCooldown(lastFedAt, FEED_COOLDOWN_MINUTES, now)` → **400** with `remainingSeconds` if blocked
3. `newFullness = applyFeed(currentFullness, feedFullnessGain)`
4. Add `feedCoinReward` to `user.coins`
5. `newMilestones = checkMilestones(acquiredAt, faintedAt, existingBadges, MILESTONE_CONFIG)`
6. For each in `newMilestones`: create `UserPokemonBadge` row, add `milestone.coinReward` to `user.coins`
7. Set `lastFedAt=now`, save `UserPokemon` + `User` in DB transaction
8. Return updated state + `newMilestones` (UI shows badge popup)

### POST /api/my-pokemons/[id]/play

Same as Feed — substitute `lastPlayedAt`, `PLAY_COOLDOWN_MINUTES`, `applyPlay`, `playMoodGain`, `playCoinReward`

### POST /api/shop/buy/[pokemonId]

1. Load Pokemon + `user.coins`
2. If `user.coins < pokemon.price` → **400**
3. Deduct `pokemon.price` from `user.coins`
4. Create `UserPokemon`: `currentFullness=INITIAL_FULLNESS`, `currentMood=INITIAL_MOOD`, `lastCalculatedAt=now`, `acquiredAt=now`
5. Save `User` + `UserPokemon` in DB transaction → return new UserPokemon

### Client polling (every `NEXT_PUBLIC_POLLING_INTERVAL_MINUTES` + `refetchOnWindowFocus`)

Calls `GET /api/my-pokemons` — server handles all state sync, client just re-renders

## Env Vars

```env
# Server
DATABASE_URL=
AUTH_SECRET=
INITIAL_COINS=500
INITIAL_FULLNESS=60
INITIAL_MOOD=60
FEED_COOLDOWN_MINUTES=30
PLAY_COOLDOWN_MINUTES=30

# Client (NEXT_PUBLIC_ prefix required)
NEXT_PUBLIC_POLLING_INTERVAL_MINUTES=5
```

## Implementation Progress

- [x] Phase 1: Database setup — `packages/database` Prisma schema (User model) + client singleton + seed
- [x] Phase 2: Auth — Auth.js v5, login/register/logout pages, middleware
- [ ] Phase 3: Game logic — `packages/config` milestones + `packages/core` pure functions + unit tests
- [ ] Phase 4: API routes — buy, feed, play, list + remaining Prisma models
- [ ] Phase 5: UI — collection page, Pokémon detail, shop
- [ ] Phase 6: Client polling

## Dev Workflow

Unit and component tests are colocated with their source as `*.test.ts` /
`*.test.tsx`. Component tests use React Testing Library and need a
`// @vitest-environment jsdom` docblock at the top of the file. Integration
tests live in `apps/web/tests/integration/`. E2E specs live in
`apps/web/tests/e2e/`.

### Per-change checks (definition of done)

Run after any code change. All must pass before considering it done.

```bash
pnpm --filter @my-pokemons/web test           # unit + component tests (Vitest)
pnpm lint                                      # lint all packages
pnpm format:check                              # formatting
pnpm build                                     # full build
```

When test files change, also verify coverage (90% threshold is enforced):

```bash
pnpm --filter @my-pokemons/web test:coverage
```

### Integration tests — run when DB logic changes

```bash
DATABASE_URL_TEST=postgresql://postgres:postgres@localhost:5432/my_pokemons_test \
  pnpm --filter @my-pokemons/web test:integration
```

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
