import { loginSchema, signupSchema } from "@template/shared";
import type { Response } from "express";

import { env } from "../../config/env.js";
import { signToken, TOKEN_TTL_SECONDS } from "../../lib/jwt.js";
import * as auth from "../../services/auth.service.js";
import { AUTH_COOKIE } from "../context.js";
import type { Resolvers } from "../generated/resolvers-types.js";
import { parseInput } from "../validate.js";

// Resolver layer: GraphQL in, GraphQL out. Validate args, call a service, return the result.
// Business rules and Prisma stay in services/, exactly like controllers in the REST template.

/**
 * The token lives in an httpOnly cookie so JavaScript (and therefore XSS) can't read it.
 * SameSite=Lax blocks cross-site POSTs (CSRF); Secure is required once you serve over HTTPS.
 */
function setAuthCookie(res: Response, token: string): void {
  res.cookie(AUTH_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.NODE_ENV === "production",
    maxAge: TOKEN_TTL_SECONDS * 1000,
    path: "/",
  });
}

export const authResolvers: Resolvers = {
  Query: {
    // A guest gets null, not an error: the frontend calls this on load to learn who is logged in.
    me: async (_parent, _args, ctx) => {
      if (!ctx.user) return null;
      try {
        return await auth.getUserById(ctx.user.id);
      } catch {
        return null; // valid token but the user was deleted: treat as logged out
      }
    },
  },
  Mutation: {
    signup: async (_parent, args, ctx) => {
      const user = await auth.signup(parseInput(signupSchema, args.input));
      setAuthCookie(ctx.res, signToken({ userId: user.id, role: user.role }));
      return user;
    },
    login: async (_parent, args, ctx) => {
      const user = await auth.login(parseInput(loginSchema, args.input));
      setAuthCookie(ctx.res, signToken({ userId: user.id, role: user.role }));
      return user;
    },
    logout: (_parent, _args, ctx) => {
      ctx.res.clearCookie(AUTH_COOKIE, { path: "/" });
      return true;
    },
  },
};
