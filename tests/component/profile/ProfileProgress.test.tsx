import { describe, test, expect } from "vitest";
import { render, screen } from "@testing-library/react";

import ProfileProgress from "@/components/profile/ProfileProgress";

describe("ProfileProgress", () => {
  test("shows percent and width", () => {
    const { container } = render(<ProfileProgress percent={75} />);
    expect(screen.getByText(/75%/)).toBeInTheDocument();

    const bar = container.querySelector("div div div");
    expect(bar?.getAttribute("style")).toContain("width: 75%");
  });
});

