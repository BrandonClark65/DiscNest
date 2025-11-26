import { vi, describe, test, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import GearSection from "@/components/gear/GearSection";
import type { Disc } from "@/types/disc";

const useDroppableMock = vi.hoisted(() =>
  vi.fn(() => ({
    setNodeRef: vi.fn(),
    isOver: false,
  }))
);

vi.mock("@dnd-kit/core", () => ({
  useDroppable: () => useDroppableMock(),
}));

const sortableMocks = vi.hoisted(() => ({
  context: vi.fn(({ children }: any) => <div>{children}</div>),
  strategy: vi.fn(),
}));

vi.mock("@dnd-kit/sortable", () => ({
  SortableContext: sortableMocks.context,
  verticalListSortingStrategy: sortableMocks.strategy,
}));

const cardMock = vi.hoisted(() => vi.fn(() => <div data-testid="disc-card">Disc</div>));

vi.mock("@/components/gear/SortableDiscCardComp", () => ({
  __esModule: true,
  default: cardMock,
}));

const mobileReorderMock = vi.hoisted(() => vi.fn(() => <div>Mobile Reorder</div>));

vi.mock("@/components/gear/MobileReorderSection", () => ({
  __esModule: true,
  default: mobileReorderMock,
}));

const gradientButtonMock = vi.hoisted(() =>
  vi.fn(
    ({ label, onClick }: { label: string; onClick?: () => void }) => (
      <button onClick={onClick}>{label}</button>
    )
  )
);

vi.mock("@/components/ui/GradientButton", () => ({
  __esModule: true,
  default: gradientButtonMock,
}));

const baseDisc: Disc = {
  _id: "disc-1",
  name: "Buzzz",
  brand: "Discraft",
  type: "Midrange",
};

describe("GearSection", () => {
  beforeEach(() => {
    cardMock.mockClear();
    mobileReorderMock.mockClear();
    gradientButtonMock.mockClear();
    sortableMocks.context.mockClear();
  });

  test("asks user to log in when not authenticated", () => {
    render(
      <GearSection
        title="Bag"
        discs={[baseDisc]}
        zoneId="bag"
        actionLabel="Move"
        onAction={vi.fn()}
        onDelete={vi.fn()}
        onEdit={vi.fn()}
      />
    );

    expect(screen.getByText(/Log in to add discs/i)).toBeInTheDocument();
  });

  test("shows loading and empty states", () => {
    const { rerender } = render(
      <GearSection
        title="Bag"
        discs={[]}
        zoneId="bag"
        actionLabel="Move"
        onAction={vi.fn()}
        onDelete={vi.fn()}
        onEdit={vi.fn()}
        loading
        loggedIn
      />
    );

    expect(screen.getByText(/Loading discs/i)).toBeInTheDocument();

    rerender(
      <GearSection
        title="Bag"
        discs={[]}
        zoneId="bag"
        actionLabel="Move"
        onAction={vi.fn()}
        onDelete={vi.fn()}
        onEdit={vi.fn()}
        loggedIn
        emptyMessage="Nothing here"
      />
    );

    expect(screen.getByText(/Nothing here/i)).toBeInTheDocument();
  });

  test("renders sortable cards when discs exist", () => {
    render(
      <GearSection
        title="Bag"
        discs={[baseDisc]}
        zoneId="bag"
        actionLabel="Move"
        onAction={vi.fn()}
        onDelete={vi.fn()}
        onEdit={vi.fn()}
        sortable
        loggedIn
      />
    );

    expect(cardMock).toHaveBeenCalled();
  });

  test("shows mobile reorder section when on mobile", () => {
    render(
      <GearSection
        title="Bag"
        discs={[baseDisc]}
        zoneId="bag"
        actionLabel="Move"
        onAction={vi.fn()}
        onDelete={vi.fn()}
        onEdit={vi.fn()}
        sortable
        loggedIn
        isMobile
        onReorder={vi.fn()}
        reorderMode
      />
    );

    expect(mobileReorderMock).toHaveBeenCalled();
  });
});

