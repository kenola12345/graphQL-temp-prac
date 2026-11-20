import { QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { vi } from "vitest";

import { routes } from "@/app/router";
import { createQueryClient } from "@/lib/query-client";

/** What the fake server answers: a GraphQL response body (`{ data }` or `{ errors }`). */
type Reply = { data?: unknown; errors?: { message: string; extensions: { code: string } }[] };
/** Operation name (the `Name` in `query Name`) -> response. Any operation not listed fails the test loudly. */
export type GqlMock = Record<string, Reply>;

/** Builds an `errors` reply the way the backend does. */
export const gqlError = (code: string, message: string): Reply => ({
  errors: [{ message, extensions: { code } }],
});

/** Replaces fetch with the mock, then renders the whole app (router included) at `path`. */
export function renderApp(path: string, api: GqlMock) {
  const fetchMock = vi.fn((_input: string, init?: RequestInit) => {
    const { operationName } = JSON.parse(init?.body as string) as { operationName?: string };
    const reply = operationName ? api[operationName] : undefined;
    if (!reply) throw new Error(`Unmocked GraphQL operation: ${String(operationName)}`);
    return Promise.resolve(new Response(JSON.stringify(reply), { status: 200 }));
  });
  vi.stubGlobal("fetch", fetchMock);

  // Never retry in tests: a failing request should surface immediately, not after a backoff delay.
  const queryClient = createQueryClient();
  const defaults = queryClient.getDefaultOptions();
  queryClient.setDefaultOptions({ ...defaults, queries: { ...defaults.queries, retry: false } });

  const router = createMemoryRouter(routes, { initialEntries: [path] });
  render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
  return { fetchMock };
}
