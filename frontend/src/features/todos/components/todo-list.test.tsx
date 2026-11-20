import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { gqlError, renderApp } from "@/testing/render-app";

const user = { id: "u1", email: "a@example.com", name: "Alice", role: "USER" };
const todo = { id: "1", title: "Write tests", completed: false };
const loggedIn = { Me: { data: { me: user } } };

describe("TodosPage", () => {
  it("shows todos from the API", async () => {
    renderApp("/", { ...loggedIn, Todos: { data: { todos: [todo] } } });
    expect(await screen.findByText("Write tests")).toBeInTheDocument();
  });

  it("shows an empty state", async () => {
    renderApp("/", { ...loggedIn, Todos: { data: { todos: [] } } });
    expect(await screen.findByText(/nothing to do yet/i)).toBeInTheDocument();
  });

  it("shows the API error message", async () => {
    renderApp("/", { ...loggedIn, Todos: gqlError("INTERNAL_ERROR", "Boom") });
    expect(await screen.findByRole("alert")).toHaveTextContent("Boom");
  });
});
