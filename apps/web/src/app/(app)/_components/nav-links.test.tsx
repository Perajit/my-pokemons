// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import type { Mock } from "vitest";
import { render, screen } from "@testing-library/react";
import * as React from "react";

vi.mock("next/link", () => ({
  default: function MockLink({
    ref,
    children,
    href,
    className,
    ...rest
  }: {
    ref?: React.Ref<HTMLAnchorElement>;
    children: React.ReactNode;
    href: string;
    className?: string;
  } & React.AnchorHTMLAttributes<HTMLAnchorElement>) {
    return (
      <a ref={ref} href={href} className={className} {...rest}>
        {children}
      </a>
    );
  },
}));

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(),
}));

import { usePathname } from "next/navigation";
import { NavLinks } from "./nav-links";

describe("NavLinks", () => {
  it("renders both nav links", () => {
    (usePathname as Mock).mockReturnValue("/");
    render(<NavLinks />);

    expect(screen.getByRole("link", { name: /my pokémon/i })).toHaveAttribute(
      "href",
      "/",
    );
    expect(screen.getByRole("link", { name: /shop/i })).toHaveAttribute(
      "href",
      "/shop",
    );
  });

  it("marks the dashboard link active on /", () => {
    (usePathname as Mock).mockReturnValue("/");
    render(<NavLinks />);

    expect(screen.getByRole("link", { name: /my pokémon/i })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: /shop/i })).not.toHaveAttribute(
      "aria-current",
    );
  });

  it("marks the shop link active on /shop", () => {
    (usePathname as Mock).mockReturnValue("/shop");
    render(<NavLinks />);

    expect(screen.getByRole("link", { name: /shop/i })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(
      screen.getByRole("link", { name: /my pokémon/i }),
    ).not.toHaveAttribute("aria-current");
  });

  it("renders an indicator when a link is active", () => {
    (usePathname as Mock).mockReturnValue("/shop");
    render(<NavLinks />);

    expect(screen.getByTestId("nav-indicator")).toBeInTheDocument();
  });

  it("renders no indicator when no link matches", () => {
    (usePathname as Mock).mockReturnValue("/somewhere-else");
    render(<NavLinks />);

    expect(screen.queryByTestId("nav-indicator")).not.toBeInTheDocument();
  });
});
