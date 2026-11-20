import request from "supertest";
import type TestAgent from "supertest/lib/agent.js";

import { createApp } from "../src/app.js";
import { prisma } from "../src/lib/prisma.js";

export const { app } = await createApp();

/** Empties every table. Child tables first is unnecessary here because of ON DELETE CASCADE. */
export async function resetDb(): Promise<void> {
  await prisma.user.deleteMany();
}

export type GqlBody = {
  data?: Record<string, unknown> | null;
  errors?: { message: string; extensions: { code: string; details?: { field: string }[] } }[];
};

/** Sends one GraphQL operation. Pass `request(app)` for a guest or an agent to keep cookies. */
export async function gql(
  client: TestAgent,
  query: string,
  variables: Record<string, unknown> = {},
): Promise<{ body: GqlBody; headers: Record<string, string | string[] | undefined> }> {
  const res = await client.post("/graphql").send({ query, variables });
  return { body: res.body as GqlBody, headers: res.headers };
}

export const SIGNUP = /* GraphQL */ `
  mutation Signup($input: SignupInput!) {
    signup(input: $input) {
      id
      email
      name
      role
    }
  }
`;

/** A supertest agent that keeps cookies between calls, already signed up and logged in. */
export async function signedUpAgent(email = "alice@example.com") {
  const agent = request.agent(app);
  const { body } = await gql(agent, SIGNUP, {
    input: { email, password: "password123", name: "Alice" },
  });
  if (body.errors) throw new Error(`signup failed: ${JSON.stringify(body.errors)}`);
  return agent;
}
