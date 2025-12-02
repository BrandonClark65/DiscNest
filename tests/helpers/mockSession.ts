// tests/helpers/mockSession.ts

export function mockSession(overrides: Partial<any> = {}) {
  return {
    user: {
      id: "user1",
      name: "User One",
      email: "user@test.com",
      ...overrides.user,
    },
    expires: "2099-01-01T00:00:00.000Z",
    ...overrides,
  };
}
