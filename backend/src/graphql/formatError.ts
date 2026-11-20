import type { GraphQLFormattedError } from "graphql";

import { logger } from "../lib/logger.js";

// Codes Apollo/graphql-js set for problems with the CLIENT's request. Safe and useful to show.
const CLIENT_CODES = new Set([
  "GRAPHQL_PARSE_FAILED",
  "GRAPHQL_VALIDATION_FAILED",
  "BAD_USER_INPUT",
  "BAD_REQUEST",
  "OPERATION_RESOLUTION_FAILURE",
  "PERSISTED_QUERY_NOT_FOUND",
]);

// Codes of our own AppError (see shared/src/errors.ts). Imported by name to stay decoupled from Apollo.
const APP_CODES = new Set([
  "VALIDATION_ERROR",
  "INVALID_CREDENTIALS",
  "UNAUTHENTICATED",
  "FORBIDDEN",
  "NOT_FOUND",
  "EMAIL_TAKEN",
  "RATE_LIMITED",
]);

/**
 * Apollo's formatError hook: the last step before an error reaches the client.
 * Expected errors pass through. Anything else is a bug: log it here, return a generic message,
 * so stack traces, SQL and other internals never leak.
 */
export function formatError(
  formatted: GraphQLFormattedError,
  error: unknown,
): GraphQLFormattedError {
  const code = formatted.extensions?.["code"];
  if (typeof code === "string" && (APP_CODES.has(code) || CLIENT_CODES.has(code))) {
    // `stacktrace` is only added by Apollo outside production; never forward it.
    const { stacktrace: _stacktrace, ...extensions } = formatted.extensions ?? {};
    return { ...formatted, extensions };
  }
  logger.error("unhandled resolver error", { err: error });
  return { message: "Something went wrong", extensions: { code: "INTERNAL_ERROR" } };
}
