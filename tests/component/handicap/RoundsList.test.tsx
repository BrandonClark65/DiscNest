import { describe, test, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import RoundsList, { type DisplayRound } from "@/components/handicap/RoundsList";

const makeRound = (overrides: Partial<DisplayRound> = {}): DisplayRound => ({
  _id: "r1",
  source: "pdga",
  courseName: "Maple Hill",
  date: "2026-08-07T00:00:00.000Z",
  holes: 18,
  computedRating: 950,
  estimated: false,
  roundType: "casual",
  ...overrides,
});

describe("RoundsList dates", () => {
  /**
   * Regression guard for the reported bug: a round entered as Aug 7 listed as
   * Aug 6 for every user west of UTC, because a day stored as midnight UTC was
   * rendered in the browser's local zone.
   *
   * The expected string is built from a locally-constructed Aug 7 rather than
   * hardcoded, so this holds under any locale and any TZ the suite runs in.
   */
  test("shows the day the round was played, not the previous day", () => {
    render(<RoundsList rounds={[makeRound()]} countedIndices={[]} />);

    expect(
      screen.getByText(new Date(2026, 7, 7).toLocaleDateString())
    ).toBeInTheDocument();
  });

  test("is correct across a year boundary", () => {
    render(
      <RoundsList
        rounds={[makeRound({ date: "2026-01-01T00:00:00.000Z" })]}
        countedIndices={[]}
      />
    );

    expect(
      screen.getByText(new Date(2026, 0, 1).toLocaleDateString())
    ).toBeInTheDocument();
  });

  test("renders each round on its own date", () => {
    render(
      <RoundsList
        rounds={[
          makeRound({ _id: "a", date: "2026-08-07T00:00:00.000Z" }),
          makeRound({ _id: "b", date: "2026-07-31T00:00:00.000Z" }),
        ]}
        countedIndices={[0]}
      />
    );

    expect(
      screen.getByText(new Date(2026, 7, 7).toLocaleDateString())
    ).toBeInTheDocument();
    expect(
      screen.getByText(new Date(2026, 6, 31).toLocaleDateString())
    ).toBeInTheDocument();
  });
});
