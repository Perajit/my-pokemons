// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Mock } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type * as React from "react";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

vi.mock("./actions", () => ({ loginAction: vi.fn() }));

import { loginAction } from "./actions";
import LoginPage from "./page";

const mockAction = loginAction as Mock;

beforeEach(() => {
  mockAction.mockReset();
  mockAction.mockResolvedValue(null);
});

describe("LoginPage", () => {
  it("renders the form and a link to register", () => {
    render(<LoginPage />);

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(
      screen.getByLabelText(/password/i, { selector: "input" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /login/i })).toBeEnabled();
    expect(
      screen.getByRole("link", { name: /create an account/i }),
    ).toHaveAttribute("href", "/register");
  });

  it("submits typed credentials to the login action", async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.type(screen.getByLabelText(/email/i), "a@b.com");
    await user.type(
      screen.getByLabelText(/password/i, { selector: "input" }),
      "secret123",
    );
    await user.click(screen.getByRole("button", { name: /login/i }));

    await waitFor(() => expect(mockAction).toHaveBeenCalledTimes(1));
    const [prevState, formData] = mockAction.mock.calls[0];
    expect(prevState).toBeNull();
    expect((formData as FormData).get("email")).toBe("a@b.com");
    expect((formData as FormData).get("password")).toBe("secret123");
  });

  it("shows the error returned by the action", async () => {
    mockAction.mockResolvedValue("Invalid email or password");
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.type(screen.getByLabelText(/email/i), "a@b.com");
    await user.type(
      screen.getByLabelText(/password/i, { selector: "input" }),
      "wrong",
    );
    await user.click(screen.getByRole("button", { name: /login/i }));

    expect(
      await screen.findByText("Invalid email or password"),
    ).toBeInTheDocument();
  });

  it("blocks submission and shows errors when required fields are empty", async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.click(screen.getByRole("button", { name: /login/i }));

    expect(mockAction).not.toHaveBeenCalled();
    expect(await screen.findByText(/email is required/i)).toBeInTheDocument();
    expect(screen.getByText(/password is required/i)).toBeInTheDocument();
  });

  it("allows submission with a non-standard email format (server decides)", async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.type(screen.getByLabelText(/email/i), "not-an-email");
    await user.type(
      screen.getByLabelText(/password/i, { selector: "input" }),
      "anything",
    );
    await user.click(screen.getByRole("button", { name: /login/i }));

    await waitFor(() => expect(mockAction).toHaveBeenCalledTimes(1));
  });

  it("preserves typed values after the server returns an error", async () => {
    mockAction.mockResolvedValue("Invalid email or password");
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.type(screen.getByLabelText(/email/i), "a@b.com");
    await user.type(
      screen.getByLabelText(/password/i, { selector: "input" }),
      "wrong",
    );
    await user.click(screen.getByRole("button", { name: /login/i }));

    await screen.findByText("Invalid email or password");
    expect(screen.getByLabelText(/email/i)).toHaveValue("a@b.com");
    expect(
      screen.getByLabelText(/password/i, { selector: "input" }),
    ).toHaveValue("wrong");
  });

  it("disables the button and shows pending text while submitting", async () => {
    let resolveAction!: (value: string | null) => void;
    mockAction.mockImplementation(
      () =>
        new Promise<string | null>((resolve) => {
          resolveAction = resolve;
        }),
    );
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.type(screen.getByLabelText(/email/i), "a@b.com");
    await user.type(
      screen.getByLabelText(/password/i, { selector: "input" }),
      "secret123",
    );
    await user.click(screen.getByRole("button", { name: /login/i }));

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /logging in/i }),
      ).toBeDisabled();
    });

    resolveAction(null);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /login/i })).toBeEnabled();
    });
  });

  it("toggles password visibility when the eye button is clicked", async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    const input = screen.getByLabelText(/password/i, { selector: "input" });
    expect(input).toHaveAttribute("type", "password");

    await user.click(screen.getByRole("button", { name: /show password/i }));
    expect(input).toHaveAttribute("type", "text");

    await user.click(screen.getByRole("button", { name: /hide password/i }));
    expect(input).toHaveAttribute("type", "password");
  });
});
