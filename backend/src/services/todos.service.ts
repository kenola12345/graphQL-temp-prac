import { Prisma, type Todo } from "@prisma/client";
import type { CreateTodoInput, UpdateTodoInput } from "@template/shared";

import { AppError } from "../errors/AppError.js";
import { prisma } from "../lib/prisma.js";

// Every query is scoped by userId. Another user's todo behaves exactly like a missing one (NOT_FOUND),
// which prevents IDOR (guessing ids to read/edit other people's data) and doesn't reveal it exists.
// This matters more in GraphQL: a client can ask for any field of any type, so authorization belongs
// in the data access (here), not in the shape of the query.

export async function listTodos(userId: string): Promise<Todo[]> {
  return prisma.todo.findMany({ where: { userId }, orderBy: { createdAt: "desc" } });
}

export async function createTodo(userId: string, input: CreateTodoInput): Promise<Todo> {
  return prisma.todo.create({ data: { title: input.title, userId } });
}

export async function updateTodo(
  userId: string,
  id: string,
  input: UpdateTodoInput,
): Promise<Todo> {
  try {
    return await prisma.todo.update({ where: { id, userId }, data: input });
  } catch (err) {
    throw mapNotFound(err);
  }
}

export async function deleteTodo(userId: string, id: string): Promise<void> {
  try {
    await prisma.todo.delete({ where: { id, userId } });
  } catch (err) {
    throw mapNotFound(err);
  }
}

/** Prisma's "record not found" (P2025) becomes our NOT_FOUND error; anything else is re-thrown untouched. */
function mapNotFound(err: unknown): unknown {
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
    return new AppError("NOT_FOUND", "Todo not found");
  }
  return err;
}
