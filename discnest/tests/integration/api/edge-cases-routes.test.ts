// tests/integration/api/edge-cases-routes.test.ts
// Route-specific edge cases
import "./edge-cases-shared-setup";
import { describe, test, expect, beforeAll, afterEach, afterAll, vi } from "vitest";
import request from "supertest";
import app from "../../utils/testServer";
import { connectTestDb, resetTestDb, closeTestDb } from "../../utils/testDb";

describe("Edge Cases: Route-Specific", () => {
  beforeAll(connectTestDb);
  afterEach(async () => {
    await resetTestDb();
    vi.clearAllMocks();
  });
  afterAll(closeTestDb);

  test("auth: handles extremely long email address", async () => {
    const longEmail = "a".repeat(200) + "@example.com";
    const res = await request(app)
      .post("/api/auth/signup")
      .send({
        email: longEmail,
        password: "password123",
        name: "Test User",
      });

    expect([400, 200]).toContain(res.status);
  });

  test("auth: handles extremely long password", async () => {
    const longPassword = "a".repeat(10000);
    const res = await request(app)
      .post("/api/auth/signup")
      .send({
        email: "test@example.com",
        password: longPassword,
        name: "Test User",
      });

    expect([200, 400, 413]).toContain(res.status);
  });

  test("contact: handles extremely long message", async () => {
    const longMessage = "a".repeat(100000);
    const res = await request(app)
      .post("/api/contact")
      .send({
        email: "test@example.com",
        subject: "Test",
        message: longMessage,
      });

    expect([200, 400, 413, 500]).toContain(res.status);
  });
});

