import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { gqlError, renderApp } from "@/testing/render-app";

// A guest is a normal answer: `me` is null, not an error.
const guest = { Me: { data: { me: null } } };

describe("auth routing", () => {
  it("redirects guests from / to the login page", async () => {
    renderApp("/", guest);
    expect(await screen.findByRole("heading", { name: "Log in" })).toBeInTheDocument();
  });

  it("shows client-side validation errors without calling the API", async () => {
    const { fetchMock } = renderApp("/login", guest);
    await userEvent.click(await screen.findByRole("button", { name: "Log in" }));
    expect(await screen.findByText("Enter a valid email")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1); // only the initial Me query
  });

  it("shows the server error for wrong credentials", async () => {
    renderApp("/login", {
      ...guest,
      Login: gqlError("INVALID_CREDENTIALS", "Email or password is incorrect"),
    });
    await userEvent.type(await screen.findByLabelText("Email"), "a@example.com");
    await userEvent.type(screen.getByLabelText("Password"), "wrong");
    await userEvent.click(screen.getByRole("button", { name: "Log in" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Email or password is incorrect");
  });
});
