import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";

import { app, gql, resetDb, signedUpAgent } from "./helpers.js";

beforeEach(resetDb);

const TODOS = /* GraphQL */ `
  query Todos {
    todos {
      id
      title
      completed
    }
  }
`;
const CREATE = /* GraphQL */ `
  mutation CreateTodo($input: CreateTodoInput!) {
    createTodo(input: $input) {
      id
      title
      completed
    }
  }
`;
const UPDATE = /* GraphQL */ `
  mutation UpdateTodo($id: ID!, $input: UpdateTodoInput!) {
    updateTodo(id: $id, input: $input) {
      completed
    }
  }
`;
const DELETE = /* GraphQL */ `
  mutation DeleteTodo($id: ID!) {
    deleteTodo(id: $id)
  }
`;

type Agent = Awaited<ReturnType<typeof signedUpAgent>>;

async function createTodoId(agent: Agent, title: string): Promise<string> {
  const { body } = await gql(agent, CREATE, { input: { title } });
  return (body.data?.["createTodo"] as { id: string }).id;
}

describe("todos API", () => {
  it("requires login", async () => {
    const list = await gql(request(app), TODOS);
    expect(list.body.errors?.[0]?.extensions.code).toBe("UNAUTHENTICATED");
    const create = await gql(request(app), CREATE, { input: { title: "x" } });
    expect(create.body.errors?.[0]?.extensions.code).toBe("UNAUTHENTICATED");
  });

  it("creates and lists todos, newest first", async () => {
    const agent = await signedUpAgent();
    await createTodoId(agent, "first");
    const created = await gql(agent, CREATE, { input: { title: "  second  " } });
    expect(created.body.data?.["createTodo"]).toMatchObject({ title: "second", completed: false }); // trimmed

    const { body } = await gql(agent, TODOS);
    const titles = (body.data?.["todos"] as { title: string }[]).map((t) => t.title);
    expect(titles).toEqual(["second", "first"]);
  });

  it("rejects an empty title with field details", async () => {
    const agent = await signedUpAgent();
    const { body } = await gql(agent, CREATE, { input: { title: "   " } });
    expect(body.errors?.[0]?.extensions.code).toBe("VALIDATION_ERROR");
    expect(body.errors?.[0]?.extensions.details?.[0]?.field).toBe("title");
  });

  it("updates and deletes your own todo", async () => {
    const agent = await signedUpAgent();
    const id = await createTodoId(agent, "a");
    const updated = await gql(agent, UPDATE, { id, input: { completed: true } });
    expect(updated.body.data?.["updateTodo"]).toEqual({ completed: true });
    expect((await gql(agent, DELETE, { id })).body.data?.["deleteTodo"]).toBe(true);
    const again = await gql(agent, DELETE, { id });
    expect(again.body.errors?.[0]?.extensions.code).toBe("NOT_FOUND");
  });

  it("accepts an explicit null for an optional field", async () => {
    const agent = await signedUpAgent();
    const id = await createTodoId(agent, "a");
    const { body } = await gql(agent, UPDATE, { id, input: { title: null, completed: true } });
    expect(body.errors).toBeUndefined();
  });

  it("hides other users' todos (NOT_FOUND, not FORBIDDEN)", async () => {
    const alice = await signedUpAgent("alice@example.com");
    const bob = await signedUpAgent("bob@example.com");
    const id = await createTodoId(alice, "private");

    expect((await gql(bob, TODOS)).body.data?.["todos"]).toEqual([]);
    const upd = await gql(bob, UPDATE, { id, input: { completed: true } });
    expect(upd.body.errors?.[0]?.extensions.code).toBe("NOT_FOUND");
    const del = await gql(bob, DELETE, { id });
    expect(del.body.errors?.[0]?.extensions.code).toBe("NOT_FOUND");
    expect((await gql(alice, TODOS)).body.data?.["todos"]).toHaveLength(1);
  });
});
