/// <reference types="vitest/globals" />

import request from "supertest";
import { connectTestDb, resetTestDb, closeTestDb } from "../../utils/testDb";
import app from "../../utils/testServer";
import { describe, test, beforeAll, afterAll, afterEach, expect } from "vitest";

describe("GET /api/requests", () => {
  beforeAll(connectTestDb);
  afterEach(resetTestDb);
  afterAll(closeTestDb);

  test("returns empty array initially", async () => {
    const res = await request(app).get("/api/requests");
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});
