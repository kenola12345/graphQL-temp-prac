# Architecture

Why the project is organized the way it is. For the frontend feature layout, see the REST sibling template; it is unchanged here.

## Monorepo with a `shared/` package

`frontend/` and `backend/` both import `@template/shared`. In the REST template it held the whole API contract. With GraphQL the **schema is the contract**, so `shared/` shrinks to two things GraphQL can't express:

- **Value rules** (Zod): "title is 1-200 characters", "password 8-72 characters". GraphQL only knows types (`String!`). The backend validates mutation inputs with these schemas and the frontend validates forms with the same ones.
- **Error codes** (`errors.ts`): the closed list of `extensions.code` values.

## Schema-first with generated types

```
backend/src/graphql/schema/*.graphql   <- you edit this
        |                         |
  codegen (backend)         codegen (frontend)
        v                         v
 generated/resolvers-types.ts   src/gql/ (typed documents)
```

- The `.graphql` files are the single source of truth for the API's shape. One file per feature, using `extend type Query/Mutation`, so features don't edit each other's files.
- **Backend:** `typescript-resolvers` generates a `Resolvers` type. A resolver with a wrong argument, a missing field or a wrong return type fails `tsc`. Resolvers return **Prisma rows** (`mappers` in `backend/codegen.ts`), which is how `passwordHash` can exist on the row yet never be part of the API: a field that isn't in the schema can't be queried.
- **Frontend:** the `client` preset reads every `graphql(`...`)` call and generates a typed document for it. `gqlRequest(document, variables)` is typed from the document alone, so call sites have no type annotations. `documentMode: "string"` keeps the `graphql` runtime out of the browser bundle.
- Generated files are committed so a fresh clone type-checks and tests run without a codegen step.
- Why not code-first (Pothos, Nexus, TypeGraphQL)? Schema-first keeps the contract readable by frontend developers and tools, and avoids a second DSL to learn. The cost is the codegen step.

## Backend

```
POST /graphql -> helmet / cors / cookies / json / rate limit -> Apollo -> resolver -> service -> Prisma
```

| Layer      | Responsibility                                                         | Must not                            |
| ---------- | ---------------------------------------------------------------------- | ----------------------------------- |
| middleware | Cross-cutting HTTP concerns: CORS, cookies, rate limit                 | Know about specific features        |
| context    | Turn the cookie into `ctx.user` (guest = `null`) once per request      | Throw for guests                    |
| resolvers  | Check auth (`requireUser`), validate args (`parseInput`), call service | Query the DB or hold business rules |
| services   | Business rules and data access                                         | Know about GraphQL, `req` or `res`  |

The resolver layer replaces routes + controllers from the REST template. Services are unchanged, so they can still be reused by jobs, scripts and tests.

Other decisions:

- **`app.ts` vs `server.ts`.** `createApp()` builds Express + Apollo without listening, so Supertest can call it. `server.ts` only starts it.
- **Apollo on Express** (`@as-integrations/express5`) rather than a standalone server, to keep cookies, helmet, CORS and rate limiting as ordinary middleware.
- **One error path.** Services and resolvers throw `AppError(code, message, details?)`, a `GraphQLError` subclass. Apollo puts the code in `extensions`. `formatError` lets known codes through and replaces anything else with a generic `INTERNAL_ERROR` (after logging it), so SQL, stack traces and internals never leak.
- **HTTP 200 on failure.** That is GraphQL's norm: one request can contain several operations, some succeeding and some failing. Clients read `errors[].extensions.code`. Only transport-level problems (bad JSON, invalid query, CSRF block, rate limit) use 4xx.
- **Guests are not errors for `me`.** `me` returns `null` for a guest, so the frontend needs no 401 special-casing. Operations that need a login call `requireUser(ctx)` and fail with `UNAUTHENTICATED`.

## Authentication and security

- Passwords: bcrypt, 12 rounds; inputs over 72 bytes are rejected because bcrypt ignores the rest.
- The JWT is in an **httpOnly, SameSite=Lax cookie** (`Secure` in production). Login and signup set it from the resolver through `ctx.res`. The algorithm is pinned to HS256 when verifying.
- **CSRF.** Apollo's `csrfPrevention` (on) rejects requests a browser could send cross-site without a preflight (for example `text/plain` form posts). Together with SameSite=Lax this closes the usual cookie-auth hole. There is a test for it.
- Login returns the same error for "unknown email" and "wrong password" and compares against a dummy hash, so neither the message nor the timing reveals which emails exist.
- **Rate limiting on a single URL.** All operations share `/graphql`, so the limiter only counts requests whose query text calls `login(` or `signup(`. Aliases, fragments and variables can't hide a field name from the text.
- **Authorization lives in the data access.** Every todo query is scoped by `userId`; someone else's todo behaves like a missing one (`NOT_FOUND`). This matters more in GraphQL than in REST: clients choose which fields and relations to request, so a check in "the route" doesn't exist; the check must be where data is read.
- **Introspection** is off in production (Apollo default); the Sandbox landing page is only served in development, which is why helmet's CSP is relaxed there.
- Errors never include stack traces (`formatError` drops `stacktrace`).

## Frontend

Same layering as the REST template (features, one-way imports, query-key factories). What changed:

- `lib/graphql-client.ts` replaces `api-client.ts`: one `fetch` to `/graphql`, throws `GraphQLRequestError(code, message, details)` when the response has `errors`.
- A feature's `api/*.api.ts` now contains its `graphql(`...`)` documents next to the request functions that use them, and `api/*-queries.ts` wraps them in TanStack Query hooks. TanStack Query is kept (rather than Apollo Client) so server-state handling is identical to the REST template; swap in Apollo Client or urql if you want a normalized cache.
- Ask only for the fields a screen shows. That is the point of GraphQL, and the generated result types follow your selection.
- Types come from `@/gql/graphql` (generated); Zod schemas from `@template/shared` still validate forms.

## Testing

- Backend: Supertest sends real HTTP `POST /graphql` to the real app and a real, separate Postgres database. Prisma isn't mocked, so resolvers, services, queries, constraints and migrations are all tested together. The tests also pin the security behavior (cookie flags, error masking, CSRF block, no `passwordHash` field).
- Frontend: Testing Library with `fetch` replaced by a per-test mock keyed by **operation name** (`Me`, `Todos`...); the whole app (router included) is rendered. `gqlError(code, message)` builds failure replies.
