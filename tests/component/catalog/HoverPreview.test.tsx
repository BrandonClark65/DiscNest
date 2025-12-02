import { describe, test, expect } from "vitest";
import { render, screen } from "@testing-library/react";

import HoverPreview from "@/components/catalog/HoverPreview";
import type { Disc } from "@/types/disc";

const disc: Disc = {
  _id: "disc-1",
  name: "Zone",
  brand: "Discraft",
  image: "/zone.jpg",
};

describe("HoverPreview", () => {
  test("returns null when no disc", () => {
    const { container } = render(
      <HoverPreview disc={null} onClose={vi.fn()} isMobile={false} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  test("renders preview and close button on mobile", () => {
    const onClose = vi.fn();
    render(<HoverPreview disc={disc} onClose={onClose} isMobile />);

    expect(screen.getByText("Zone")).toBeInTheDocument();
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  test("renders desktop card without close button", () => {
    const { queryByRole } = render(
      <HoverPreview disc={disc} onClose={vi.fn()} isMobile={false} />
    );

    expect(queryByRole("button")).not.toBeInTheDocument();
    expect(screen.getByText("Discraft")).toBeInTheDocument();
  });
});

