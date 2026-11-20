import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const SCHEMA_DIR = new URL("./schema/", import.meta.url);

/**
 * Reads every .graphql file in ./schema. Apollo merges them into one schema, which is why a feature
 * file can say `extend type Query`. Adding a feature = adding a file; nothing to register here.
 */
export function loadTypeDefs(): string[] {
  return readdirSync(fileURLToPath(SCHEMA_DIR))
    .filter((file) => file.endsWith(".graphql"))
    .sort()
    .map((file) => readFileSync(new URL(file, SCHEMA_DIR), "utf8"));
}
