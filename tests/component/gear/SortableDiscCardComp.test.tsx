import { vi, describe, test, expect } from "vitest";
import { render, screen } from "@testing-library/react";

import SortableDiscCard from "@/components/gear/SortableDiscCardComp";
import type { Disc } from "@/types/disc";

const sortableMock = vi.hoisted(() => ({
  fn: vi.fn(() => ({
    attributes: { role: "button" },
    listeners: { onPointerDown: vi.fn() },
    setNodeRef: vi.fn(),
    transform: { x: 10, y: 5, scaleX: 1, scaleY: 1 },
    transition: "transform 250ms ease",
  })),
}));

const useSortableMock = sortableMock.fn;

vi.mock("@dnd-kit/sortable", () => ({
  useSortable: sortableMock.fn,
}));

const discCardMock = vi.hoisted(() =>
  vi.fn(() => <div data-testid="disc-card">Disc</div>)
);

vi.mock("@/components/gear/DiscCardGear", () => ({
  __esModule: true,
  default: discCardMock,
}));

const sampleDisc: Disc = {
  _id: "disc-1",
  name: "Buzzz",
};

describe("SortableDiscCardComp", () => {
  test("renders DiscCardGear with sortable props", () => {
    const onAction = vi.fn();
    const onDelete = vi.fn();
    const onEdit = vi.fn();

    const { container } = render(
      <SortableDiscCard
        disc={sampleDisc}
        actionLabel="Move"
        onAction={onAction}
        onDelete={onDelete}
        onEdit={onEdit}
      />
    );

    expect(useSortableMock).toHaveBeenCalledWith({ id: "disc-1" });
    expect(discCardMock).toHaveBeenCalledWith(
      expect.objectContaining({
        disc: sampleDisc,
        actionLabel: "Move",
        onAction,
        onDelete,
      }),
      undefined
    );

    const wrapper = container.firstChild as HTMLDivElement;
    expect(wrapper.style.transform).toContain("10px");
    expect(wrapper.style.transition).toBe("transform 250ms ease");
  });
});

