import type { ErrorCode, FieldError } from "@template/shared";
import { GraphQLError } from "graphql";

/**
 * An expected failure (not found, invalid input...). Throw it from services or resolvers.
 * It is a GraphQLError, so Apollo puts `code` (and `details`) into `errors[].extensions`
 * and the client can branch on it. Anything that is NOT an AppError is treated as a bug and masked.
 */
export class AppError extends GraphQLError {
  constructor(code: ErrorCode, message: string, details?: FieldError[]) {
    super(message, { extensions: { code, ...(details && { details }) } });
    this.name = "AppError";
  }
}
