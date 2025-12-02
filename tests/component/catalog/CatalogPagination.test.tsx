import { describe, test, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import CatalogPagination from "@/components/catalog/CatalogPagination";

describe("CatalogPagination", () => {
  test("renders ellipsis and handles navigation", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <CatalogPagination totalPages={10} currentPage={5} onChange={onChange} />
    );

    expect(screen.getAllByText("...")).toHaveLength(2);
    await user.click(screen.getByRole("button", { name: "Prev" }));
    expect(onChange).toHaveBeenCalledWith(4);

    await user.click(screen.getByRole("button", { name: "Next" }));
    expect(onChange).toHaveBeenCalledWith(6);

    await user.click(screen.getByRole("button", { name: "1" }));
    expect(onChange).toHaveBeenCalledWith(1);
  });

  test("disables prev/next at bounds", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    const { rerender } = render(
      <CatalogPagination totalPages={1} currentPage={1} onChange={onChange} />
    );

    expect(screen.getByRole("button", { name: "Prev" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();

    rerender(<CatalogPagination totalPages={2} currentPage={2} onChange={onChange} />);
    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "Prev" }));
    expect(onChange).toHaveBeenCalledWith(1);
  });
});

