import { vi } from "vitest";

export function mockFetchSequence(
  responses: Array<{ ok: boolean; body: any }>
) {
  const mockFn = vi.fn();

  for (const r of responses) {
    mockFn.mockResolvedValueOnce({
      ok: r.ok,
      json: () => Promise.resolve(r.body),
    });
  }

  // Assign it to global.fetch *with a cast* so TypeScript accepts mock methods
  global.fetch = mockFn as unknown as typeof fetch;

  return mockFn;
}
