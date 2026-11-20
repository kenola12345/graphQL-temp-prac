import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { LoginInput, SignupInput } from "@/gql/graphql";

import { fetchMe, login, logout, signup } from "./auth.api";

export const authKeys = {
  me: ["auth", "me"] as const,
};

/** The logged-in user, or null for a guest. The `me` query answers null for guests, so no 401 handling. */
export const meQueryOptions = () =>
  queryOptions({
    queryKey: authKeys.me,
    queryFn: fetchMe,
    staleTime: Infinity, // only changes on login / logout, which update the cache themselves
    retry: false,
  });

export function useMe() {
  const { data, isPending } = useQuery(meQueryOptions());
  return { user: data ?? null, isLoading: isPending };
}

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: LoginInput) => login(input),
    onSuccess: (user) => {
      queryClient.setQueryData(authKeys.me, user);
    },
  });
}

export function useSignup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: SignupInput) => signup(input),
    onSuccess: (user) => {
      queryClient.setQueryData(authKeys.me, user);
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: logout,
    onSuccess: () => {
      // Drop ALL cached data so the next user never sees the previous user's todos.
      queryClient.clear();
      queryClient.setQueryData(authKeys.me, null);
    },
  });
}
