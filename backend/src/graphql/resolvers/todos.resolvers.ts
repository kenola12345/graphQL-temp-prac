import { createTodoSchema, todoIdSchema, updateTodoSchema } from "@template/shared";

import * as todos from "../../services/todos.service.js";
import type { Resolvers } from "../generated/resolvers-types.js";
import { requireUser } from "../guards.js";
import { parseInput } from "../validate.js";

// requireUser() gives the user id; every service call is scoped by it (see todos.service.ts).

export const todosResolvers: Resolvers = {
  Query: {
    todos: (_parent, _args, ctx) => todos.listTodos(requireUser(ctx).id),
  },
  Mutation: {
    createTodo: (_parent, args, ctx) =>
      todos.createTodo(requireUser(ctx).id, parseInput(createTodoSchema, args.input)),
    updateTodo: (_parent, args, ctx) =>
      todos.updateTodo(
        requireUser(ctx).id,
        parseInput(todoIdSchema, args.id),
        parseInput(updateTodoSchema, args.input),
      ),
    deleteTodo: async (_parent, args, ctx) => {
      await todos.deleteTodo(requireUser(ctx).id, parseInput(todoIdSchema, args.id));
      return true;
    },
  },
};
