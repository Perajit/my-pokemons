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

    expect(screen.getByRole("link", { name: /collection/i })).toHaveAttribute(
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

    expect(screen.getByRole("link", { name: /collection/i })).toHaveAttribute(
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
      screen.getByRole("link", { name: /collection/i }),
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

  it("cancels the pending requestAnimationFrame on unmount", () => {
    (usePathname as Mock).mockReturnValue("/");
    const cancelSpy = vi.spyOn(window, "cancelAnimationFrame");
    const { unmount } = render(<NavLinks />);
    unmount();
    expect(cancelSpy).toHaveBeenCalled();
    cancelSpy.mockRestore();
  });

  it("adds the transition class to the indicator after the rAF fires", () => {
    (usePathname as Mock).mockReturnValue("/");
    const rafSpy = vi
      .spyOn(window, "requestAnimationFrame")
      .mockImplementation((cb: FrameRequestCallback) => {
        cb(0);
        return 0;
      });

    render(<NavLinks />);

    expect(screen.getByTestId("nav-indicator").className).toContain(
      "transition-all",
    );
    rafSpy.mockRestore();
  });
});
