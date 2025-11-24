// tests/integration/api/requests.test.ts
import { describe, test, expect, beforeAll, afterEach, afterAll, vi } from "vitest";
import request from "supertest";
import app from "../../utils/testServer";

import { connectTestDb, resetTestDb, closeTestDb } from "../../utils/testDb";

/* ----------------------------------------------------
   MOCK DATABASE (use in-memory DB instead of Mongo)
---------------------------------------------------- */
// tests/integration/api/requests.test.ts

// 👇 Mock database: API routes should NOT call mongoose.connect()
vi.mock("@/lib/mongodb", () => ({
  connectToDatabase: async () => {}, // no-op
}));


/* ----------------------------------------------------
   MOCK ERROR LOGGER (Resend requires API key)
---------------------------------------------------- */
vi.mock("@/lib/errorLogger", () => ({
  logError: vi.fn(), // disable email sending
}));

/* ----------------------------------------------------
   MOCK withErrorHandling (so it doesn't wrap errors)
---------------------------------------------------- */
vi.mock("@/lib/withErrorHandling", () => ({
  withErrorHandling: (handler: any) => handler, // passthrough
}));

/* ----------------------------------------------------
   TESTS
---------------------------------------------------- */

describe("GET /api/requests", () => {
  beforeAll(connectTestDb);
  afterEach(resetTestDb);
  afterAll(closeTestDb);

  test("returns empty array initially", async () => {
    const res = await request(app).get("/api/requests");

    expect(res.status).toBe(200);

    // only assert what matters
    expect(res.body.requests).toEqual([]);

    // optionally:
    expect(res.body.page).toBe(1);
    expect(res.body.limit).toBe(20);
    });
});
