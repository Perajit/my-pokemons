// @vitest-environment jsdom

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import * as React from "react";
import { UserAvatar, initialsFrom } from "./user-avatar";

describe("initialsFrom", () => {
  it("uses the first letters of the first and last name tokens", () => {
    expect(initialsFrom("Ash Ketchum", "ash@example.com")).toBe("AK");
  });

  it("uses a single letter for a single-token name", () => {
    expect(initialsFrom("Ash", "ash@example.com")).toBe("A");
  });

  it("collapses extra whitespace between tokens", () => {
    expect(initialsFrom("  Ash   Ketchum  ", "ash@example.com")).toBe("AK");
  });

  it("falls back to the email local-part initial when the name is blank", () => {
    expect(initialsFrom("", "misty@example.com")).toBe("M");
    expect(initialsFrom(null, "brock@example.com")).toBe("B");
    expect(initialsFrom("   ", "gary@example.com")).toBe("G");
  });

  it("uppercases the result", () => {
    expect(initialsFrom("ash ketchum", "a@example.com")).toBe("AK");
  });
});

describe("UserAvatar", () => {
  it("renders the derived initials", () => {
    render(<UserAvatar name="Ash Ketchum" email="ash@example.com" />);
    expect(screen.getByText("AK")).toBeInTheDocument();
  });
});
