import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@as-integrations/express5";
import cookieParser from "cookie-parser";
import cors from "cors";
import express, { type ErrorRequestHandler, type Express } from "express";
import helmet from "helmet";

import { env } from "./config/env.js";
import { type Context, createContext } from "./graphql/context.js";
import { formatError } from "./graphql/formatError.js";
import { resolvers } from "./graphql/resolvers/index.js";
import { loadTypeDefs } from "./graphql/schema.js";
import { authRateLimit } from "./middleware/rateLimits.js";

/** A request body that isn't JSON never reaches Apollo; answer in the GraphQL error shape anyway. */
const bodyErrorHandler: ErrorRequestHandler = (_err, _req, res, _next) => {
  res.status(400).json({
    errors: [
      { message: "The request body isn't valid JSON", extensions: { code: "VALIDATION_ERROR" } },
    ],
  });
};

/**
 * Builds the Express app WITHOUT listening, so tests can call it directly (supertest).
 * Starting the server is server.ts's job. Returns the ApolloServer too so it can be stopped.
 */
export async function createApp(): Promise<{ app: Express; apollo: ApolloServer<Context> }> {
  const apollo = new ApolloServer<Context>({
    typeDefs: loadTypeDefs(),
    resolvers,
    formatError,
    // Apollo turns introspection off by itself when NODE_ENV=production. csrfPrevention is on by
    // default: a request must be application/json or carry a preflight-triggering header.
    csrfPrevention: true,
  });
  await apollo.start();

  const app = express();
  // The Apollo Sandbox page (GET /graphql in development) needs scripts from a CDN, so the default
  // Content-Security-Policy is only kept in production, where no landing page is served.
  app.use(helmet({ contentSecurityPolicy: env.NODE_ENV === "production" ? undefined : false }));
  // credentials: true lets the browser send the auth cookie; origin must be explicit (not "*").
  app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
  app.use(cookieParser());
  app.use(express.json({ limit: "1mb" }));
  app.use(bodyErrorHandler);

  app.use(
    "/graphql",
    authRateLimit,
    expressMiddleware(apollo, {
      context: ({ req, res }) => Promise.resolve(createContext(req, res)),
    }),
  );

  return { app, apollo };
}
