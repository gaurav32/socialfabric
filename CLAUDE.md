# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Typecheck all packages
pnpm run typecheck

# Build everything (typecheck + build)
pnpm run build

# Run API server in dev mode
pnpm --filter @workspace/api-server run dev

# Run mobile app (Expo)
pnpm --filter @workspace/mobile run dev

# Push DB schema changes to Postgres (dev only)
pnpm --filter @workspace/db run push

# Regenerate API React Query hooks and Zod schemas from OpenAPI spec
pnpm --filter @workspace/api-spec run codegen

# Typecheck a single package
pnpm --filter @workspace/api-server run typecheck
```

## Architecture

This is a **pnpm workspace monorepo** (Node 24, TypeScript 5.9) with two artifacts and several shared libraries.

### Packages

| Path | Name | Purpose |
|---|---|---|
| `artifacts/api-server` | `@workspace/api-server` | Express 5 REST API |
| `artifacts/mobile` | `@workspace/mobile` | React Native / Expo mobile app |
| `artifacts/mockup-sandbox` | — | Vite+React UI mockup sandbox (not production) |
| `lib/api-spec` | `@workspace/api-spec` | OpenAPI YAML + Orval codegen config |
| `lib/api-client-react` | `@workspace/api-client-react` | Generated React Query hooks + custom fetch |
| `lib/api-zod` | `@workspace/api-zod` | Generated Zod validation schemas |
| `lib/db` | `@workspace/db` | Drizzle ORM schema + PostgreSQL client |
| `scripts` | — | Utility scripts |

### API Codegen Pipeline

The single source of truth for the API contract is `lib/api-spec/openapi.yaml`. Running `codegen` invokes Orval, which generates:
- **React Query hooks** → `lib/api-client-react/src/generated/` (client: `react-query`, mode: `split`)
- **Zod schemas** → `lib/api-zod/src/generated/` (client: `zod`, mode: `split`)

**Critical**: The OpenAPI `info.title` must stay `"Api"` — Orval outputs `api.ts` and the lib re-exports assume that filename. Changing the title breaks all import paths.

After editing `openapi.yaml`, always rerun `codegen` before touching the server or mobile code.

### Custom Fetch (`lib/api-client-react/src/custom-fetch.ts`)

All generated hooks use this module instead of raw `fetch`. It provides two global configuration points called once at app startup in `artifacts/mobile/app/_layout.tsx`:

- `setBaseUrl(url)` — prepends a base URL to all relative API paths (set from `EXPO_PUBLIC_API_URL`)
- `setAuthTokenGetter(fn)` — async getter that returns a Firebase JWT; injected as `Authorization: Bearer <token>` on every request

### Authentication

**Mobile → Server flow:**
1. Mobile uses Firebase Auth (Google OAuth or email). `AuthContext.tsx` wraps the entire app.
2. On every API call, `setAuthTokenGetter` pulls the current Firebase user's ID token and sends it as `Authorization: Bearer`.
3. The API server's `requireUser` middleware (`src/middleware/auth.ts`) reads the Bearer token and sets `req.userId`. It does **not** validate the token against Firebase — it trusts the raw token value as the user ID.

**Google OAuth for native (non-web) platforms:**  
Native can't use Firebase's popup; instead, the mobile app opens the server's `/api/auth/google/start` in a WebBrowser session. The server acts as an OAuth proxy: exchanges the code for tokens, extracts `id_token`, and deep-links back to the app via an Android `intent://` URL. The mobile `Linking` listener catches the deep link and signs in to Firebase with the `id_token`.

**Dev bypass flags:**
- API server: set env var `BYPASS_AUTH=true` → `requireUser` sets `userId = "dev-user"` without checking a token.
- Mobile: set `BYPASS_AUTH = true` constant in `artifacts/mobile/context/AuthContext.tsx:59` → skips Firebase and uses a mock user directly.

### Database

PostgreSQL via Drizzle ORM. Schema is in `lib/db/src/schema/` (`profiles.ts`, `tasks.ts`). `drizzle-zod` generates insert/select schemas from table definitions — these are the canonical Zod types for DB entities.

`lib/db/src/index.ts` exports `db` (the Drizzle client) and all schema tables/types. Requires `DATABASE_URL` env var.

Tasks are **auto-seeded per user** on the first `GET /tasks` call. If the DB insert fails (e.g. no DB configured), the endpoint falls back to returning in-memory mock data so the app still functions.

### Mobile App Navigation

File-based routing via `expo-router`. Structure:
- `app/index.tsx` — root, redirects based on auth state
- `app/auth/email.tsx`, `app/auth/google-callback.tsx` — auth screens
- `app/(tabs)/` — tab bar with `home`, `tasks`, `profile`

The root layout (`app/_layout.tsx`) sets up providers in order: `SafeAreaProvider` → `ErrorBoundary` → `QueryClientProvider` → `GestureHandlerRootView` → `KeyboardProvider` → `AuthProvider` → `AuthTokenSetup` (wires Firebase token into the API client).

### Environment Variables

| Variable | Where used | Purpose |
|---|---|---|
| `DATABASE_URL` | `lib/db` | PostgreSQL connection string |
| `BYPASS_AUTH` | `api-server` | Skip auth check, use `"dev-user"` |
| `EXPO_PUBLIC_API_URL` | `mobile` | Base URL for API calls |
| `GOOGLE_OAUTH_CLIENT_ID` | `api-server` | Google OAuth client ID |
| `GOOGLE_OAUTH_CLIENT_SECRET` | `api-server` | Google OAuth secret |
| `GOOGLE_OAUTH_CALLBACK_URL` | `api-server` | OAuth redirect URL registered with Google |
