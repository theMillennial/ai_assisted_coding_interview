# CLAUDE.md

## Repo layout
Monorepo for the Brex interview playground (a message system to build on).

- `backend-nodejs/` — **the active backend.** Express + TypeScript + SQLite (`better-sqlite3`). Port 8080. **REST only** (see below).
- `frontend/` — Next.js 15 (App Router) + React 19 + TypeScript + Tailwind v4. Port 3000.
- `backend-kotlin/`, `backend-python/` — alternate reference backends. **Do not read, search, or edit them** unless explicitly asked.

## Operating principles
1. **Vertical slices.** Build and verify the backend change first (route + test), then wire the frontend. Don't do big changes across both apps in one go.
2. **No schema drift.** Before writing or changing a frontend API call, read the backend model and route it hits, and copy the request/response shapes exactly.
3. **Verify before declaring done.** Run the relevant check commands below. If they fail, read the output and fix it before responding.
4. **Focused diffs.** Do only what the prompt asks: no unrequested refactors, auth layers, or extra files.
5. **No new dependencies** unless strictly required. Prefer the standard library and what's already installed. If one is truly needed, say why first.

## Commands
| Task | Command |
|---|---|
| Backend dev server | `npm --prefix backend-nodejs run dev` |
| Backend tests (Jest + supertest) | `npm --prefix backend-nodejs test` |
| Backend type check | `cd backend-nodejs && npx tsc --noEmit` |
| Frontend dev server | `npm --prefix frontend run dev` |
| Frontend lint + type check | `npm --prefix frontend run check` |
| Frontend production build (slower, final check) | `npm --prefix frontend run build` |

After backend edits: run tests **and** the type check (`tsconfig` excludes `tests/`, so tests alone don't type check `src/`).
After frontend edits: run `check`.

---

## Backend (`backend-nodejs/`)

### Structure
- `src/app.ts` — `createApp(db?)`: builds Express, mounts routers, inits and seeds the DB. Mount new routers here under `/api/<resource>`.
- `src/api/rest/` — Express routers (e.g. `messageRouter.ts`, mounted at `/api/messages`).
- `src/api/graphql/` — existing GraphQL setup. **Out of scope: don't read, extend, or update it.** Leave it as it is and don't remove it.
- `src/models/` — TypeScript domain interfaces and input types.
- `src/database/connection.ts` — table DDL lives in `initDatabase()`. `seed.ts` holds seed data.
- `src/config/` — env-driven config (`PORT`, `DB_PATH`, `CORS_ORIGIN`).
- `tests/` — Jest + supertest tests against `createApp(new Database(':memory:'))`.

### Conventions
- **REST only.** All new features are REST endpoints in `src/api/rest/`. Don't add GraphQL types, resolvers, or tests, and don't keep GraphQL in sync with REST changes. The frontend talks to the backend only over REST.
- **DB is reset on every startup** (`initDatabase(db, true)` drops tables). Add new tables to `initDatabase()` (with a matching `DROP TABLE IF EXISTS`) and seed data to `seed.ts`. There are no migrations.
- Use parameterized `db.prepare(...)` queries. Never build SQL by string concatenation.
- Define a `*Row` interface for raw SQLite rows (snake_case) and map it to the camelCase domain model from `src/models/`.
- Validate request input by hand (no Zod in the backend). Error responses use `{ detail: string }` with the right status (400/404/422). The frontend's `api.ts` reads `detail`.
- Keep route handlers thin: parse/validate input, call logic, set the status, respond. As business rules grow (state transitions, calculations), put them in `src/services/<domain>Service.ts` as plain functions that take `db` (create the folder if needed).
- Every new endpoint gets a test in `tests/`, covering the happy path plus at least one validation/error case.

### Domain modeling (for new features)
- Money is stored as integer cents (`amount_cents INTEGER` / `amountCents: number`), never floats.
- Model status as a string-literal union plus a const list, e.g. `type ExpenseStatus = 'PENDING' | 'APPROVED' | 'REJECTED'`. Enforce allowed transitions in the service layer and reject invalid ones with 409/422.
- IDs: `crypto.randomUUID()`. Timestamps: ISO 8601 strings.

---

## Frontend (`frontend/`)

### Structure
- `src/app/` — App Router pages and layout.
- `src/components/` — React components (currently `HelloWorldDashboard.tsx`).
- `src/lib/api.ts` — **the only place that calls `fetch`.** Add typed helpers here using the existing `request<T>()` wrapper.
- `src/env.js` — validated env vars (`NEXT_PUBLIC_API_URL`, default `http://localhost:8080/api`). Add new vars here and to `.env.example`.
- Import alias: `~/` → `src/`.

### Conventions
- Type every API helper's return value, mirroring the backend model (see principle 2).
- Handle all four UI states explicitly: **loading, empty, error, success**.
- Give feedback on user actions: disable buttons while a mutation is in flight, show status badges, and show inline success/error messages. No toast library. If toasts are needed, write a small component.
- Style with Tailwind utility classes. Keep components small, and pull out reusable pieces into `src/components/` once they're used twice.

### Logging & Observability Standards
- **Zero Console Litter:** Never inject ad-hoc `console.log` statements inside business logic, database queries, or route handlers.
- **HTTP Visibility:** Mount a lightweight request logger on the Express app that logs formatted requests: `[METHOD] /path -> [STATUS] ([LATENCY]ms)`.
- **Error Observability:** Inside the centralized error handler (`errorHandler.ts`), log unexpected 500 exceptions with `console.error({ message: err.message, stack: err.stack, path: req.path })`. For expected 4xx client errors (e.g., validation, insufficient funds), do not log stack traces.
- **Test Output:** Keep test runners (`npm test`) clean and silent on success. Tests should only emit output when an assertion fails.

- **Request Payload Logging:** 
  - For mutations (`POST`, `PUT`, `PATCH`), include the sanitized `req.body` in the HTTP development logger.
  - Do not log request bodies for `GET` or `DELETE` requests.
  - Never dump passwords, tokens, or raw secrets to stdout.