import { vi, describe, test, expect, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import UsersTab from "@/components/admin/UsersTab";

const paginationMock = vi.hoisted(() =>
  vi.fn(({ onPageChange }: any) => (
    <button onClick={() => onPageChange(2)}>Next</button>
  ))
);

vi.mock("@/components/admin/Pagination", () => ({
  __esModule: true,
  default: paginationMock,
}));

const mockUsers = [
  {
    _id: "1",
    name: "Alice",
    email: "alice@test.com",
    role: "user",
    moderationFlags: 0,
  },
  {
    _id: "2",
    name: "Bob",
    email: "bob@test.com",
    role: "admin",
    moderationFlags: 2,
    lastFlaggedAt: "2023-01-01",
  },
];

describe("UsersTab", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = vi.fn().mockResolvedValue({
      json: async () => ({ users: mockUsers }),
    });
    paginationMock.mockClear();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  test("fetches and displays users", async () => {
    render(<UsersTab />);

    await waitFor(() => {
      expect(screen.getByText("Alice")).toBeInTheDocument();
    });
    expect(screen.getByText("Bob")).toBeInTheDocument();
  });

  test("filters by role", async () => {
    const user = userEvent.setup();
    render(<UsersTab />);

    await waitFor(() => {
      expect(screen.getByText("Alice")).toBeInTheDocument();
    });

    const selects = screen.getAllByRole("combobox");
    await user.selectOptions(selects[0], "admin");

    expect(screen.getByText("Bob")).toBeInTheDocument();
    expect(screen.queryByText("Alice")).not.toBeInTheDocument();
  });

  test("filters by flag status", async () => {
    const user = userEvent.setup();
    render(<UsersTab />);

    await waitFor(() => {
      expect(screen.getByText("Alice")).toBeInTheDocument();
    });

    const selects = screen.getAllByRole("combobox");
    await user.selectOptions(selects[1], "flagged");

    expect(screen.getByText("Bob")).toBeInTheDocument();
    expect(screen.queryByText("Alice")).not.toBeInTheDocument();
  });
});

