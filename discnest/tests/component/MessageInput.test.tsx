import { describe, test, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import MessageInput from "@/components/chat/MessageInput";

const gradientButtonMock = vi.hoisted(() =>
  vi.fn(({ label, onClick }: { label: string; onClick?: () => void }) => (
    <button onClick={onClick}>{label}</button>
  ))
);

vi.mock("@/components/ui/GradientButton", () => ({
  __esModule: true,
  default: gradientButtonMock,
}));

describe("MessageInput", () => {
  test("updates value and sends on enter/click", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const onSend = vi.fn();

    render(<MessageInput value="" onChange={onChange} onSend={onSend} />);

    const input = screen.getByPlaceholderText(/Type your message/i);
    await user.type(input, "hi{enter}");
    expect(onChange).toHaveBeenCalled();
    expect(onSend).toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Send" }));
    expect(onSend).toHaveBeenCalledTimes(2);
  });
});

