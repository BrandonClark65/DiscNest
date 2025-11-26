// tests/helpers/mockThread.ts

/**
 * Build a lightweight MessageDB object using string IDs.
 */
export function makeMessageDB(overrides: Partial<any> = {}) {
  return {
    sender: overrides.sender ?? { _id: "user1", name: "User One" },
    content: overrides.content ?? "Hello world",
    timestamp: overrides.timestamp ?? new Date().toISOString(),
    readBy: overrides.readBy ?? ["user1"],
    flagged: overrides.flagged ?? false,
    flaggedCategories: overrides.flaggedCategories ?? {},
  };
}

/**
 * Build a lightweight ThreadDB object using string IDs.
 * All fields are optional and can be overridden.
 */
export function makeThreadDB(overrides: Partial<any> = {}) {
  return {
    _id: overrides._id ?? "thread123",
    participants: overrides.participants ?? [
      { _id: "user1", name: "User One" },
      { _id: "user2", name: "User Two" },
    ],
    messages: overrides.messages ?? [makeMessageDB()],
    listingId: overrides.listingId ?? null,
    requestId: overrides.requestId ?? null,
    updatedAt: overrides.updatedAt ?? new Date().toISOString(),
  };
}
