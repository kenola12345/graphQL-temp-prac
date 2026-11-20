// Single entry point of the shared package: validation rules used by BOTH frontend and backend.
// The API's shape (types, queries) lives in the GraphQL schema, not here: see backend/src/graphql/schema.
// Add one file per feature (e.g. `note.ts`) and re-export it here.
export * from "./auth.js";
export * from "./errors.js";
export * from "./todo.js";
