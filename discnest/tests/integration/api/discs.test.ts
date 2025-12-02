// tests/integration/api/discs.test.ts
import { describe, test, expect, beforeAll, afterEach, afterAll } from "vitest";
import request from "supertest";
import app from "../../utils/testServer";
import { connectTestDb, resetTestDb, closeTestDb } from "../../utils/testDb";
import Disc from "@/models/Disc";
import User from "@/models/User";
import mongoose from "mongoose";
import { setupCommonMocks } from "../../utils/testMocks";

// Setup mocks
setupCommonMocks();

/* ----------------------------------------------------
   TESTS
---------------------------------------------------- */

describe("GET /api/discs", () => {
  beforeAll(connectTestDb);
  afterEach(resetTestDb);
  afterAll(closeTestDb);

  test("returns empty array when catalog is empty", async () => {
    const res = await request(app).get("/api/discs");

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  test("returns only catalog discs (no userId)", async () => {
    // Create catalog disc (no userId)
    const catalogDisc = await Disc.create({
      name: "Catalog Disc",
      brand: "Innova",
      type: "Distance Driver",
      stability: "Overstable",
      image: "catalog-image.jpg",
      addedAt: new Date("2024-01-01"),
      flight: {
        speed: 12,
        glide: 5,
        turn: -1,
        fade: 3,
      },
    });

    // Create user-owned disc (with userId)
    const user = await User.create({
      name: "Test User",
      email: "test@example.com",
      password: "hashed",
      shareableBagId: `bag-${Date.now()}-${Math.random()}`,
    });

    const userDisc = await Disc.create({
      name: "User Disc",
      brand: "Discraft",
      type: "Midrange",
      userId: user._id,
      addedAt: new Date("2024-01-02"),
    });

    const res = await request(app).get("/api/discs");

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(1);
    expect(res.body[0]._id.toString()).toBe(catalogDisc._id.toString());
    expect(res.body[0].name).toBe("Catalog Disc");
    
    // Verify user disc is not included
    const discIds = res.body.map((d: any) => d._id.toString());
    expect(discIds).not.toContain(userDisc._id.toString());
  });

  test("excludes user-owned discs", async () => {
    const user1 = await User.create({
      name: "User 1",
      email: "user1@example.com",
      password: "hashed",
      shareableBagId: `bag-${Date.now()}-${Math.random()}`,
    });

    const user2 = await User.create({
      name: "User 2",
      email: "user2@example.com",
      password: "hashed",
      shareableBagId: `bag-${Date.now()}-${Math.random()}`,
    });

    // Create catalog discs
    await Disc.create({
      name: "Catalog Disc 1",
      brand: "Innova",
      type: "Distance Driver",
    });

    await Disc.create({
      name: "Catalog Disc 2",
      brand: "Discraft",
      type: "Midrange",
    });

    // Create user-owned discs
    await Disc.create({
      name: "User 1 Disc",
      brand: "Innova",
      userId: user1._id,
    });

    await Disc.create({
      name: "User 2 Disc",
      brand: "Discraft",
      userId: user2._id,
    });

    const res = await request(app).get("/api/discs");

    expect(res.status).toBe(200);
    expect(res.body.length).toBe(2);
    
    const discNames = res.body.map((d: any) => d.name);
    expect(discNames).toContain("Catalog Disc 1");
    expect(discNames).toContain("Catalog Disc 2");
    expect(discNames).not.toContain("User 1 Disc");
    expect(discNames).not.toContain("User 2 Disc");
  });

  test("returns correct fields (name, brand, type, addedAt, image, stability, flight)", async () => {
    const catalogDisc = await Disc.create({
      name: "Test Disc",
      brand: "Innova",
      type: "Distance Driver",
      stability: "Overstable",
      image: "test-image.jpg",
      addedAt: new Date("2024-01-01"),
      flight: {
        speed: 12,
        glide: 5,
        turn: -1,
        fade: 3,
      },
      // Fields that should NOT be returned
      plastic: "Champion",
      wearLevel: 50,
      weight: 175,
      notes: "Test notes",
      color: "#ff0000",
      storeLink: "https://example.com",
      order: 1,
    });

    const res = await request(app).get("/api/discs");

    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
    
    const disc = res.body[0];
    
    // Verify required fields are present
    expect(disc.name).toBe("Test Disc");
    expect(disc.brand).toBe("Innova");
    expect(disc.type).toBe("Distance Driver");
    expect(disc.stability).toBe("Overstable");
    expect(disc.image).toBe("test-image.jpg");
    expect(disc.addedAt).toBeDefined();
    expect(disc.flight).toBeDefined();
    expect(disc.flight.speed).toBe(12);
    expect(disc.flight.glide).toBe(5);
    expect(disc.flight.turn).toBe(-1);
    expect(disc.flight.fade).toBe(3);

    // Verify excluded fields are NOT present
    expect(disc.plastic).toBeUndefined();
    expect(disc.wearLevel).toBeUndefined();
    expect(disc.weight).toBeUndefined();
    expect(disc.notes).toBeUndefined();
    expect(disc.color).toBeUndefined();
    expect(disc.storeLink).toBeUndefined();
    expect(disc.order).toBeUndefined();
    expect(disc.userId).toBeUndefined();
  });

  test("sorted by addedAt descending", async () => {
    // Create discs with different addedAt dates
    const disc1 = await Disc.create({
      name: "Oldest Disc",
      brand: "Innova",
      type: "Distance Driver",
      addedAt: new Date("2024-01-01"),
    });

    const disc2 = await Disc.create({
      name: "Middle Disc",
      brand: "Discraft",
      type: "Midrange",
      addedAt: new Date("2024-01-02"),
    });

    const disc3 = await Disc.create({
      name: "Newest Disc",
      brand: "MVP",
      type: "Putter",
      addedAt: new Date("2024-01-03"),
    });

    const res = await request(app).get("/api/discs");

    expect(res.status).toBe(200);
    expect(res.body.length).toBe(3);
    
    // Should be sorted by addedAt descending (newest first)
    expect(res.body[0].name).toBe("Newest Disc");
    expect(res.body[1].name).toBe("Middle Disc");
    expect(res.body[2].name).toBe("Oldest Disc");
  });

  test("handles discs with missing optional fields", async () => {
    // Create disc with minimal required fields
    await Disc.create({
      name: "Minimal Disc",
      brand: "Innova",
    });

    const res = await request(app).get("/api/discs");

    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
    
    const disc = res.body[0];
    expect(disc.name).toBe("Minimal Disc");
    expect(disc.brand).toBe("Innova");
    // Optional fields should be undefined or null
    expect(disc.type).toBeDefined(); // Has default value ''
    expect(disc.stability).toBeDefined(); // Has default value ''
  });

  test("handles empty catalog gracefully", async () => {
    // Create only user-owned discs
    const user = await User.create({
      name: "Test User",
      email: "test@example.com",
      password: "hashed",
      shareableBagId: `bag-${Date.now()}-${Math.random()}`,
    });

    await Disc.create({
      name: "User Disc",
      brand: "Innova",
      userId: user._id,
    });

    const res = await request(app).get("/api/discs");

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  test("returns multiple catalog discs correctly", async () => {
    // Create multiple catalog discs
    const disc1 = await Disc.create({
      name: "Disc 1",
      brand: "Innova",
      type: "Distance Driver",
      addedAt: new Date("2024-01-01"),
    });

    const disc2 = await Disc.create({
      name: "Disc 2",
      brand: "Discraft",
      type: "Midrange",
      addedAt: new Date("2024-01-02"),
    });

    const disc3 = await Disc.create({
      name: "Disc 3",
      brand: "MVP",
      type: "Putter",
      addedAt: new Date("2024-01-03"),
    });

    const res = await request(app).get("/api/discs");

    expect(res.status).toBe(200);
    expect(res.body.length).toBe(3);
    
    const discIds = res.body.map((d: any) => d._id.toString());
    expect(discIds).toContain(disc1._id.toString());
    expect(discIds).toContain(disc2._id.toString());
    expect(discIds).toContain(disc3._id.toString());
  });

  test("handles flight object with partial data", async () => {
    // Create disc with partial flight data
    await Disc.create({
      name: "Partial Flight Disc",
      brand: "Innova",
      type: "Distance Driver",
      flight: {
        speed: 12,
        glide: 5,
        // turn and fade missing
      },
    });

    const res = await request(app).get("/api/discs");

    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
    
    const disc = res.body[0];
    expect(disc.flight).toBeDefined();
    expect(disc.flight.speed).toBe(12);
    expect(disc.flight.glide).toBe(5);
    expect(disc.flight.turn).toBeUndefined();
    expect(disc.flight.fade).toBeUndefined();
  });
});

