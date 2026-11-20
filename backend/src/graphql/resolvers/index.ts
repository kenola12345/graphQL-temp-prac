import type { Resolvers } from "../generated/resolvers-types.js";
import { authResolvers } from "./auth.resolvers.js";
import { healthResolvers } from "./health.resolvers.js";
import { DateTime } from "./scalars.js";
import { todosResolvers } from "./todos.resolvers.js";

/**
 * Register a new feature's resolvers here. Query/Mutation maps from every file are merged
 * (one level deep), so each feature can define its own part of Query and Mutation.
 */
const parts: Resolvers[] = [healthResolvers, authResolvers, todosResolvers];

export const resolvers: Resolvers = {
  DateTime,
  Query: Object.assign({}, ...parts.map((p) => p.Query)) as Resolvers["Query"],
  Mutation: Object.assign({}, ...parts.map((p) => p.Mutation)) as Resolvers["Mutation"],
};
