import { describe, test, expect } from "vitest";
import { render, fireEvent } from "@testing-library/react";

import ProfileBasicTab from "@/components/profile/ProfileBasicTab";

describe("ProfileBasicTab", () => {
  test("updates profile fields on input", async () => {
    const setProfile = vi.fn();
    const profile = { name: "Alex", username: "ace", bio: "Hello" };

    const { container } = render(
      <ProfileBasicTab profile={profile} setProfile={setProfile} />
    );

    const inputs = container.querySelectorAll("input");
    fireEvent.change(inputs[0], { target: { value: "Alexis" } });
    expect(setProfile).toHaveBeenCalled();

    const textarea = container.querySelector("textarea")!;
    fireEvent.change(textarea, { target: { value: "new bio" } });
    expect(setProfile).toHaveBeenCalledWith(
      expect.objectContaining({ bio: "new bio" })
    );
  });
});

