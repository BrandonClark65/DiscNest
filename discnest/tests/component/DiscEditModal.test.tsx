import { vi, describe, test, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import DiscEditModal from "@/components/gear/DiscEditModal";
import type { Disc } from "@/types/disc";

const baseDisc: Disc = {
  _id: "disc-1",
  name: "Buzzz",
  brand: "Discraft",
  type: "Midrange",
  plastic: "ESP" as any,
  wearLevel: 20,
  weight: 175,
  notes: "Trusty mid",
  color: "#ff0000",
};

describe("DiscEditModal", () => {
  const onClose = vi.fn();
  const onSave = vi.fn();

  beforeEach(() => {
    onClose.mockReset();
    onSave.mockReset();
  });

  test("prefills fields with disc data and submits updated values", async () => {
    const { container } = render(
      <DiscEditModal disc={baseDisc} onClose={onClose} onSave={onSave} />
    );

    const plasticSelect = container.querySelector("select") as HTMLSelectElement;
    const [wearInput, weightInput] = Array.from(
      container.querySelectorAll('input[type="number"]')
    ) as HTMLInputElement[];
    const notesInput = container.querySelector("textarea") as HTMLTextAreaElement;

    expect(plasticSelect).toHaveValue("ESP");
    expect(wearInput).toHaveValue(20);
    expect(weightInput).toHaveValue(175);
    expect(notesInput).toHaveValue("Trusty mid");

    await userEvent.clear(notesInput);
    await userEvent.type(notesInput, "Updated description");

    await userEvent.click(screen.getByRole("button", { name: /Save Changes/i }));

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        discId: "disc-1",
        notes: "Updated description",
      })
    );
  });

  test("cancel button triggers onClose", async () => {
    render(<DiscEditModal disc={baseDisc} onClose={onClose} onSave={onSave} />);

    await userEvent.click(screen.getByRole("button", { name: /Cancel/i }));

    expect(onClose).toHaveBeenCalled();
    expect(onSave).not.toHaveBeenCalled();
  });

  test("shows validation message when wear level out of range", async () => {
    const { container } = render(
      <DiscEditModal disc={baseDisc} onClose={onClose} onSave={onSave} />
    );

    const wearInput = container.querySelector(
      'input[type="number"]'
    ) as HTMLInputElement;
    await userEvent.clear(wearInput);
    await userEvent.type(wearInput, "150");

    expect(
      screen.getByText(/Wear level must be between 0 and 100/i)
    ).toBeInTheDocument();
  });

  test("color picker updates state", () => {
    const { container } = render(
      <DiscEditModal disc={baseDisc} onClose={onClose} onSave={onSave} />
    );

    const colorInput = container.querySelector(
      'input[type="color"]'
    ) as HTMLInputElement;
    fireEvent.change(colorInput, { target: { value: "#00ff00" } });

    expect(colorInput).toHaveValue("#00ff00");
  });
});

