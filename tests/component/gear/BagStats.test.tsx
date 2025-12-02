import { vi, describe, test, expect, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import BagStats from "@/components/gear/BagStats";
import type { Disc } from "@/types/disc";

vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, onClick, ...props }: any) => (
      <div onClick={onClick} {...props}>
        {children}
      </div>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const makeDisc = (overrides: Partial<Disc> = {}): Disc => ({
  _id: overrides._id ?? crypto.randomUUID(),
  name: overrides.name ?? "Disc",
  brand: overrides.brand,
  type: overrides.type,
  stability: overrides.stability,
  plastic: overrides.plastic,
  weight: overrides.weight,
  wearLevel: overrides.wearLevel,
  flight: overrides.flight,
});

describe("BagStats", () => {
  const originalWidth = window.innerWidth;

  beforeEach(() => {
    window.innerWidth = 1024;
  });

  afterEach(() => {
    window.innerWidth = originalWidth;
  });

  test("displays stats when opened", async () => {
    const bag: Disc[] = [
      makeDisc({
        name: "Buzzz",
        brand: "Discraft",
        type: "Midrange",
        plastic: "ESP",
        stability: "Straight",
        wearLevel: 20,
        weight: 177,
        flight: { speed: 5, glide: 4, turn: -1, fade: 1 },
      }),
      makeDisc({
        name: "Firebird",
        brand: "Innova",
        type: "Fairway",
        plastic: "Champion",
        stability: "Overstable",
        wearLevel: 80,
        weight: 173,
        flight: { speed: 9, glide: 3, turn: 0, fade: 4 },
      }),
    ];

    render(<BagStats bag={bag} />);

    await userEvent.click(screen.getByRole("button", { name: /View Bag Stats/i }));

    const totalRow = screen.getByText(/Total Discs:/i).parentElement;
    const uniqueRow = screen.getByText(/Unique Molds:/i).parentElement;
    const avgWeightRow = screen.getByText(/Avg Weight:/i).parentElement;

    expect(totalRow).toHaveTextContent(/Total Discs:\s*2/);
    expect(uniqueRow).toHaveTextContent(/Unique Molds:\s*2/);
    expect(avgWeightRow).toHaveTextContent(/175\.0g/);

    const completenessRow = screen.getByText(/Bag Completeness:/i).parentElement;
    expect(completenessRow).toHaveTextContent(/2\/4/);
    expect(screen.getByText(/Avg Flight:/i)).toBeInTheDocument();
  });

  test("closes when clicking outside", async () => {
    render(<BagStats bag={[makeDisc({ name: "Aviar", type: "Putter" })]} />);

    await userEvent.click(screen.getByRole("button", { name: /View Bag Stats/i }));
    expect(screen.getByText(/Bag Stats/i)).toBeInTheDocument();

    await userEvent.click(document.body);

    expect(screen.queryByText(/Bag Stats/i)).not.toBeInTheDocument();
  });

  test("shows empty message when no discs", async () => {
    render(<BagStats bag={[]} />);

    await userEvent.click(screen.getByRole("button", { name: /View Bag Stats/i }));

    expect(screen.getByText(/No discs in bag/i)).toBeInTheDocument();
  });
});

