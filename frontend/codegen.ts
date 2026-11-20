import type { CodegenConfig } from "@graphql-codegen/cli";

// Reads the backend's schema files and every graphql(`...`) call in src/, then generates
// typed documents into src/gql/. Run: npm run codegen (from the repo root). Commit the output.
const config: CodegenConfig = {
  schema: "../backend/src/graphql/schema/*.graphql",
  documents: ["src/**/*.{ts,tsx}", "!src/gql/**"],
  ignoreNoDocuments: true,
  generates: {
    "src/gql/": {
      preset: "client",
      presetConfig: { fragmentMasking: false },
      config: {
        // "string" mode: a document is a string with attached types, so the browser needs no
        // graphql runtime to print it. See lib/graphql-client.ts.
        documentMode: "string",
        enumsAsTypes: true,
        scalars: { DateTime: "string" },
        useTypeImports: true,
      },
    },
  },
};

export default config;
