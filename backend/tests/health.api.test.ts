import request from "supertest";
import { describe, expect, it } from "vitest";

import { app, gql } from "./helpers.js";

describe("health and error shape", () => {
  it("answers the health query", async () => {
    const { body } = await gql(request(app), "{ health { ok } }");
    expect(body).toEqual({ data: { health: { ok: true } } });
  });

  it("reports an unknown field as GRAPHQL_VALIDATION_FAILED", async () => {
    const res = await request(app).post("/graphql").send({ query: "{ nope }" });
    expect(res.status).toBe(400);
    expect(res.body.errors[0].extensions.code).toBe("GRAPHQL_VALIDATION_FAILED");
  });

  it("rejects a non-JSON body in the GraphQL error shape", async () => {
    const res = await request(app)
      .post("/graphql")
      .set("Content-Type", "application/json")
      .send("{not json");
    expect(res.status).toBe(400);
    expect(res.body.errors[0].extensions.code).toBe("VALIDATION_ERROR");
  });

  it("blocks simple cross-site form posts (CSRF prevention)", async () => {
    const res = await request(app)
      .post("/graphql")
      .set("Content-Type", "text/plain")
      .send('{"query":"{ health { ok } }"}');
    expect(res.status).toBe(400);
  });

  it("does not expose the schema's secrets: passwordHash is not a field", async () => {
    const res = await request(app).post("/graphql").send({ query: "{ me { passwordHash } }" });
    expect(res.body.errors[0].extensions.code).toBe("GRAPHQL_VALIDATION_FAILED");
  });
});
