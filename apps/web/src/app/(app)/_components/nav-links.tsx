"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "My Pokémon" },
  { href: "/shop", label: "Shop" },
];

type Indicator = { left: number; width: number };

export function NavLinks({ className }: { className?: string }) {
  const pathname = usePathname();
  const navRef = useRef<HTMLElement>(null);
  const linkRefs = useRef<Record<string, HTMLAnchorElement | null>>({});
  const [indicator, setIndicator] = useState<Indicator | null>(null);
  const [enableTransition, setEnableTransition] = useState(false);

  useEffect(() => {
    const activeLink = linkRefs.current[pathname];
    if (!activeLink || !navRef.current) {
      setIndicator(null);
      return;
    }
    const linkRect = activeLink.getBoundingClientRect();
    const navRect = navRef.current.getBoundingClientRect();
    setIndicator({
      left: linkRect.left - navRect.left,
      width: linkRect.width,
    });
  }, [pathname]);

  useEffect(() => {
    if (!indicator) {
      return;
    }
    const id = requestAnimationFrame(() => setEnableTransition(true));
    return () => cancelAnimationFrame(id);
  }, [indicator]);

  return (
    <nav
      ref={navRef}
      className={cn("relative flex items-center gap-4", className)}
    >
      {links.map((link) => {
        const isActive = pathname === link.href;
        return (
          <Link
            key={link.href}
            ref={(el) => {
              linkRefs.current[link.href] = el;
            }}
            href={link.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "text-sm font-medium whitespace-nowrap transition-colors hover:text-stone-900",
              isActive ? "text-stone-900" : "text-stone-500",
            )}
          >
            {link.label}
          </Link>
        );
      })}
      {indicator && (
        <span
          aria-hidden
          data-testid="nav-indicator"
          className={cn(
            "pointer-events-none absolute top-full mt-1.5 h-[3px] rounded-full bg-stone-900",
            enableTransition && "transition-all duration-300 ease-out",
          )}
          style={{ left: indicator.left, width: indicator.width }}
        />
      )}
    </nav>
  );
}
