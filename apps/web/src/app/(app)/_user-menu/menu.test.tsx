// @vitest-environment jsdom

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as React from "react";

vi.mock("@/app/actions", () => ({ logoutAction: vi.fn() }));

import { UserMenu } from "./menu";

const namedUser: { name: string | null; email: string } = {
  name: "Ash Ketchum",
  email: "ash@example.com",
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("UserMenu", () => {
  it("renders an account-menu trigger showing the user's initials", () => {
    render(<UserMenu user={namedUser} />);
    const trigger = screen.getByRole("button", { name: /account menu/i });
    expect(within(trigger).getByText("AK")).toBeInTheDocument();
  });

  it("opens the menu on click, revealing identity and a logout item", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    render(<UserMenu user={namedUser} />);

    // Base UI's menu trigger opens on mousedown via floating-ui; drive it with a
    // full pointer press rather than a synthetic click.
    await user.pointer({
      keys: "[MouseLeft]",
      target: screen.getByRole("button", { name: /account menu/i }),
    });

    expect(await screen.findByText("Ash Ketchum")).toBeInTheDocument();
    expect(screen.getByText("ash@example.com")).toBeInTheDocument();
    expect(
      screen.getByRole("menuitem", { name: /log out/i }),
    ).toBeInTheDocument();
  });

  it("links to the settings page from the identity row", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    render(<UserMenu user={namedUser} />);

    await user.pointer({
      keys: "[MouseLeft]",
      target: screen.getByRole("button", { name: /account menu/i }),
    });

    const profileLink = await screen.findByRole("menuitem", {
      name: /ash ketchum/i,
    });
    expect(profileLink).toHaveAttribute("href", "/settings");
  });

  it("shows the email when the user has no name set", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    render(<UserMenu user={{ name: null, email: "misty@example.com" }} />);

    await user.pointer({
      keys: "[MouseLeft]",
      target: screen.getByRole("button", { name: /account menu/i }),
    });

    expect(await screen.findByText("misty@example.com")).toBeInTheDocument();
  });
});
