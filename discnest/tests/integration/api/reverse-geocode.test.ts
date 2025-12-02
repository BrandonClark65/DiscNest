// tests/integration/api/reverse-geocode.test.ts
import { describe, test, expect, beforeEach, afterEach } from "vitest";
import request from "supertest";
import app from "../../utils/testServer";
import { setupCommonMocks } from "../../utils/testMocks";

// Setup mocks
setupCommonMocks();

/* ----------------------------------------------------
   TESTS
---------------------------------------------------- */

describe("GET /api/reverse-geocode", () => {
  let originalFetch: typeof global.fetch;
  let mockFetch: any;
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    // Store original fetch
    originalFetch = global.fetch;
    // Create fresh fetch mock for each test
    mockFetch = vi.fn();
    global.fetch = mockFetch as any;
    // Reset environment variables
    process.env = {
      ...originalEnv,
      OPENCAGE_API_KEY: "test-api-key-123",
    };
  });

  afterEach(() => {
    // Restore original fetch
    global.fetch = originalFetch;
    process.env = originalEnv;
  });

  test("validates lat and lng query parameters", async () => {
    // Mock successful OpenCage API response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        results: [
          {
            components: {
              city: "San Francisco",
              state: "California",
            },
          },
        ],
      }),
    });

    const res = await request(app)
      .get("/api/reverse-geocode")
      .query({ lat: "37.7749", lng: "-122.4194" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      city: "San Francisco",
      state: "California",
    });
  });

  test("returns 400 for missing lat", async () => {
    const res = await request(app)
      .get("/api/reverse-geocode")
      .query({ lng: "-122.4194" });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Missing lat or lng");
    expect(mockFetch).not.toHaveBeenCalled();
  });

  test("returns 400 for missing lng", async () => {
    const res = await request(app)
      .get("/api/reverse-geocode")
      .query({ lat: "37.7749" });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Missing lat or lng");
    expect(mockFetch).not.toHaveBeenCalled();
  });

  test("returns 400 for missing both lat and lng", async () => {
    const res = await request(app).get("/api/reverse-geocode");

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Missing lat or lng");
    expect(mockFetch).not.toHaveBeenCalled();
  });

  test("returns 500 if OPENCAGE_API_KEY not configured", async () => {
    delete process.env.OPENCAGE_API_KEY;

    const res = await request(app)
      .get("/api/reverse-geocode")
      .query({ lat: "37.7749", lng: "-122.4194" });

    expect(res.status).toBe(500);
    expect(res.body.error).toBe("OPENCAGE_API_KEY not configured");
    expect(mockFetch).not.toHaveBeenCalled();
  });

  test("calls OpenCage API with correct parameters", async () => {
    const lat = "37.7749";
    const lng = "-122.4194";
    const apiKey = "test-api-key-123";

    // Mock successful OpenCage API response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        results: [
          {
            components: {
              city: "San Francisco",
              state: "California",
            },
          },
        ],
      }),
    });

    const res = await request(app)
      .get("/api/reverse-geocode")
      .query({ lat, lng });

    expect(res.status).toBe(200);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith(
      `https://api.opencagedata.com/geocode/v1/json?q=${lat}+${lng}&key=${apiKey}`
    );
  });

  test("extracts city and state from response", async () => {
    // Mock OpenCage API response with city and state
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        results: [
          {
            components: {
              city: "New York",
              state: "New York",
            },
          },
        ],
      }),
    });

    const res = await request(app)
      .get("/api/reverse-geocode")
      .query({ lat: "40.7128", lng: "-74.0060" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      city: "New York",
      state: "New York",
    });
  });

  test("extracts city from town when city is missing", async () => {
    // Mock OpenCage API response with town instead of city
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        results: [
          {
            components: {
              town: "Small Town",
              state: "Texas",
            },
          },
        ],
      }),
    });

    const res = await request(app)
      .get("/api/reverse-geocode")
      .query({ lat: "30.2672", lng: "-97.7431" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      city: "Small Town",
      state: "Texas",
    });
  });

  test("extracts city from village when city and town are missing", async () => {
    // Mock OpenCage API response with village instead of city/town
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        results: [
          {
            components: {
              village: "Small Village",
              state: "Vermont",
            },
          },
        ],
      }),
    });

    const res = await request(app)
      .get("/api/reverse-geocode")
      .query({ lat: "44.2601", lng: "-72.5754" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      city: "Small Village",
      state: "Vermont",
    });
  });

  test("returns empty city when city, town, and village are missing", async () => {
    // Mock OpenCage API response without city, town, or village
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        results: [
          {
            components: {
              state: "Alaska",
            },
          },
        ],
      }),
    });

    const res = await request(app)
      .get("/api/reverse-geocode")
      .query({ lat: "64.2008", lng: "-149.4937" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      city: "",
      state: "Alaska",
    });
  });

  test("handles OpenCage API failures", async () => {
    // Mock fetch to throw network error
    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    const res = await request(app)
      .get("/api/reverse-geocode")
      .query({ lat: "37.7749", lng: "-122.4194" });

    // The error should be caught by withErrorHandling, but since we're mocking it
    // to passthrough, the error will propagate. Let's check what actually happens.
    // Since withErrorHandling is mocked to passthrough, the error will be thrown
    // and Next.js will handle it, likely returning a 500.
    expect(res.status).toBe(500);
  });

  test("handles OpenCage API non-ok response", async () => {
    // Mock fetch to return non-ok response
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 429,
      statusText: "Too Many Requests",
      json: async () => ({
        status: {
          code: 429,
          message: "Rate limit exceeded",
        },
      }),
    });

    const res = await request(app)
      .get("/api/reverse-geocode")
      .query({ lat: "37.7749", lng: "-122.4194" });

    // The handler doesn't check for ok status, so it will try to parse the response
    // and extract city/state. If the response structure is unexpected, it will
    // return empty city and state.
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      city: "",
      state: "",
    });
  });

  test("handles missing location data gracefully", async () => {
    // Mock OpenCage API response with empty results array
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        results: [],
      }),
    });

    const res = await request(app)
      .get("/api/reverse-geocode")
      .query({ lat: "0", lng: "0" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      city: "",
      state: "",
    });
  });

  test("handles missing results property gracefully", async () => {
    // Mock OpenCage API response without results property
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    const res = await request(app)
      .get("/api/reverse-geocode")
      .query({ lat: "37.7749", lng: "-122.4194" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      city: "",
      state: "",
    });
  });

  test("handles missing components property gracefully", async () => {
    // Mock OpenCage API response with results but no components
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        results: [{}],
      }),
    });

    const res = await request(app)
      .get("/api/reverse-geocode")
      .query({ lat: "37.7749", lng: "-122.4194" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      city: "",
      state: "",
    });
  });

  test("handles missing state property gracefully", async () => {
    // Mock OpenCage API response with city but no state
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        results: [
          {
            components: {
              city: "London",
            },
          },
        ],
      }),
    });

    const res = await request(app)
      .get("/api/reverse-geocode")
      .query({ lat: "51.5074", lng: "-0.1278" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      city: "London",
      state: "",
    });
  });
});


