import { vi, describe, test, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import BagAnalyzer from "@/components/gear/BagAnalyzer";
import type { Disc } from "@/types/disc";

vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children }: any) => <div>{children}</div>,
  },
}));

const makeDisc = (overrides: Partial<Disc> = {}): Disc => ({
  _id: overrides._id ?? "disc",
  name: overrides.name ?? "Disc",
  type: overrides.type,
  brand: overrides.brand,
  flight: overrides.flight,
});

describe("BagAnalyzer", () => {
  test("shows balanced message when bag is empty", () => {
    render(<BagAnalyzer bag={[]} />);

    expect(
      screen.getByText(/You have a balanced mix of disc types/i)
    ).toBeInTheDocument();
  });

  test("lists missing categories and suggestions", () => {
    const bag: Disc[] = [
      makeDisc({
        _id: "p1",
        name: "Aviar",
        type: "Putter",
        flight: { speed: 3, glide: 3, turn: 0, fade: 1 },
      }),
      makeDisc({
        _id: "d1",
        name: "Zeus",
        type: "Distance Driver",
        flight: { speed: 12, glide: 5, turn: -1, fade: 3 },
      }),
    ];

    render(<BagAnalyzer bag={bag} />);

    expect(screen.getByText(/Missing:/i)).toHaveTextContent(
      /Midrange.*Fairway Driver/
    );
    expect(screen.getByText(/Avg. Speed:/i)).toHaveTextContent("7.5");
    expect(
      screen.getByText(/Add a control driver/i, { exact: false })
    ).toBeInTheDocument();
  });

  test("toggles panel visibility", async () => {
    const bag: Disc[] = [makeDisc({ type: "Putter" })];
    render(<BagAnalyzer bag={bag} />);

    expect(screen.queryByText(/Suggestions:/i)).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /Bag Analysis/i }));

    expect(screen.queryByText(/Suggestions:/i)).not.toBeInTheDocument();
  });
});

