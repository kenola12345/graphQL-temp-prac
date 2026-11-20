# CLAUDE.md

## Project

A full-stack TypeScript **template** (and hand-coding practice ground): React + GraphQL (Apollo Server) + Prisma + PostgreSQL, with JWT cookie auth and a `todos` example feature. It is the GraphQL counterpart of the REST `frontend-et-backend-template`. See `README.md` for setup and `docs/ARCHITECTURE.md` for the reasoning behind the layout.

When the user is **practicing by hand-writing code**, don't write the solution for them unless asked. Point to the equivalent example file, explain, or review what they wrote.

## Stack

- npm workspaces monorepo: `frontend/`, `backend/`, `shared/` (Zod value rules + error codes used by both)
- TypeScript everywhere, `strict`, no `any`
- API: GraphQL, **schema-first**. `backend/src/graphql/schema/*.graphql` is the contract; types are generated with GraphQL Code Generator
- Frontend: React 19, Vite, React Router, TanStack Query, Tailwind CSS v4, typed documents via codegen `client` preset
- Backend: Node (ESM), Express 5, Apollo Server 5 (`@as-integrations/express5`), Zod, Prisma 7 (driver adapter `@prisma/adapter-pg`), PostgreSQL 17 (Docker), JWT in httpOnly cookie, bcrypt
- IDs are `cuid` strings (`ID!` in GraphQL)

## Commands (run from the repo root)

```bash
npm install
cp backend/.env.example backend/.env   # first time; set JWT_SECRET (32+ chars)
npm run db:up                          # PostgreSQL on host port 5435
npm run db:migrate                     # prisma migrate dev
npm run db:seed                        # alice@example.com / admin@example.com, password123
npm run dev                            # API :3000/graphql + web :5173 (Vite proxies /graphql)
npm run codegen                        # after editing any .graphql file or frontend graphql(`...`) document
npm test                               # backend (Supertest -> /graphql, DB app_test) + frontend (Vitest)
npm run typecheck && npm run lint
npm run format
```

## Architecture rules

**Backend request flow:** `POST /graphql` -> middleware -> Apollo -> `graphql/resolvers/` -> `services/` -> Prisma.

- `graphql/schema/*.graphql`: the API. One file per feature, using `extend type Query` / `extend type Mutation`. Files are loaded automatically.
- `graphql/resolvers/`: GraphQL only. Call `requireUser(ctx)` first when login is needed, validate args with `parseInput(zodSchema, args.x)`, call a service, return the result. No Prisma, no business rules. Register new resolver files in `resolvers/index.ts`.
- `services/`: business rules and Prisma queries. Never touch GraphQL or `req`/`res`. Throw `AppError(code, message, details?)` for expected failures.
- Read env only through `config/env.ts`. Never `process.env` elsewhere (except `prisma.config.ts`).
- Validate **all** mutation input with the shared Zod schemas. GraphQL only checks types, not lengths or formats.
- Optional input fields can arrive as `null`; `parseInput` drops nulls before Zod runs.
- Errors: expected failures are `AppError` with a code from `shared/src/errors.ts`; clients read `errors[0].extensions.code`. HTTP status is 200 for operation failures. `formatError.ts` masks anything that is not an `AppError`: never return raw error messages to clients.
- Every query on user-owned data is scoped by `userId`. Other users' records answer `NOT_FOUND`, not `FORBIDDEN`. Authorization belongs in services, not in the query shape.
- Resolvers return Prisma rows (via `mappers` in `backend/codegen.ts`). **Never add `passwordHash` to the schema.** Adding a Prisma model that resolvers return means adding a mapper.
- Never log passwords, tokens, cookies or request bodies.
- Adding a relation field that points back (e.g. `Todo.user` while `User.todos` exists) creates cyclic queries: add a depth limit and a DataLoader first.

**Frontend (flow is one-way: shared -> features -> app):**

- `app/`: router, providers, layout, pages. Composes features. The only place allowed to import `@/features/*`.
- `features/<name>/`: `api/` (`graphql(`...`)` documents + request functions + TanStack Query hooks + key factory), `components/`, optionally `hooks/`, `types/`. **Never import another feature or `app/`** (ESLint enforces it). Use relative imports inside a feature.
- Shared code (`components/`, `hooks/`, `lib/`, `utils/`, `config/`) must not import features or `app/`. Promote code to shared only once a second feature needs it.
- `src/gql/` is generated: never edit it by hand. Import `graphql` from `@/gql/gql` and types from `@/gql/graphql`.
- Every document must be a **named** operation (`query Todos`, `mutation Login`): the name is sent as `operationName` and tests mock by it.
- Request only the fields the screen needs.
- Call the API only through `gqlRequest` (`lib/graphql-client.ts`); it throws `GraphQLRequestError` with `code` and `details`.
- No barrel (`index.ts`) files; import from the file directly.
- Query keys: one factory per feature, in that feature's `api/`. No global `queryKeys.ts`.
- Server state lives in TanStack Query. Don't copy it into `useState` or a global store.
- Tailwind with tokens defined in `styles/index.css` (`@theme`). No hard-coded colors in JSX.
- Files are kebab-case; components are PascalCase exports.
- Every list/data component handles loading, error and empty states.
- Forms reuse the shared Zod schema for client validation, and map server `details` onto fields.

## Conventions

- Add a feature: shared Zod schema -> Prisma model + migration -> `.graphql` schema file -> add mapper in `backend/codegen.ts` -> `npm run codegen` -> service -> resolvers (+ register) -> API test -> frontend documents -> `npm run codegen` -> feature hooks/components -> page + route line. The README has the checklist.
- Tests: backend in `backend/tests/*.api.test.ts` (real test DB, no mocking Prisma, helpers `gql()` and `signedUpAgent()`); frontend next to the component as `*.test.tsx` using `renderApp()` and `gqlError()` from `src/testing/render-app.tsx` (mock keyed by operation name).
- Generated files are committed. After editing a schema or document, run `npm run codegen` and commit the result together with the change.
- Import order is enforced by `simple-import-sort`; `npm run lint -- --fix` fixes it.
- Comments explain WHY (a business rule, a security reason), not what the code does.
- Never commit `.env` files or secrets. `.env.example` and `.env.test` (no secrets) are committed.
- Schema change = new migration (`npm run db:migrate`). Never edit an applied migration.

## Gotchas

- Prisma 7 does not read `.env` by itself: `prisma.config.ts` loads it. The datasource URL is not in `schema.prisma`. `prisma.config.ts` falls back to a dummy URL so `npm install` (`prisma generate`) works before `.env` exists.
- Backend tests load `backend/.env.test` and run `prisma migrate deploy` in `tests/global-setup.ts`.
- The `app_test` database is created by `docker/postgres-init/` only when the Docker volume is first created. If it's missing, run `docker compose down -v && npm run db:up` (this wipes dev data).
- `createApp()` is async (Apollo must start first): `const { app } = await createApp()`.
- Apollo needs `Content-Type: application/json` (CSRF prevention). Tests and `gqlRequest` set it; a `curl` without it gets a 400.
- Validation failures of the query itself (unknown field, bad syntax) return HTTP 400 with Apollo's own codes, not our `ErrorCode`s.
- This project uses host port 5435 for Postgres so it can run next to the REST template (5433).
- TypeScript 6: don't set `baseUrl`; the `@/*` alias uses `paths` only. Use `SubmitEvent` imported from `react` for form handlers.
