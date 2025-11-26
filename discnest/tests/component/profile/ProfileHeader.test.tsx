import { vi, type Mock, describe, test, expect, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import ProfileHeader from "@/components/profile/ProfileHeader";

vi.mock("next/image", () => ({
  __esModule: true,
  default: ({ fill, ...props }: any) => <img data-testid="avatar" {...props} />,
}));

const gradientButtonMock = vi.hoisted(() =>
  vi.fn(
    ({ label, onClick, disabled }: any) => (
      <button onClick={onClick} disabled={disabled}>
        {label}
      </button>
    )
  )
);

vi.mock("@/components/ui/GradientButton", () => ({
  __esModule: true,
  default: gradientButtonMock,
}));

describe("ProfileHeader", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  test("renders welcome text and disc count", () => {
    render(<ProfileHeader name="Alex" discCount={2} />);
    expect(screen.getByText(/Welcome, Alex/)).toBeInTheDocument();
    expect(screen.getByText(/2 Discs/)).toBeInTheDocument();
  });

  test("uploads avatar and updates image", async () => {
    const user = userEvent.setup();
    (global.fetch as unknown as Mock).mockResolvedValue({
      json: () => Promise.resolve({ avatarUrl: "/new.png" }),
    });

    const { container } = render(
      <ProfileHeader name="Alex" discCount={1} avatarUrl="/old.png" />
    );

    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(["avatar"], "avatar.png", { type: "image/png" });
    await user.upload(input, file);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/profile/avatar", expect.anything());
      expect(screen.getByTestId("avatar")).toHaveAttribute("src", "/new.png");
    });
  });
});

