import { vi, describe, test, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import DiscCardGear from "@/components/gear/DiscCardGear";
import type { Disc } from "@/types/disc";

const toastFn = vi.hoisted(() => vi.fn());
const useSessionMock = vi.hoisted(() => vi.fn());

vi.mock("next-auth/react", () => ({
  useSession: () => useSessionMock(),
}));

vi.mock("react-hot-toast", () => ({
  __esModule: true,
  default: toastFn,
  toast: toastFn,
}));

vi.mock("@/lib/colors", () => ({
  getContrastColor: () => "black",
}));

const baseDisc: Disc = {
  _id: "disc-1",
  name: "Buzzz",
  brand: "Discraft",
  type: "Midrange",
  stability: "Straight",
};

describe("DiscCardGear", () => {
  beforeEach(() => {
    toastFn.mockReset();
    useSessionMock.mockReturnValue({ data: null });
  });

  test("shows toast when action clicked while logged out", async () => {
    const onAction = vi.fn();
    render(
      <DiscCardGear disc={baseDisc} actionLabel="Add" onAction={onAction} />
    );

    await userEvent.click(screen.getByRole("button", { name: "Add" }));

    expect(toastFn).toHaveBeenCalledWith("Log in to manage your discs");
    expect(onAction).not.toHaveBeenCalled();
  });

  test("calls onAction when logged in", async () => {
    useSessionMock.mockReturnValue({ data: { user: { id: "user-1" } } });
    const onAction = vi.fn();
    render(
      <DiscCardGear disc={baseDisc} actionLabel="Add" onAction={onAction} />
    );

    await userEvent.click(screen.getByRole("button", { name: "Add" }));

    expect(onAction).toHaveBeenCalled();
  });

  test("invokes edit and delete handlers", async () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    render(
      <DiscCardGear
        disc={baseDisc}
        onEdit={onEdit}
        onDelete={onDelete}
        actionLabel="Add"
      />
    );

    await userEvent.click(screen.getByText(/Edit/i));
    expect(onEdit).toHaveBeenCalledWith(baseDisc);

    await userEvent.click(screen.getByText(/Remove/i));
    expect(onDelete).toHaveBeenCalled();
  });

  test("calls hover callbacks on enter and leave", () => {
    const onHover = vi.fn();

    render(<DiscCardGear disc={baseDisc} onHover={onHover} />);

    const info = screen.getByText(/Buzzz/i).closest("div");
    const card = info?.parentElement as HTMLElement;
    fireEvent.mouseEnter(card);
    fireEvent.mouseLeave(card);

    expect(onHover).toHaveBeenCalledWith(baseDisc);
    expect(onHover).toHaveBeenLastCalledWith(null);
  });
});

