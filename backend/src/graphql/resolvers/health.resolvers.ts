import type { Resolvers } from "../generated/resolvers-types.js";

export const healthResolvers: Resolvers = {
  Query: {
    health: () => ({ ok: true }),
  },
};
