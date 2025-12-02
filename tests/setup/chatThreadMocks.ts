import { vi } from "vitest";

export const toastError = vi.fn();

vi.mock("react-hot-toast", () => ({
  toast: { error: toastError },
}));

vi.mock("@/lib/messageMapping", () => ({
  mapThreadDBtoUI: (db: any) => db,
}));
