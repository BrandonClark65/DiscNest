import { describe, test, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import HandicapSummary from "@/components/handicap/HandicapSummary";
import type { HandicapResult } from "@/lib/handicap/handicapUtils";

vi.mock("next-auth/react", () => ({
  useSession: vi.fn(() => ({ data: null, status: "unauthenticated" })),
}));

const makeResult = (overrides: Partial<HandicapResult> = {}): HandicapResult => ({
  rating: 914,
  provisional: false,
  sampleSize: 10,
  countedRounds: 3,
  countedIndices: [0, 1, 2],
  handicapThrows: 8,
  handicapUnrounded: 8.6,
  targetRating: 1000,
  hasEstimatedRounds: false,
  adjustments: [],
  ...overrides,
});

describe("HandicapSummary handicap direction", () => {
  const noop = () => {};

  test("a below-target player is shown as receiving throws", () => {
    render(
      <HandicapSummary result={makeResult()} targetRating={1000} onTargetRatingChange={noop} />
    );

    expect(screen.getByText("8")).toBeInTheDocument();
    expect(screen.getByText(/throws received/i)).toBeInTheDocument();
  });

  test("an above-target player is shown as giving throws back", () => {
    render(
      <HandicapSummary
        result={makeResult({ rating: 1040, handicapThrows: -4, handicapUnrounded: -4.2 })}
        targetRating={1000}
        onTargetRatingChange={noop}
      />
    );

    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.getByText(/throws given back/i)).toBeInTheDocument();
  });

  test("never renders a golf-style plus sign", () => {
    // In golf a "+" handicap means BETTER than scratch, so "+8" on a 914-rated
    // player reads as the exact opposite of what it means. Guard against the
    // notation coming back.
    const { container } = render(
      <HandicapSummary result={makeResult()} targetRating={1000} onTargetRatingChange={noop} />
    );
    expect(container.textContent).not.toMatch(/\+\s*8/);
  });

  test("shows the magnitude unsigned, never negative", () => {
    const { container } = render(
      <HandicapSummary
        result={makeResult({ rating: 1040, handicapThrows: -4 })}
        targetRating={1000}
        onTargetRatingChange={noop}
      />
    );
    expect(container.textContent).not.toContain("-4");
    expect(container.textContent).not.toContain("−4");
  });

  test("refuses to show a number below the round minimum", () => {
    render(
      <HandicapSummary
        result={makeResult({ rating: null, handicapThrows: null, sampleSize: 2 })}
        targetRating={1000}
        onTargetRatingChange={noop}
      />
    );
    expect(screen.getByText(/more round/i)).toBeInTheDocument();
    expect(screen.queryByText(/throws received/i)).not.toBeInTheDocument();
  });

  test("flags a provisional record", () => {
    render(
      <HandicapSummary
        result={makeResult({ provisional: true, sampleSize: 5 })}
        targetRating={1000}
        onTargetRatingChange={noop}
      />
    );
    expect(screen.getByText(/provisional/i)).toBeInTheDocument();
  });
});
