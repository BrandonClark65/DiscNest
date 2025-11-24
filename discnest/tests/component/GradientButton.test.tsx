/// <reference types="vitest/globals" />

import { render, screen } from "@testing-library/react";
import GradientButton from "@/components/ui/GradientButton";

test("renders label", () => {
  render(<GradientButton label="Buy Now" />);
  expect(screen.getByText("Buy Now")).toBeInTheDocument();
});
