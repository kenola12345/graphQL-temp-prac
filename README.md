# GraphQL Fullstack Template

A starter project for full-stack TypeScript development: **React + GraphQL (Apollo Server) + Prisma + PostgreSQL**, with login (JWT in an httpOnly cookie) and a small working example feature (todos) wired end to end.

It is the GraphQL counterpart of the REST `frontend-et-backend-template`: same monorepo, auth, validation, tests and lint rules, with the REST layer (routes / controllers) replaced by a **schema-first GraphQL API** and generated types.

## What this project is for

1. **A starting point for new projects.** Copy it, delete the `todos` example, and build your own features on a structure that already has validation, error handling, auth, tests and lint rules in place.
2. **A practice ground for hand-writing code.** Every layer has one complete, small example. Delete a file (for example `backend/src/graphql/resolvers/todos.resolvers.ts`) and rewrite it from memory, then check with `npm test`.

## Tech stack

| Area     | Tools                                                                          |
| -------- | ------------------------------------------------------------------------------ |
| Monorepo | npm workspaces: `frontend/`, `backend/`, `shared/`                             |
| Language | TypeScript everywhere (`strict`)                                               |
| API      | GraphQL, **schema-first** (`.graphql` files), GraphQL Code Generator           |
| Frontend | React 19, Vite, React Router, TanStack Query, Tailwind CSS v4                  |
| Backend  | Node.js, Express 5, Apollo Server 5, Zod, Prisma 7, JWT (httpOnly cookie)      |
| Database | PostgreSQL 17 in Docker                                                        |
| Testing  | Vitest, Testing Library (frontend), Supertest (backend, real HTTP to /graphql) |
| Quality  | ESLint (strict type-checked), Prettier, import-boundary lint rules             |

## Prerequisites

- **Node.js 22.9 or newer** (`.nvmrc` pins 24: `nvm use`)
- **Docker** (runs PostgreSQL)

## Getting started

Run everything from the repository root.

```bash
# 1. Install dependencies (also generates the Prisma client)
npm install

# 2. Create your env file, then set JWT_SECRET to a random value
cp backend/.env.example backend/.env
#    openssl rand -hex 32   <- paste the output as JWT_SECRET

# 3. Start PostgreSQL (waits until it is healthy)
npm run db:up

# 4. Create the tables
npm run db:migrate

# 5. (Optional) Load sample data: alice@example.com / admin@example.com, password "password123"
npm run db:seed

# 6. Start the API and the web app together
npm run dev
```

- Web app: http://localhost:5173 (Vite forwards `/graphql` to the backend, so there is no CORS setup to do)
- GraphQL API: http://localhost:3000/graphql. Open it in a browser for Apollo Sandbox (an in-browser query playground; development only).

Without the seed, click **Sign up** and create an account.

> **Port already in use?** The database is published on host port **5435** and the API listens on **3000**. Change `POSTGRES_PORT` and the port in `backend/.env` together for the database; change `PORT` in `backend/.env` and `BACKEND_URL` (when starting Vite) for the API.

## Commands

| Command                             | What it does                                                  |
| ----------------------------------- | ------------------------------------------------------------- |
| `npm run dev`                       | API + web app with hot reload                                 |
| `npm run codegen`                   | Regenerate TypeScript types from the GraphQL schema/documents |
| `npm test`                          | Backend API tests and frontend component tests                |
| `npm run typecheck`                 | TypeScript check in every workspace                           |
| `npm run lint` / `npm run format`   | ESLint / Prettier                                             |
| `npm run build`                     | Production build of the frontend                              |
| `npm run db:up` / `npm run db:down` | Start / stop PostgreSQL                                       |
| `npm run db:migrate`                | Apply schema changes (`prisma migrate dev`)                   |
| `npm run db:seed`                   | Reset and load sample data                                    |

**Run `npm run codegen` whenever you edit a `.graphql` schema file or a `graphql(`...`)` document in the frontend.** The generated files (`backend/src/graphql/generated/`, `frontend/src/gql/`) are committed, so a fresh clone type-checks without running it. If you forget, `npm run typecheck` fails.

Backend tests use a separate database (`app_test`, created automatically the first time the Docker volume is created) and apply migrations themselves. They never touch your development data.

## Folder structure

```
.
├── backend/
│   ├── prisma/                 schema.prisma, migrations/, seed.ts
│   ├── codegen.ts              resolver-type generation config
│   ├── src/
│   │   ├── graphql/
│   │   │   ├── schema/         *.graphql: THE API contract (one file per feature)
│   │   │   ├── resolvers/      one file per feature + index.ts: args -> service -> result
│   │   │   ├── generated/      resolver types (generated, committed)
│   │   │   ├── context.ts      per-request context: the logged-in user (from the cookie)
│   │   │   ├── guards.ts       requireUser / requireRole
│   │   │   ├── validate.ts     parseInput(zodSchema, args): value rules + field errors
│   │   │   ├── formatError.ts  masks unexpected errors before they reach the client
│   │   │   └── schema.ts       loads every schema/*.graphql file
│   │   ├── services/           business rules + Prisma queries (no GraphQL, no HTTP)
│   │   ├── config/             env.ts: the only place that reads process.env
│   │   ├── middleware/         rate limiting for login/signup
│   │   ├── errors/             AppError (expected failures, carry an error code)
│   │   ├── jobs/               recurring background tasks
│   │   ├── lib/                prisma client, jwt, password hashing, logger
│   │   ├── app.ts              builds Express + Apollo (no listen: easy to test)
│   │   └── server.ts           starts the server
│   └── tests/                  *.api.test.ts (Supertest -> POST /graphql, test DB)
├── frontend/
│   ├── codegen.ts              typed-document generation config
│   └── src/
│       ├── app/                router, providers, layout, pages: composes features
│       ├── features/           one folder per feature: api/ (documents + hooks), components/
│       │   ├── auth/
│       │   └── todos/
│       ├── gql/                typed documents (generated, committed)
│       ├── components/ui/      shared, generic UI (button, form-field, spinner)
│       ├── lib/                graphql-client, query-client
│       ├── config/ hooks/ utils/ assets/   shared
│       ├── styles/             Tailwind + design tokens
│       └── testing/            test setup and helpers
├── shared/src/                 Zod value rules + error codes used by BOTH sides
├── docs/ARCHITECTURE.md        why it is organized this way
├── docker-compose.yml          PostgreSQL
└── CLAUDE.md                   instructions for Claude Code
```

A request flows `POST /graphql -> CORS / cookies / rate limit -> Apollo -> resolver -> service -> Prisma`. More in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## API overview

There is one endpoint, `POST /graphql`. The full contract is in `backend/src/graphql/schema/*.graphql`.

| Operation                                           | Auth | Description                               |
| --------------------------------------------------- | ---- | ----------------------------------------- |
| `query health`                                      | no   | Liveness check                            |
| `query me`                                          | no   | Current user, or `null` for a guest       |
| `mutation signup(input)` / `login(input)`           | no   | Create account / log in (sets the cookie) |
| `mutation logout`                                   | no   | Clear the cookie                          |
| `query todos`                                       | yes  | List your todos                           |
| `mutation createTodo` / `updateTodo` / `deleteTodo` | yes  | Create / update / delete your todo        |

**Errors.** GraphQL answers HTTP 200 even when an operation fails. Failures arrive in the standard `errors` array, and clients branch on `errors[0].extensions.code`:

```json
{
  "data": null,
  "errors": [
    {
      "message": "Some fields are invalid",
      "extensions": {
        "code": "VALIDATION_ERROR",
        "details": [{ "field": "email", "message": "Enter a valid email" }]
      }
    }
  ]
}
```

Codes are defined once in `shared/src/errors.ts`: `VALIDATION_ERROR`, `INVALID_CREDENTIALS`, `UNAUTHENTICATED`, `FORBIDDEN`, `NOT_FOUND`, `EMAIL_TAKEN`, `RATE_LIMITED`, `INTERNAL_ERROR`. Malformed queries get Apollo's own `GRAPHQL_VALIDATION_FAILED` / `GRAPHQL_PARSE_FAILED` (HTTP 400).

## Adding your own feature (example: "notes")

1. **`shared/src/note.ts`**: Zod schemas for the value rules (lengths, formats); export from `shared/src/index.ts`.
2. **`backend/prisma/schema.prisma`**: add the model, then `npm run db:migrate`.
3. **`backend/src/graphql/schema/notes.graphql`**: the `Note` type, inputs, and `extend type Query` / `extend type Mutation`. Schema files are picked up automatically.
4. **`backend/codegen.ts`**: add `Note: "@prisma/client#Note as NoteModel"` to `mappers`.
5. **`npm run codegen`**: regenerates the resolver types, so TypeScript now tells you which resolvers are missing.
6. **Backend code**: `services/notes.service.ts` and `graphql/resolvers/notes.resolvers.ts`; add it to the list in `resolvers/index.ts`.
7. **`backend/tests/notes.api.test.ts`**: write the test first if you want to practice.
8. **Frontend**: `features/notes/{api,components}` (write the `graphql(`...`)` documents in `notes.api.ts`), run `npm run codegen`, add a page in `app/routes/` and one line in `app/router.tsx`.

## Known gaps (left for you to decide)

- **No query depth / complexity limits.** A client can send a deeply nested query once your schema has relations that point back at each other (`User.todos`, `Todo.user`). Add a limit (for example the `graphql-armor` package) before exposing such a schema. Today the schema has no cycles.
- **No DataLoader.** Not needed until a list field has a per-item relation (the "N+1 query" problem). Add one when you write your first nested resolver.
- **No subscriptions** (real-time updates).
- **Introspection** is on in development and off in production (Apollo's default). Keep it that way.
- **No production build for the backend.** It runs with `tsx`. Add a bundler or compile step and a Dockerfile when you deploy.
- **No end-to-end (Playwright) tests** and no CI workflow yet.
- **No email verification or password reset.**
- `npm audit` reports advisories in transitive dev tooling; review before shipping.

## References

- [GraphQL: best practices](https://graphql.org/learn/best-practices/) and [Apollo Server: error handling](https://www.apollographql.com/docs/apollo-server/data/errors): error codes in `extensions`, masking internals
- [GraphQL Code Generator: client preset](https://the-guild.dev/graphql/codegen/plugins/presets/preset-client) and [typescript-resolvers](https://the-guild.dev/graphql/codegen/plugins/typescript/typescript-resolvers): typed documents and resolvers
- [Bulletproof React: project structure](https://github.com/alan2207/bulletproof-react/blob/master/docs/project-structure.md): feature folders, unidirectional imports
- [TkDodo: Effective React Query Keys](https://tkdodo.eu/blog/effective-react-query-keys): query key factories
