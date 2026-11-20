import type { UserRole } from "@template/shared";
import type { Request, Response } from "express";

import { verifyToken } from "../lib/jwt.js";

export const AUTH_COOKIE = "token";

/** Built once per request and handed to every resolver as the third argument. */
export type Context = {
  /** The logged-in user, or null for a guest. Check it with requireUser(ctx). */
  user: { id: string; role: UserRole } | null;
  /** Needed by the auth resolvers to set / clear the cookie. */
  res: Response;
};

/** Reads the login cookie. Never throws: a missing or invalid token simply means "guest". */
export function createContext(req: Request, res: Response): Context {
  const token = (req.cookies as Record<string, unknown> | undefined)?.[AUTH_COOKIE];
  const payload = typeof token === "string" ? verifyToken(token) : null;
  return { user: payload ? { id: payload.userId, role: payload.role } : null, res };
}
