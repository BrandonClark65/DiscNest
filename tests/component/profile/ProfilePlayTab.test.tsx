import { vi, describe, test, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import ProfilePlayTab from "@/components/profile/ProfilePlayTab";

const multiSelectMock = vi.hoisted(() =>
  vi.fn(({ label, onChange, value }: any) => (
    <div>
      <span>{label}</span>
      <button onClick={() => onChange([...(value ?? []), label])}>Add {label}</button>
    </div>
  ))
);

vi.mock("@/components/ui/MultiSelect", () => ({
  __esModule: true,
  default: multiSelectMock,
}));

describe("ProfilePlayTab", () => {
  test("updates select fields and multiselect values", async () => {
    const user = userEvent.setup();
    const setProfile = vi.fn();
    const profile = { dominantHand: "Right" as const, favoriteBrands: [] };

    render(<ProfilePlayTab profile={profile} setProfile={setProfile} />);

    const selects = screen.getAllByRole("combobox");
    await user.selectOptions(selects[0], "Left");
    expect(setProfile).toHaveBeenCalledWith(
      expect.objectContaining({ dominantHand: "Left" })
    );

    await user.selectOptions(selects[3], "Fast"); // Arm Speed select
    expect(setProfile).toHaveBeenCalledWith(
      expect.objectContaining({ armSpeed: "Fast" })
    );

    await user.click(screen.getByRole("button", { name: "Add Favorite Brands" }));
    expect(setProfile).toHaveBeenCalledWith(
      expect.objectContaining({ favoriteBrands: ["Favorite Brands"] })
    );
  });
});

