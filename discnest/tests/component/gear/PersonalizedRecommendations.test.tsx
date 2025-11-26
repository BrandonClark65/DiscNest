import { vi, describe, test, expect, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import PersonalizedRecommendations from "@/components/gear/PersonalizedRecommendations";

const mockDiscs = [
  {
    _id: "1",
    name: "Buzzz",
    brand: "Discraft",
    reasons: [{ type: "missing_category", explanation: "Need a midrange." }],
  },
  {
    _id: "2",
    name: "Teebird",
    brand: "Innova",
    reasons: [{ type: "profile_match", explanation: "Works for your arm speed." }],
  },
] as any[];

const fetchMock = vi.fn();
const toastMock = vi.hoisted(() => vi.fn());

vi.mock("react-hot-toast", () => ({
  __esModule: true,
  default: { error: toastMock },
  toast: { error: toastMock },
}));

const discCardMock = vi.hoisted(() => vi.fn(({ disc }: any) => <div>{disc.name}</div>));

vi.mock("@/components/gear/DiscCardGear", () => ({
  __esModule: true,
  default: discCardMock,
}));

const gradientButtonMock = vi.hoisted(() =>
  vi.fn(
  ({ label, onClick }: { label: string; onClick?: () => void }) => (
    <button onClick={onClick}>{label}</button>
  )
));

vi.mock("@/components/ui/GradientButton", () => ({
  __esModule: true,
  default: gradientButtonMock,
}));

vi.mock("framer-motion", () => {
  const Component = ({ children, ...props }: any) => (
    <div data-motion {...props}>
      {children}
    </div>
  );
  return {
    motion: {
      section: Component,
      div: Component,
    },
    AnimatePresence: ({ children }: any) => <>{children}</>,
  };
});

describe("PersonalizedRecommendations", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => mockDiscs,
    });
    toastMock.mockReset();
    discCardMock.mockClear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test("loads and displays recommendations", async () => {
    render(<PersonalizedRecommendations />);

    await waitFor(() => expect(discCardMock).toHaveBeenCalled());

    const calledNames = discCardMock.mock.calls.map(
      ([props]: any[]) => props.disc.name
    );
    expect(calledNames).toEqual(expect.arrayContaining(["Buzzz", "Teebird"]));
    expect(screen.getByText("Buzzz")).toBeInTheDocument();
    expect(screen.getByText("Teebird")).toBeInTheDocument();
  });

  test("handles refresh click", async () => {
    render(<PersonalizedRecommendations />);

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    fetchMock.mockClear();

    await userEvent.click(screen.getByRole("button", { name: "Refresh" }));

    expect(fetchMock).toHaveBeenCalled();
  });

  test("shows error state on fetch failure", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
    });

    render(<PersonalizedRecommendations />);

    await waitFor(() =>
      expect(screen.getByText(/Could not load recommendations/i)).toBeInTheDocument()
    );
    expect(toastMock).toHaveBeenCalled();
  });
});

