// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import type { BondLevelKey } from "@my-pokemons/config/bond-levels";
import { BondLevelSteps } from "./bond-level-steps";

const LEVEL_NAMES = [
  "New Friend",
  "Close Friend",
  "Best Friend",
  "True Companion",
  "Lifetime Companion",
];

describe("BondLevelSteps", () => {
  it("renders all five levels as steps in ascending threshold order", () => {
    render(<BondLevelSteps earned={[]} />);
    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(5);
    LEVEL_NAMES.forEach((name, i) => {
      expect(items[i]).toHaveTextContent(name);
    });
  });

  it("shows the day threshold for each level", () => {
    render(<BondLevelSteps earned={[]} />);
    ["1d", "7d", "30d", "90d", "365d"].forEach((days) => {
      expect(screen.getByText(days)).toBeInTheDocument();
    });
  });

  it("marks earned levels data-earned=true and locks the rest", () => {
    render(
      <BondLevelSteps
        earned={[
          "BOND_LEVEL_1D" as BondLevelKey,
          "BOND_LEVEL_30D" as BondLevelKey,
        ]}
      />,
    );
    expect(
      screen.getAllByRole("listitem").map((i) => i.getAttribute("data-earned")),
    ).toEqual(["true", "false", "true", "false", "false"]);
  });

  it("renders an icon per level", () => {
    const { container } = render(<BondLevelSteps earned={[]} />);
    expect(container.querySelectorAll("svg")).toHaveLength(5);
  });

  it("renders all locked when none are earned", () => {
    render(<BondLevelSteps earned={[]} />);
    screen.getAllByRole("listitem").forEach((item) => {
      expect(item).toHaveAttribute("data-earned", "false");
    });
  });
});
