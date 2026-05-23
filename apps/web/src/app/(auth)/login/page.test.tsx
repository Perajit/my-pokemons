// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Mock } from "vitest";
import { render, screen } from "@testing-library/react";
import * as React from "react";

vi.mock("react", async () => {
  const actual = await vi.importActual("react");
  return { ...(actual as Record<string, unknown>), useActionState: vi.fn() };
});

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

import LoginPage from "./page";

describe("LoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders email and password inputs in idle state", () => {
    (React.useActionState as Mock).mockReturnValue([null, vi.fn(), false]);
    render(<LoginPage />);

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /login/i })).not.toBeDisabled();
  });

  it("shows error message when error state is set", () => {
    (React.useActionState as Mock).mockReturnValue([
      "Invalid email or password",
      vi.fn(),
      false,
    ]);
    render(<LoginPage />);

    expect(screen.getByText("Invalid email or password")).toBeInTheDocument();
  });

  it("disables button and shows loading text when pending", () => {
    (React.useActionState as Mock).mockReturnValue([null, vi.fn(), true]);
    render(<LoginPage />);

    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
    expect(button).toHaveTextContent(/logging in/i);
  });

  it("renders link to register page", () => {
    (React.useActionState as Mock).mockReturnValue([null, vi.fn(), false]);
    render(<LoginPage />);

    expect(
      screen.getByRole("link", { name: /create an account/i }),
    ).toHaveAttribute("href", "/register");
  });
});
