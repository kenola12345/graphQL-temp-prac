import rateLimit from "express-rate-limit";

import { env } from "../config/env.js";

// There is a single /graphql URL, so "limit the login route" has to mean "limit requests whose
// query text calls login or signup". Aliases, fragments and variables can't hide a field name from
// the query text, so this can't be dodged (persisted queries, if added later, would need a rethink).
const AUTH_FIELDS = /\b(login|signup)\s*\(/;

/** Throttles login/signup per IP to slow down password guessing. Disabled in tests. */
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  skip: (req) => {
    if (env.NODE_ENV === "test") return true;
    const body = req.body as { query?: unknown } | undefined;
    return typeof body?.query !== "string" || !AUTH_FIELDS.test(body.query);
  },
  handler: (_req, res) => {
    // GraphQL clients expect { errors } even for a throttled request.
    res.status(429).json({
      errors: [
        {
          message: "Too many attempts. Please try again later",
          extensions: { code: "RATE_LIMITED" },
        },
      ],
    });
  },
});
