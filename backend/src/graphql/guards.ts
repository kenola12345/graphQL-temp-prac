import type { UserRole } from "@template/shared";

import { AppError } from "../errors/AppError.js";
import type { Context } from "./context.js";

/** Call first in any resolver that needs a login. Returns the user so you don't re-check for null. */
export function requireUser(ctx: Context): NonNullable<Context["user"]> {
  if (!ctx.user) throw new AppError("UNAUTHENTICATED", "Please log in");
  return ctx.user;
}

/** Like requireUser, but also checks the role: `requireRole(ctx, "ADMIN")`. */
export function requireRole(ctx: Context, ...roles: UserRole[]): NonNullable<Context["user"]> {
  const user = requireUser(ctx);
  if (!roles.includes(user.role)) {
    throw new AppError("FORBIDDEN", "You don't have permission to do this");
  }
  return user;
}
