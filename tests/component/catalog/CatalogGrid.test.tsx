import { describe, test, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import CatalogGrid from "@/components/catalog/CatalogGrid";
import type { Disc } from "@/types/disc";

const discCardMock = vi.hoisted(() =>
  vi.fn(
    ({
      disc,
      onAction,
      onHover,
      actionLabel,
      isRecentlyAdded,
    }: any) => (
      <div data-testid={`disc-${disc._id}`}>
        <span>{disc.name}</span>
        <button onClick={onAction}>{actionLabel}</button>
        <button onClick={() => onHover(disc)}>hover</button>
        {isRecentlyAdded && <span>New</span>}
      </div>
    )
  )
);

vi.mock("@/components/catalog/DiscCardCatalog", () => ({
  __esModule: true,
  default: discCardMock,
}));

const discs: Disc[] = [
  { _id: "1", name: "Buzzz" },
  { _id: "2", name: "Teebird" },
] as Disc[];

describe("CatalogGrid", () => {
  beforeEach(() => {
    discCardMock.mockClear();
  });

  test("renders cards and wires handlers", async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn();
    const onHover = vi.fn();

    render(
      <CatalogGrid
        discs={discs}
        addedDiscId="2"
        onAdd={onAdd}
        onHover={onHover}
      />
    );

    expect(discCardMock).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        disc: discs[0],
        isRecentlyAdded: false,
        actionLabel: "Add to Shelf",
      }),
      undefined
    );
    expect(discCardMock).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        disc: discs[1],
        isRecentlyAdded: true,
      }),
      undefined
    );

    await user.click(screen.getAllByText("Add to Shelf")[0]);
    expect(onAdd).toHaveBeenCalledWith("1", "shelf");

    await user.click(screen.getAllByText("hover")[1]);
    expect(onHover).toHaveBeenCalledWith(expect.objectContaining({ _id: "2" }));
  });
});

