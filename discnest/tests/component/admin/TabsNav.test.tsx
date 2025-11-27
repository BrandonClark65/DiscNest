import { vi, describe, test, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import TabsNav from "@/components/admin/TabsNav";

describe("TabsNav", () => {
  test("renders all tabs and switches active tab", async () => {
    const user = userEvent.setup();
    const setActiveTab = vi.fn();

    render(<TabsNav activeTab="stats" setActiveTab={setActiveTab} />);

    expect(screen.getByRole("button", { name: "Dashboard" })).toHaveClass(
      "border-b-2",
      { exact: false }
    );
    expect(screen.getByRole("button", { name: "Disc Catalog" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Users" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Pending Listings" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Users" }));
    expect(setActiveTab).toHaveBeenCalledWith("users");
  });
});

