import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import MarketplacePagination from "@/components/marketplace/MarketplacePagination";

describe("MarketplacePagination", () => {
  test("returns null when only one page", () => {
    const { container } = render(
      <MarketplacePagination totalPages={1} currentPage={1} onPageChange={() => {}} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  test("renders page buttons and handles clicks", async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();

    render(
      <MarketplacePagination
        totalPages={3}
        currentPage={2}
        onPageChange={onPageChange}
      />
    );

    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(3);
    expect(screen.getByRole("button", { name: "2" })).toHaveClass(
      "bg-[var(--primary)]",
      { exact: false }
    );

    await user.click(screen.getByRole("button", { name: "3" }));
    expect(onPageChange).toHaveBeenCalledWith(3);
  });
});

