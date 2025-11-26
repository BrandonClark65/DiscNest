import { describe, test, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import DiscCardCatalog from "@/components/catalog/DiscCardCatalog";
import type { Disc } from "@/types/disc";

const useSessionMock = vi.hoisted(() => vi.fn());
const toastMock = vi.hoisted(() => vi.fn());

vi.mock("next-auth/react", () => ({
  useSession: () => useSessionMock(),
}));

vi.mock("react-hot-toast", () => ({
  __esModule: true,
  default: toastMock,
}));

vi.mock("@/lib/colors", () => ({
  getContrastColor: () => "black",
}));

const baseDisc: Disc = {
  _id: "disc-1",
  name: "Firebird",
  brand: "Innova",
  type: "Driver",
  stability: "Overstable",
  color: "#ffffff",
};

describe("DiscCardCatalog", () => {
  beforeEach(() => {
    toastMock.mockReset();
    useSessionMock.mockReturnValue({ data: null });
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      value: 1024,
    });
  });

  test("shows toast when action clicked while logged out", async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();

    render(
      <DiscCardCatalog
        disc={baseDisc}
        actionLabel="Add"
        onAction={onAction}
      />
    );

    await user.click(screen.getByRole("button", { name: "Add" }));
    expect(toastMock).toHaveBeenCalledWith("Log in to add discs");
    expect(onAction).not.toHaveBeenCalled();
  });

  test("calls onAction when logged in", async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    useSessionMock.mockReturnValue({ data: { user: { id: "user-1" } } });

    render(
      <DiscCardCatalog
        disc={baseDisc}
        actionLabel="Add"
        onAction={onAction}
      />
    );

    await user.click(screen.getByRole("button", { name: "Add" }));
    expect(onAction).toHaveBeenCalled();
  });

  test("handles hover differently on desktop vs mobile", async () => {
    const user = userEvent.setup();
    const onHover = vi.fn();
    useSessionMock.mockReturnValue({ data: { user: { id: "user-1" } } });

    render(
      <DiscCardCatalog
        disc={baseDisc}
        actionLabel="Add"
        onAction={vi.fn()}
        onHover={onHover}
        isRecentlyAdded
      />
    );

    fireEvent.mouseEnter(screen.getByText("Firebird"));
    expect(onHover).toHaveBeenCalledWith(baseDisc);

    fireEvent.mouseLeave(screen.getByText("Firebird"));
    expect(onHover).toHaveBeenCalledWith(null);

    Object.defineProperty(window, "innerWidth", {
      writable: true,
      value: 500,
    });
    render(
      <DiscCardCatalog
        disc={baseDisc}
        actionLabel="Add"
        onAction={vi.fn()}
        onHover={onHover}
      />
    );

    await user.click(screen.getAllByText("Firebird")[1]);
    expect(onHover).toHaveBeenCalledWith(baseDisc);
  });
});

