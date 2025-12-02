import { describe, test, expect } from "vitest";
import { render, fireEvent } from "@testing-library/react";

import ProfileDiscTab from "@/components/profile/ProfileDiscTab";

describe("ProfileDiscTab", () => {
  test("parses numeric fields and updates profile", async () => {
    const setProfile = vi.fn();
    const profile = { pdgaNumber: 0, homeCourse: "", goals: "" };

    const { container } = render(
      <ProfileDiscTab profile={profile} setProfile={setProfile} />
    );

    const numberInput = container.querySelector('input[type="number"]')!;
    fireEvent.change(numberInput, { target: { value: "123" } });
    expect(setProfile).toHaveBeenCalledWith(
      expect.objectContaining({ pdgaNumber: 123 })
    );

    const textInputs = container.querySelectorAll('input[type="text"]');
    fireEvent.change(textInputs[0], { target: { value: "Milo" } });
    expect(setProfile).toHaveBeenCalledWith(
      expect.objectContaining({ homeCourse: "Milo" })
    );
  });
});

