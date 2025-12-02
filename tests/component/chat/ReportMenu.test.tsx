import { describe, test, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import ReportMenu from "@/components/chat/ReportMenu";

describe("ReportMenu", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  test("toggles menu open/closed and calls onReport", async () => {
    const user = userEvent.setup();
    const onReport = vi.fn();

    render(
      <ReportMenu onReport={onReport}>
        <span>Menu</span>
      </ReportMenu>
    );

    const trigger = screen.getByRole("button", { name: /more options/i });
    await user.click(trigger);
    expect(screen.getByRole("button", { name: "Report" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Report" }));
    expect(onReport).toHaveBeenCalled();
    expect(screen.queryByRole("button", { name: "Report" })).not.toBeInTheDocument();
  });

  test("closes when clicking outside", async () => {
    const user = userEvent.setup();

    render(
      <div>
        <ReportMenu onReport={vi.fn()}>
          <span>Menu</span>
        </ReportMenu>
        <button>Outside</button>
      </div>
    );

    const trigger = screen.getByRole("button", { name: /more options/i });
    await user.click(trigger);
    expect(screen.getByRole("button", { name: "Report" })).toBeInTheDocument();

    await user.click(screen.getByText("Outside"));
    expect(screen.queryByRole("button", { name: "Report" })).not.toBeInTheDocument();
  });

  test("respects custom label and alignment", async () => {
    const user = userEvent.setup();

    render(
      <ReportMenu onReport={vi.fn()} label="Flag" align="left">
        <span>Menu</span>
      </ReportMenu>
    );

    await user.click(screen.getByRole("button", { name: /more options/i }));
    const option = screen.getByRole("button", { name: "Flag" });
    expect(option).toBeInTheDocument();
    const menu = option.closest("div");
    expect(menu).toHaveClass("left-0");
  });
});

