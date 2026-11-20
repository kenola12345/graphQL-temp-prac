import { graphql } from "@/gql/gql";
import type { LoginInput, MeQuery, SignupInput } from "@/gql/graphql";
import { gqlRequest } from "@/lib/graphql-client";

// Plain request functions: no React here, so they are trivial to test and reuse.
// graphql(`...`) is typed by `npm run codegen`: re-run it after editing a document.

export type CurrentUser = NonNullable<MeQuery["me"]>;

const ME = graphql(`
  query Me {
    me {
      id
      email
      name
      role
    }
  }
`);

const SIGNUP = graphql(`
  mutation Signup($input: SignupInput!) {
    signup(input: $input) {
      id
      email
      name
      role
    }
  }
`);

const LOGIN = graphql(`
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      id
      email
      name
      role
    }
  }
`);

const LOGOUT = graphql(`
  mutation Logout {
    logout
  }
`);

/** The logged-in user, or null for a guest. */
export async function fetchMe(): Promise<CurrentUser | null> {
  return (await gqlRequest(ME)).me;
}

export async function signup(input: SignupInput): Promise<CurrentUser> {
  return (await gqlRequest(SIGNUP, { input })).signup;
}

export async function login(input: LoginInput): Promise<CurrentUser> {
  return (await gqlRequest(LOGIN, { input })).login;
}

export async function logout(): Promise<void> {
  await gqlRequest(LOGOUT);
}
