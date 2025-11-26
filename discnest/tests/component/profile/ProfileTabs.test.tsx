import { describe, test, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import ProfileTabs from "@/components/profile/ProfileTabs";

describe("ProfileTabs", () => {
  test("highlights active tab and switches on click", async () => {
    const user = userEvent.setup();
    const setActiveTab = vi.fn();

    render(<ProfileTabs activeTab="basic" setActiveTab={setActiveTab} />);

    const basicBtn = screen.getByRole("button", { name: "Basic Info" });
    expect(basicBtn.className).toContain("bg-gradient-to-r");

    await user.click(screen.getByRole("button", { name: "Disc Golf Info" }));
    expect(setActiveTab).toHaveBeenCalledWith("disc");
  });
});

