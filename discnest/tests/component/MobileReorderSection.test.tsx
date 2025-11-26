import { vi, describe, test, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import MobileReorderSection from "@/components/gear/MobileReorderSection";
import type { Disc } from "@/types/disc";

const cardMock = vi.hoisted(() =>
  vi.fn(({ disc, actionLabel, onAction }: any) => (
    <div>
      <span>{disc.name}</span>
      <button onClick={onAction}>{actionLabel}</button>
    </div>
  ))
);

vi.mock("@/components/gear/DiscCardGear", () => ({
  __esModule: true,
  default: cardMock,
}));

const baseDiscs: Disc[] = [
  { _id: "1", name: "Aviar" },
  { _id: "2", name: "Buzzz" },
  { _id: "3", name: "Destroyer" },
] as Disc[];

describe("MobileReorderSection", () => {
  const onAction = vi.fn();
  const onDelete = vi.fn();
  const onEdit = vi.fn();
  const onReorder = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("renders disc cards with action button", () => {
    render(
      <MobileReorderSection
        discs={baseDiscs}
        zone="bag"
        actionLabel="Move"
        onAction={onAction}
        onDelete={onDelete}
        onEdit={onEdit}
        onReorder={onReorder}
        reorderMode={false}
      />
    );

    expect(cardMock).toHaveBeenCalledTimes(3);
    expect(screen.getByText(/Aviar/i)).toBeInTheDocument();
  });

  test("invokes onReorder when moving disc up/down", async () => {
    render(
      <MobileReorderSection
        discs={baseDiscs}
        zone="bag"
        actionLabel="Move"
        onAction={onAction}
        onDelete={onDelete}
        onEdit={onEdit}
        onReorder={onReorder}
        reorderMode
      />
    );

    const upButtons = screen.getAllByRole("button", { name: "Move up" });
    await userEvent.click(upButtons[1]);

    expect(onReorder).toHaveBeenCalledWith(["2", "1", "3"], "bag");
  });
});

