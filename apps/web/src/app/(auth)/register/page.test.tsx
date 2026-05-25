// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Mock } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
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

vi.mock("./actions", () => ({ registerAction: vi.fn() }));

import { registerAction } from "./actions";
import RegisterPage from "./page";

const mockAction = registerAction as Mock;

beforeEach(() => {
  mockAction.mockReset();
  mockAction.mockResolvedValue(null);
});

describe("RegisterPage", () => {
  it("renders the form and a link to login", () => {
    render(<RegisterPage />);

    expect(screen.getByLabelText(/^name$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(
      screen.getByLabelText(/^password/i, { selector: "input" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /register/i })).toBeEnabled();
    expect(screen.getByRole("link", { name: /^login$/i })).toHaveAttribute(
      "href",
      "/login",
    );
  });

  it("submits typed credentials to the register action", async () => {
    const user = userEvent.setup();
    render(<RegisterPage />);

    await user.type(screen.getByLabelText(/^name$/i), "Ash");
    await user.type(screen.getByLabelText(/email/i), "ash@pallet.com");
    await user.type(
      screen.getByLabelText(/^password/i, { selector: "input" }),
      "Pikapika1!",
    );
    await user.click(screen.getByRole("button", { name: /register/i }));

    await waitFor(() => expect(mockAction).toHaveBeenCalledTimes(1));
    const [prevState, formData] = mockAction.mock.calls[0];
    expect(prevState).toBeNull();
    expect((formData as FormData).get("name")).toBe("Ash");
    expect((formData as FormData).get("email")).toBe("ash@pallet.com");
    expect((formData as FormData).get("password")).toBe("Pikapika1!");
  });

  it("shows the error returned by the action", async () => {
    mockAction.mockResolvedValue("Email already in use");
    const user = userEvent.setup();
    render(<RegisterPage />);

    await user.type(screen.getByLabelText(/email/i), "ash@pallet.com");
    await user.type(
      screen.getByLabelText(/^password/i, { selector: "input" }),
      "Pikapika1!",
    );
    await user.click(screen.getByRole("button", { name: /register/i }));

    expect(await screen.findByText("Email already in use")).toBeInTheDocument();
  });

  it("shows the password requirements checklist immediately, even when empty", () => {
    render(<RegisterPage />);

    const list = screen.getByRole("list", { name: /password requirements/i });
    expect(list).toBeInTheDocument();
    expect(
      within(list).getByText(/at least 8 characters/i),
    ).toBeInTheDocument();
    expect(within(list).getByText(/uppercase letter/i)).toBeInTheDocument();
    expect(within(list).getByText(/lowercase letter/i)).toBeInTheDocument();
    expect(within(list).getByText(/^number$/i)).toBeInTheDocument();
    expect(within(list).getByText(/special character/i)).toBeInTheDocument();
  });

  it("marks a checklist row as met when the password satisfies its rule", async () => {
    const user = userEvent.setup();
    render(<RegisterPage />);

    await user.type(
      screen.getByLabelText(/^password/i, { selector: "input" }),
      "Password1!",
    );

    const list = screen.getByRole("list", { name: /password requirements/i });
    const rows = within(list).getAllByRole("listitem");
    expect(rows).toHaveLength(5);
    for (const row of rows) {
      expect(row).toHaveClass("text-green-600");
    }
  });

  it("blocks submission when password rules are not all met", async () => {
    const user = userEvent.setup();
    render(<RegisterPage />);

    await user.type(screen.getByLabelText(/email/i), "ash@pallet.com");
    await user.type(
      screen.getByLabelText(/^password/i, { selector: "input" }),
      "password",
    );
    await user.click(screen.getByRole("button", { name: /register/i }));

    expect(mockAction).not.toHaveBeenCalled();
    expect(
      screen.getByLabelText(/^password/i, { selector: "input" }),
    ).toHaveAttribute("aria-invalid", "true");
  });

  it("blocks submission and shows email error when email is invalid", async () => {
    const user = userEvent.setup();
    render(<RegisterPage />);

    await user.type(screen.getByLabelText(/email/i), "not-an-email");
    await user.type(
      screen.getByLabelText(/^password/i, { selector: "input" }),
      "Password1!",
    );
    await user.click(screen.getByRole("button", { name: /register/i }));

    expect(mockAction).not.toHaveBeenCalled();
    expect(
      await screen.findByText(/enter a valid email address/i),
    ).toBeInTheDocument();
  });

  it("preserves typed values after the server returns an error", async () => {
    mockAction.mockResolvedValue("Email already in use");
    const user = userEvent.setup();
    render(<RegisterPage />);

    await user.type(screen.getByLabelText(/^name$/i), "Ash");
    await user.type(screen.getByLabelText(/email/i), "ash@pallet.com");
    await user.type(
      screen.getByLabelText(/^password/i, { selector: "input" }),
      "Pikapika1!",
    );
    await user.click(screen.getByRole("button", { name: /register/i }));

    await screen.findByText("Email already in use");

    expect(screen.getByLabelText(/^name$/i)).toHaveValue("Ash");
    expect(screen.getByLabelText(/email/i)).toHaveValue("ash@pallet.com");
    expect(
      screen.getByLabelText(/^password/i, { selector: "input" }),
    ).toHaveValue("Pikapika1!");
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
    render(<RegisterPage />);

    await user.type(screen.getByLabelText(/email/i), "ash@pallet.com");
    await user.type(
      screen.getByLabelText(/^password/i, { selector: "input" }),
      "Pikapika1!",
    );
    await user.click(screen.getByRole("button", { name: /register/i }));

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /creating account/i }),
      ).toBeDisabled();
    });

    resolveAction(null);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /register/i })).toBeEnabled();
    });
  });
});
