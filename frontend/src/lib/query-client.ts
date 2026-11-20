import { QueryClient } from "@tanstack/react-query";

import { GraphQLRequestError } from "./graphql-client";

/** Errors with a known `code` (validation, auth, not found) won't change on retry; only retry network/server faults. */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: false,
        retry: (failureCount, error) => {
          const retryable =
            error instanceof GraphQLRequestError &&
            (error.code === "NETWORK_ERROR" || error.code === "INTERNAL_ERROR");
          return retryable && failureCount < 1;
        },
      },
      mutations: { retry: false },
    },
  });
}
