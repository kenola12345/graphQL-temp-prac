import { Prisma, type User } from "@prisma/client";
import type { LoginInput, SignupInput } from "@template/shared";

import { AppError } from "../errors/AppError.js";
import { DUMMY_HASH, hashPassword, verifyPassword } from "../lib/password.js";
import { prisma } from "../lib/prisma.js";

// Service layer: business rules + database access. No req/res/HTTP in here,
// so the same code can be used from a controller, a script, a job or a test.

// Services return Prisma rows (including passwordHash). That is safe because the GraphQL schema has
// no passwordHash field: what is not in the schema can't be queried. Keep it that way.

export async function signup(input: SignupInput): Promise<User> {
  const passwordHash = await hashPassword(input.password);
  try {
    const row = await prisma.user.create({
      data: { email: input.email, name: input.name, passwordHash },
    });
    return row;
  } catch (err) {
    // Unique constraint on email. Relying on the DB (not a find-then-insert) avoids a race condition.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      throw new AppError("EMAIL_TAKEN", "This email is already registered");
    }
    throw err;
  }
}

/** Same error for "no such email" and "wrong password" so attackers can't discover which emails exist. */
export async function login(input: LoginInput): Promise<User> {
  const row = await prisma.user.findUnique({ where: { email: input.email } });
  const ok = await verifyPassword(input.password, row?.passwordHash ?? DUMMY_HASH);
  if (!row || !ok) throw new AppError("INVALID_CREDENTIALS", "Email or password is incorrect");
  return row;
}

export async function getUserById(id: string): Promise<User> {
  const row = await prisma.user.findUnique({ where: { id } });
  // The token was valid but the user is gone (deleted): treat as logged out.
  if (!row) throw new AppError("UNAUTHENTICATED", "Please log in");
  return row;
}
