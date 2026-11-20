import type { FieldError } from "@template/shared";
import type { z, ZodType } from "zod";

import { AppError } from "../errors/AppError.js";

/**
 * Validates a resolver argument with a shared Zod schema. GraphQL already guarantees the TYPES;
 * this enforces the VALUE rules (length, format) and answers VALIDATION_ERROR listing every bad field.
 */
export function parseInput<S extends ZodType>(schema: S, input: unknown): z.infer<S> {
  const result = schema.safeParse(dropNulls(input));
  if (result.success) return result.data;
  const details: FieldError[] = result.error.issues.map((issue) => ({
    field: issue.path.join(".") || "input",
    message: issue.message,
  }));
  throw new AppError("VALIDATION_ERROR", "Some fields are invalid", details);
}

/** In GraphQL an optional input field can arrive as an explicit null; Zod's .optional() wants it absent. */
function dropNulls(input: unknown): unknown {
  if (typeof input !== "object" || input === null) return input;
  return Object.fromEntries(Object.entries(input).filter(([, value]) => value !== null));
}
