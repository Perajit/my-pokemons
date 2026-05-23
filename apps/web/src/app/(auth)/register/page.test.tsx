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

vi.mock("./actions", () => ({ registerAction: vi.fn() }));

import RegisterPage from "./page";

describe("RegisterPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders form inputs and submit button in idle state", () => {
    (React.useActionState as Mock).mockReturnValue([null, vi.fn(), false]);
    render(<RegisterPage />);

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /register/i }),
    ).not.toBeDisabled();
  });

  it("shows error message when error state is set", () => {
    (React.useActionState as Mock).mockReturnValue([
      "Email already in use",
      vi.fn(),
      false,
    ]);
    render(<RegisterPage />);

    expect(screen.getByText("Email already in use")).toBeInTheDocument();
  });

  it("disables button and shows loading text when pending", () => {
    (React.useActionState as Mock).mockReturnValue([null, vi.fn(), true]);
    render(<RegisterPage />);

    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
    expect(button).toHaveTextContent(/creating account/i);
  });

  it("renders link to login page", () => {
    (React.useActionState as Mock).mockReturnValue([null, vi.fn(), false]);
    render(<RegisterPage />);

    expect(screen.getByRole("link", { name: /login/i })).toHaveAttribute(
      "href",
      "/login",
    );
  });
});
