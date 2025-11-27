import { vi, describe, test, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import Pagination from "@/components/admin/Pagination";

describe("Pagination", () => {
  test("returns null when only one page", () => {
    const { container } = render(
      <Pagination totalPages={1} currentPage={1} onPageChange={vi.fn()} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  test("renders page buttons and handles navigation", async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();

    render(
      <Pagination totalPages={5} currentPage={3} onPageChange={onPageChange} />
    );

    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBeGreaterThan(3); // Prev + pages + Next

    await user.click(screen.getByRole("button", { name: "Next" }));
    expect(onPageChange).toHaveBeenCalledWith(4);

    await user.click(screen.getByRole("button", { name: "Prev" }));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  test("disables prev/next at boundaries", () => {
    const { rerender } = render(
      <Pagination totalPages={3} currentPage={1} onPageChange={vi.fn()} />
    );

    expect(screen.getByRole("button", { name: "Prev" })).toBeDisabled();

    rerender(
      <Pagination totalPages={3} currentPage={3} onPageChange={vi.fn()} />
    );

    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
  });
});

