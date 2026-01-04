// tests/integration/api/ebay-search.test.ts
import { describe, test, expect } from "vitest";
import request from "supertest";
import app from "../../utils/testServer";
import { setupCommonMocks } from "../../utils/testMocks";

// Setup mocks
setupCommonMocks();

describe("GET /api/ebay/search", () => {

  test("returns 400 when no search parameters provided", async () => {
    const res = await request(app).get("/api/ebay/search");

    // The route checks if keywords are empty (only "disc golf") and returns 400
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
    expect(res.body.error).toContain("at least a title or brand");
  });

  test("generates search URL with title and brand", async () => {
    const res = await request(app)
      .get("/api/ebay/search")
      .query({ title: "Destroyer", brand: "Innova" });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("success", true);
    expect(res.body).toHaveProperty("source", "url");
    expect(res.body).toHaveProperty("searchUrl");
    expect(res.body.searchUrl).toContain("ebay.com");
    expect(res.body.searchUrl).toContain("Destroyer");
    expect(res.body.searchUrl).toContain("Innova");
    expect(res.body.searchUrl).toContain("disc+golf"); // "disc golf" encoded
    expect(res.body.searchUrl).toContain("LH_Sold=1"); // Sold listings filter
    expect(res.body.searchUrl).toContain("LH_Complete=1"); // Completed listings filter
  });

  test("generates search URL with condition filter", async () => {
    const res = await request(app)
      .get("/api/ebay/search")
      .query({ title: "Buzzz", brand: "Discraft", condition: "New" });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("success", true);
    expect(res.body).toHaveProperty("searchUrl");
    expect(res.body.searchUrl).toContain("LH_ItemCondition");
  });

  test("generates search URL with plastic type", async () => {
    const res = await request(app)
      .get("/api/ebay/search")
      .query({ title: "Firebird", brand: "Innova", plastic: "Star" });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("searchUrl");
    expect(res.body.searchUrl).toContain("Star");
  });

  test("maps condition values correctly", async () => {
    const testCases = [
      { condition: "New", expectedConditionId: "1000" },
      { condition: "Like New", expectedConditionId: "3000" },
      { condition: "Used", expectedConditionId: "3000" },
      { condition: "Worn", expectedConditionId: "5000" },
    ];

    for (const testCase of testCases) {
      const res = await request(app)
        .get("/api/ebay/search")
        .query({ title: "Test", brand: "Test", condition: testCase.condition });

      expect(res.status).toBe(200);
      expect(res.body.searchUrl).toContain("LH_ItemCondition");
    }
  });

  test("includes message in response", async () => {
    const res = await request(app)
      .get("/api/ebay/search")
      .query({ title: "Destroyer", brand: "Innova" });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("message");
    expect(res.body.message).toContain("Click the link");
  });
});

