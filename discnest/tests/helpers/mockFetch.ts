// tests/helpers/mockFetch.ts

export function mockFetch(response: any, ok = true, status = 200) {
  return vi.fn().mockResolvedValue({
    ok,
    status,
    json: vi.fn().mockResolvedValue(response),
  });
}

export function mockFetchError(message = "Network error") {
  return vi.fn().mockRejectedValue(new Error(message));
}
