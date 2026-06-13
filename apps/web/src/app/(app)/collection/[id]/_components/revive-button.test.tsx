// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import * as React from "react";

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
  } & React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

import { ReviveButton } from "./revive-button";

describe("ReviveButton", () => {
  it("renders the owned count and triggers onRevive when clicked", () => {
    const onRevive = vi.fn();
    render(
      <ReviveButton reviveCount={2} isPending={false} onRevive={onRevive} />,
    );

    const button = screen.getByRole("button", { name: /revive/i });
    expect(button.textContent).toContain("×2");
    fireEvent.click(button);
    expect(onRevive).toHaveBeenCalledOnce();
  });

  it("shows a pending label and is disabled while reviving", () => {
    render(
      <ReviveButton reviveCount={2} isPending={true} onRevive={vi.fn()} />,
    );

    expect(screen.getByRole("button", { name: /reviving/i })).toBeDisabled();
  });

  it("disables Revive and links to the shop when the user owns none", () => {
    render(
      <ReviveButton reviveCount={0} isPending={false} onRevive={vi.fn()} />,
    );

    expect(screen.getByRole("button", { name: /revive/i })).toBeDisabled();
    expect(
      screen.getByRole("link", { name: /get a revive in the shop/i }),
    ).toHaveAttribute("href", "/shop");
  });
});
