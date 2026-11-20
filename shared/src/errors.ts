// The error contract. GraphQL answers HTTP 200 even on failure, so clients branch on
// `errors[].extensions.code`, never on an HTTP status.

export const ERROR_CODES = [
  "VALIDATION_ERROR",
  "INVALID_CREDENTIALS",
  "UNAUTHENTICATED",
  "FORBIDDEN",
  "NOT_FOUND",
  "EMAIL_TAKEN",
  "RATE_LIMITED",
  "INTERNAL_ERROR",
] as const;

export type ErrorCode = (typeof ERROR_CODES)[number];

/** One invalid field, shown next to the matching form input (`extensions.details`). */
export type FieldError = { field: string; message: string };
