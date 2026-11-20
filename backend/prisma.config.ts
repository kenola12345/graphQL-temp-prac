import { existsSync } from "node:fs";

import { defineConfig } from "prisma/config";

// Prisma 7 does not load .env by itself. Existing environment variables win (e.g. in tests/CI).
if (existsSync(".env")) process.loadEnvFile(".env");

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx --env-file-if-exists=.env prisma/seed.ts",
  },
  // `prisma generate` (run by `npm install`, before .env exists) only needs a syntactically valid
  // URL and never connects. Real commands (migrate, seed, the app) read the actual DATABASE_URL.
  datasource: { url: process.env["DATABASE_URL"] ?? "postgresql://app:app@localhost:5435/app" },
});
