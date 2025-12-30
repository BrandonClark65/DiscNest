import { describe, test, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RatingPrompt from "@/components/ratings/RatingPrompt";

// Mock sessionStorage
const sessionStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, "sessionStorage", {
  value: sessionStorageMock,
});

// Mock RatingForm
vi.mock("@/components/ratings/RatingForm", () => ({
  default: ({ onSuccess, onCancel }: { onSuccess?: () => void; onCancel?: () => void }) => (
    <div data-testid="rating-form">
      <button onClick={onSuccess}>Submit</button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  ),
}));

describe("RatingPrompt", () => {
  beforeEach(() => {
    sessionStorageMock.clear();
  });

  test("renders prompt banner", () => {
    render(
      <RatingPrompt
        ratedUserId="user-123"
        ratedUserName="John Doe"
        role="buyer"
      />
    );

    expect(screen.getByText(/Rate your experience with John Doe/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Rate Now/i })).toBeInTheDocument();
  });

  test("shows rating form when 'Rate Now' clicked", async () => {
    const user = userEvent.setup();
    render(
      <RatingPrompt
        ratedUserId="user-123"
        ratedUserName="John Doe"
        role="buyer"
      />
    );

    await user.click(screen.getByRole("button", { name: /Rate Now/i }));

    expect(screen.getByTestId("rating-form")).toBeInTheDocument();
  });

  test("dismisses prompt when X button clicked", async () => {
    const user = userEvent.setup();
    const onDismiss = vi.fn();

    render(
      <RatingPrompt
        ratedUserId="user-123"
        ratedUserName="John Doe"
        role="buyer"
        onDismiss={onDismiss}
      />
    );

    const dismissButton = screen.getAllByRole("button").find(
      (btn) => btn.getAttribute("aria-label") === "Dismiss"
    );
    if (dismissButton) {
      await user.click(dismissButton);
    }

    expect(onDismiss).toHaveBeenCalled();
  });

  test("does not render if already dismissed in sessionStorage", () => {
    sessionStorageMock.setItem("rating-dismissed-user-123-listing-456", "true");

    const { container } = render(
      <RatingPrompt
        ratedUserId="user-123"
        ratedUserName="John Doe"
        listingId="listing-456"
        role="buyer"
      />
    );

    expect(container.firstChild).toBeNull();
  });

  test("calls onRated when rating submitted", async () => {
    const user = userEvent.setup();
    const onRated = vi.fn();

    render(
      <RatingPrompt
        ratedUserId="user-123"
        ratedUserName="John Doe"
        role="buyer"
        onRated={onRated}
      />
    );

    await user.click(screen.getByRole("button", { name: /Rate Now/i }));
    await user.click(screen.getByRole("button", { name: /Submit/i }));

    expect(onRated).toHaveBeenCalled();
  });

  test("auto-dismisses after rating", async () => {
    const user = userEvent.setup();
    render(
      <RatingPrompt
        ratedUserId="user-123"
        ratedUserName="John Doe"
        listingId="listing-456"
        role="buyer"
      />
    );

    await user.click(screen.getByRole("button", { name: /Rate Now/i }));
    await user.click(screen.getByRole("button", { name: /Submit/i }));

    // Should be dismissed in sessionStorage
    expect(
      sessionStorageMock.getItem("rating-dismissed-user-123-listing-456")
    ).toBe("true");
  });
});

