// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import type { Mock } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("./actions", () => ({
  logoutAction: vi.fn(),
}));

import { auth } from "@/lib/auth";
import HomePage from "./page";

describe("HomePage", () => {
  it("shows user email when name is not set", async () => {
    (auth as Mock).mockResolvedValue({
      user: { email: "alice@example.com", name: null },
    });

    render(await HomePage());

    expect(screen.getByText(/alice@example\.com/)).toBeInTheDocument();
  });

  it("shows user name when name is set", async () => {
    (auth as Mock).mockResolvedValue({
      user: { email: "alice@example.com", name: "Alice" },
    });

    render(await HomePage());

    expect(screen.getByText(/Alice/)).toBeInTheDocument();
  });

  it("renders a logout button", async () => {
    (auth as Mock).mockResolvedValue({
      user: { email: "alice@example.com", name: null },
    });

    render(await HomePage());

    expect(screen.getByRole("button", { name: /logout/i })).toBeInTheDocument();
  });
});
