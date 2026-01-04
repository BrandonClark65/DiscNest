import { describe, test, expect, beforeAll, afterEach, afterAll } from "vitest";
import request from "supertest";
import app from "../../utils/testServer";
import { connectTestDb, resetTestDb, closeTestDb } from "../../utils/testDb";
import User from "@/models/User";
import Listing from "@/models/Listing";
import MessageThread from "@/models/MessageThread";
import { setupStandardMocks, setupMessageMocks, mockRequireUser, resetAllMocks } from "../../utils/testMocks";

// Setup mocks
setupStandardMocks();
setupMessageMocks();

describe("Messages Page - Rating Prompt Integration", () => {
  beforeAll(connectTestDb);
  afterEach(() => {
    resetTestDb();
    resetAllMocks();
  });
  afterAll(closeTestDb);

  // Note: The eligibility API endpoint is tested in tests/integration/api/ratings.test.ts
  // These tests verify the integration with message threads specifically
  
  test.skip("eligibility API returns eligible interaction for thread with listing", async () => {
    const buyer = await User.create({
      name: "Buyer",
      email: `buyer-${Date.now()}@test.com`,
      password: "hashed",
      shareableBagId: `bag-${Date.now()}-${Math.random()}`,
    });

    const seller = await User.create({
      name: "Seller",
      email: `seller-${Date.now()}@test.com`,
      password: "hashed",
      shareableBagId: `bag-${Date.now()}-${Math.random()}`,
    });

    const listing = await Listing.create({
      title: "Test Disc",
      brand: "Innova",
      type: "Sell",
      userId: seller._id,
      condition: "New",
      price: 25,
      sold: true, // Listing is sold
    });

    // Create thread with enough messages (4 messages >= 3 minimum)
    await MessageThread.create({
      participants: [buyer._id, seller._id],
      listingId: listing._id,
      messages: [
        { sender: buyer._id, content: "Message 1", timestamp: new Date() },
        { sender: seller._id, content: "Message 2", timestamp: new Date() },
        { sender: buyer._id, content: "Message 3", timestamp: new Date() },
        { sender: seller._id, content: "Message 4", timestamp: new Date() },
      ],
    });

    mockRequireUser.mockResolvedValueOnce({
      user: { id: buyer._id.toString(), email: buyer.email },
    } as any);

    const res = await request(app).get(`/api/ratings/eligibility/${seller._id.toString()}`);

    expect(res.status).toBe(200);
    expect(res.body.eligible).toBe(true);
    expect(res.body.interactions).toBeDefined();
    expect(res.body.interactions.length).toBeGreaterThan(0);
    
    // Check that there's an eligible interaction for this listing
    const eligibleInteraction = res.body.interactions.find(
      (i: { listingId?: string; eligible: boolean }) =>
        i.listingId === listing._id.toString() && i.eligible === true
    );
    expect(eligibleInteraction).toBeDefined();
  });

  test.skip("eligibility API returns not eligible when listing not sold", async () => {
    const buyer = await User.create({
      name: "Buyer",
      email: `buyer-${Date.now()}@test.com`,
      password: "hashed",
      shareableBagId: `bag-${Date.now()}-${Math.random()}`,
    });

    const seller = await User.create({
      name: "Seller",
      email: `seller-${Date.now()}@test.com`,
      password: "hashed",
      shareableBagId: `bag-${Date.now()}-${Math.random()}`,
    });

    const listing = await Listing.create({
      title: "Test Disc",
      brand: "Innova",
      type: "Sell",
      userId: seller._id,
      condition: "New",
      price: 25,
      sold: false, // Listing not sold
    });

    await MessageThread.create({
      participants: [buyer._id, seller._id],
      listingId: listing._id,
      messages: [
        { sender: buyer._id, content: "Message 1", timestamp: new Date() },
        { sender: seller._id, content: "Message 2", timestamp: new Date() },
        { sender: buyer._id, content: "Message 3", timestamp: new Date() },
      ],
    });

    mockRequireUser.mockResolvedValueOnce({
      user: { id: buyer._id.toString(), email: buyer.email },
    } as any);

    const res = await request(app).get(`/api/ratings/eligibility/${seller._id.toString()}`);

    expect(res.status).toBe(200);
    // Should not be eligible because listing is not sold
    const interaction = res.body.interactions.find(
      (i: { listingId?: string }) => i.listingId === listing._id.toString()
    );
    expect(interaction).toBeDefined();
    expect(interaction.eligible).toBe(false);
    expect(interaction.reason).toContain("not sold");
  });

  test.skip("eligibility API returns not eligible when insufficient messages", async () => {
    const buyer = await User.create({
      name: "Buyer",
      email: `buyer-${Date.now()}@test.com`,
      password: "hashed",
      shareableBagId: `bag-${Date.now()}-${Math.random()}`,
    });

    const seller = await User.create({
      name: "Seller",
      email: `seller-${Date.now()}@test.com`,
      password: "hashed",
      shareableBagId: `bag-${Date.now()}-${Math.random()}`,
    });

    const listing = await Listing.create({
      title: "Test Disc",
      brand: "Innova",
      type: "Sell",
      userId: seller._id,
      condition: "New",
      price: 25,
      sold: true,
    });

    // Create thread with only 2 messages (< 3 minimum)
    await MessageThread.create({
      participants: [buyer._id, seller._id],
      listingId: listing._id,
      messages: [
        { sender: buyer._id, content: "Message 1", timestamp: new Date() },
        { sender: seller._id, content: "Message 2", timestamp: new Date() },
      ],
    });

    mockRequireUser.mockResolvedValueOnce({
      user: { id: buyer._id.toString(), email: buyer.email },
    } as any);

    const res = await request(app).get(`/api/ratings/eligibility/${seller._id.toString()}`);

    expect(res.status).toBe(200);
    const interaction = res.body.interactions.find(
      (i: { listingId?: string }) => i.listingId === listing._id.toString()
    );
    expect(interaction).toBeDefined();
    expect(interaction.eligible).toBe(false);
    expect(interaction.reason).toContain("at least 3 messages");
  });
});

