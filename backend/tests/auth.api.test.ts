import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";

import { app, gql, resetDb, signedUpAgent, SIGNUP } from "./helpers.js";

beforeEach(resetDb);

const valid = { email: "alice@example.com", password: "password123", name: "Alice" };

const LOGIN = /* GraphQL */ `
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      email
    }
  }
`;
const ME = /* GraphQL */ `
  query Me {
    me {
      email
    }
  }
`;
const LOGOUT = /* GraphQL */ `
  mutation Logout {
    logout
  }
`;

describe("signup", () => {
  it("creates the user and sets an httpOnly cookie", async () => {
    const { body, headers } = await gql(request(app), SIGNUP, { input: valid });
    expect(body.errors).toBeUndefined();
    expect(body.data?.["signup"]).toMatchObject({ email: "alice@example.com", role: "USER" });
    const cookie = headers["set-cookie"]?.[0] ?? "";
    expect(cookie).toMatch(/token=/);
    expect(cookie).toMatch(/HttpOnly/i);
  });

  it("rejects a duplicate email with EMAIL_TAKEN", async () => {
    await gql(request(app), SIGNUP, { input: valid });
    const { body } = await gql(request(app), SIGNUP, { input: valid });
    expect(body.errors?.[0]?.extensions.code).toBe("EMAIL_TAKEN");
  });

  it("rejects invalid input with field details", async () => {
    const { body } = await gql(request(app), SIGNUP, {
      input: { email: "nope", password: "short", name: "" },
    });
    expect(body.errors?.[0]?.extensions.code).toBe("VALIDATION_ERROR");
    const fields = body.errors?.[0]?.extensions.details?.map((d) => d.field);
    expect(fields).toEqual(expect.arrayContaining(["email", "password", "name"]));
  });
});

describe("login", () => {
  it("logs in with correct credentials (email is case-insensitive)", async () => {
    await gql(request(app), SIGNUP, { input: valid });
    const { body } = await gql(request(app), LOGIN, {
      input: { email: "Alice@Example.com", password: "password123" },
    });
    expect(body.data?.["login"]).toEqual({ email: "alice@example.com" });
  });

  it("gives the same error for a wrong password and an unknown email", async () => {
    await gql(request(app), SIGNUP, { input: valid });
    const wrong = await gql(request(app), LOGIN, {
      input: { email: valid.email, password: "wrong-password" },
    });
    const unknown = await gql(request(app), LOGIN, {
      input: { email: "ghost@example.com", password: "password123" },
    });
    expect(wrong.body.errors?.[0]?.extensions.code).toBe("INVALID_CREDENTIALS");
    expect(wrong.body.errors?.[0]?.message).toBe(unknown.body.errors?.[0]?.message);
  });
});

describe("me and logout", () => {
  it("returns null for a guest (not an error)", async () => {
    const { body } = await gql(request(app), ME);
    expect(body).toEqual({ data: { me: null } });
  });

  it("returns the current user, then null after logout", async () => {
    const agent = await signedUpAgent();
    expect((await gql(agent, ME)).body.data?.["me"]).toEqual({ email: "alice@example.com" });
    await gql(agent, LOGOUT);
    expect((await gql(agent, ME)).body.data?.["me"]).toBeNull();
  });

  it("treats a tampered token as a guest", async () => {
    const res = await request(app)
      .post("/graphql")
      .set("Cookie", "token=not.a.jwt")
      .send({ query: ME });
    expect(res.body.data.me).toBeNull();
  });
});
