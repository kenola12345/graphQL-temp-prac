import type { CodegenConfig } from "@graphql-codegen/cli";

// Generates the resolver types from the schema files. Run: npm run codegen (from the repo root).
const config: CodegenConfig = {
  schema: "src/graphql/schema/*.graphql",
  generates: {
    "src/graphql/generated/resolvers-types.ts": {
      plugins: ["typescript", "typescript-resolvers"],
      config: {
        contextType: "../context.js#Context",
        // Resolvers return Prisma rows, not the GraphQL type: that is how passwordHash can sit on the
        // row without ever being part of the API. (`as` avoids clashing with the schema's own User.)
        mappers: {
          User: "@prisma/client#User as UserModel",
          Todo: "@prisma/client#Todo as TodoModel",
        },
        scalars: { DateTime: { input: "Date", output: "Date | string" } },
        useTypeImports: true,
        enumsAsTypes: true,
        avoidOptionals: { field: true, inputValue: false },
      },
    },
  },
};

export default config;
