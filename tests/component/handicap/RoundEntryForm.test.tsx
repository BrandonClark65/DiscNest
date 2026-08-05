import { describe, test, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RoundEntryForm from "@/components/handicap/RoundEntryForm";

vi.mock("next-auth/react", () => ({
  useSession: vi.fn(() => ({
    data: { user: { id: "current-user" } },
    status: "authenticated",
  })),
}));

const mockToastSuccess = vi.hoisted(() => vi.fn());
const mockToastError = vi.hoisted(() => vi.fn());

vi.mock("react-hot-toast", () => {
  const toastFn = vi.fn() as never as { success: unknown; error: unknown };
  toastFn.success = mockToastSuccess;
  toastFn.error = mockToastError;
  return { default: toastFn };
});

describe("RoundEntryForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockToastSuccess.mockClear();
    mockToastError.mockClear();
    global.fetch = vi.fn();
  });

  test("defaults to PDGA and asks for a round rating", () => {
    render(<RoundEntryForm onSubmit={vi.fn().mockResolvedValue(true)} />);

    expect(screen.getByLabelText(/PDGA round rating/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/total score/i)).not.toBeInTheDocument();
  });

  test("swaps to score and SSA fields when that source is picked", async () => {
    const user = userEvent.setup();
    render(<RoundEntryForm onSubmit={vi.fn().mockResolvedValue(true)} />);

    await user.selectOptions(
      screen.getByLabelText(/How do you want to enter this round/i),
      "score_ssa"
    );

    expect(screen.getByLabelText(/total score/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Course rating/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/PDGA round rating/i)).not.toBeInTheDocument();
  });

  test("swaps to score and par fields for the par source", async () => {
    const user = userEvent.setup();
    render(<RoundEntryForm onSubmit={vi.fn().mockResolvedValue(true)} />);

    await user.selectOptions(
      screen.getByLabelText(/How do you want to enter this round/i),
      "score_par"
    );

    expect(screen.getByLabelText(/total score/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Par/i)).toBeInTheDocument();
  });

  test("warns instead of submitting when the rating is blank", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(true);
    render(<RoundEntryForm onSubmit={onSubmit} />);

    await user.click(screen.getByRole("button", { name: /Add round/i }));

    expect(mockToastError).toHaveBeenCalled();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  test("warns when a score-based round is missing its SSA", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(true);
    render(<RoundEntryForm onSubmit={onSubmit} />);

    await user.selectOptions(
      screen.getByLabelText(/How do you want to enter this round/i),
      "score_ssa"
    );
    await user.type(screen.getByLabelText(/total score/i), "58");
    await user.click(screen.getByRole("button", { name: /Add round/i }));

    expect(mockToastError).toHaveBeenCalled();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  test("submits a well-formed PDGA payload", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(true);
    render(<RoundEntryForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText(/PDGA round rating/i), "942");
    await user.type(screen.getByLabelText(/^Course$/i), "Maple Hill");
    await user.click(screen.getByRole("button", { name: /Add round/i }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));

    const payload = onSubmit.mock.calls[0][0];
    expect(payload).toMatchObject({
      source: "pdga",
      providedRating: 942,
      courseName: "Maple Hill",
      holes: 18,
    });
    // Numbers must be sent as numbers, not the raw input strings.
    expect(typeof payload.providedRating).toBe("number");
  });

  test("submits a well-formed score + SSA payload", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(true);
    render(<RoundEntryForm onSubmit={onSubmit} />);

    await user.selectOptions(
      screen.getByLabelText(/How do you want to enter this round/i),
      "score_ssa"
    );
    await user.type(screen.getByLabelText(/total score/i), "58");
    await user.type(screen.getByLabelText(/Course rating/i), "50.5");
    await user.click(screen.getByRole("button", { name: /Add round/i }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0][0]).toMatchObject({
      source: "score_ssa",
      score: 58,
      ssa: 50.5,
    });
  });

  test("does not submit an out-of-range hole count", async () => {
    // The input carries a native max, so the browser blocks submission before
    // the handler's own guard runs. Either layer is fine - what matters is that
    // nothing reaches onSubmit.
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(true);
    render(<RoundEntryForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText(/PDGA round rating/i), "942");
    const holes = screen.getByLabelText(/Holes/i);
    await user.clear(holes);
    await user.type(holes, "99");
    await user.click(screen.getByRole("button", { name: /Add round/i }));

    expect(onSubmit).not.toHaveBeenCalled();
  });

  test("clears the form after a successful submit", async () => {
    const user = userEvent.setup();
    render(<RoundEntryForm onSubmit={vi.fn().mockResolvedValue(true)} />);

    const ratingInput = screen.getByLabelText(/PDGA round rating/i);
    await user.type(ratingInput, "942");
    await user.click(screen.getByRole("button", { name: /Add round/i }));

    await waitFor(() => expect(ratingInput).toHaveValue(null));
  });

  test("keeps the form filled when the submit handler reports failure", async () => {
    const user = userEvent.setup();
    render(<RoundEntryForm onSubmit={vi.fn().mockResolvedValue(false)} />);

    const ratingInput = screen.getByLabelText(/PDGA round rating/i);
    await user.type(ratingInput, "942");
    await user.click(screen.getByRole("button", { name: /Add round/i }));

    await waitFor(() => expect(ratingInput).toHaveValue(942));
  });

  test("shows the honesty note for UDisc rounds", async () => {
    const user = userEvent.setup();
    render(<RoundEntryForm onSubmit={vi.fn().mockResolvedValue(true)} />);

    await user.selectOptions(
      screen.getByLabelText(/How do you want to enter this round/i),
      "udisc"
    );

    expect(screen.getByText(/no official conversion/i)).toBeInTheDocument();
  });
});
