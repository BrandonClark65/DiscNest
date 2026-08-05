import { describe, test, expect, beforeAll, afterEach, afterAll, vi } from "vitest";
import { connectTestDb, resetTestDb, closeTestDb } from "../../utils/testDb";
import User from "@/models/User";
import Listing from "@/models/Listing";
import MessageThread from "@/models/MessageThread";
import Rating from "@/models/Rating";
import mongoose from "mongoose";

// Mock connectToDatabase to use the test connection
vi.mock("@/lib/mongodb", () => ({
  connectToDatabase: vi.fn(async () => {
    // If already connected, return the connection
    if (mongoose.connection.readyState === 1) {
      return mongoose;
    }
    // Otherwise, wait for connection (handled by connectTestDb)
    return mongoose;
  }),
}));

// Import after mocks
import { checkRatingEligibility, updateUserRating } from "@/lib/ratings/ratingUtils";

describe("Rating Utils", () => {
  beforeAll(async () => {
    await connectTestDb();
  });
  afterEach(async () => {
    await resetTestDb();
  });
  afterAll(closeTestDb);

  describe("checkRatingEligibility", () => {
    test("prevents self-rating", async () => {
      const userId = new mongoose.Types.ObjectId().toString();
      const result = await checkRatingEligibility(userId, userId);
      
      expect(result.eligible).toBe(false);
      expect(result.reason).toBe("Cannot rate yourself");
    });

    test("returns false if listing not found", async () => {
      const raterId = new mongoose.Types.ObjectId().toString();
      const ratedId = new mongoose.Types.ObjectId().toString();
      const fakeListingId = new mongoose.Types.ObjectId().toString();
      
      const result = await checkRatingEligibility(raterId, ratedId, fakeListingId);
      
      expect(result.eligible).toBe(false);
      expect(result.reason).toBe("Listing not found");
    });

    test("returns false if listing not sold", async () => {
      const seller = await User.create({
        name: "Seller",
        email: `seller-${Date.now()}@test.com`,
        password: "hashed",
        shareableBagId: `bag-${Date.now()}-${Math.random()}`,
      });

      const buyer = await User.create({
        name: "Buyer",
        email: `buyer-${Date.now()}@test.com`,
        password: "hashed",
        shareableBagId: `bag-${Date.now()}-${Math.random()}`,
      });

      const listing = await Listing.create({
        title: "Test Disc",
        brand: "Innova",
        type: "Sell",
        userId: seller._id,
        sold: false,
      });

      const result = await checkRatingEligibility(
        buyer._id.toString(),
        seller._id.toString(),
        listing._id.toString()
      );

      expect(result.eligible).toBe(false);
      expect(result.reason).toBe("Listing not sold yet");
    });

    test("returns false if no conversation found", async () => {
      const seller = await User.create({
        name: "Seller",
        email: `seller-${Date.now()}@test.com`,
        password: "hashed",
        shareableBagId: `bag-${Date.now()}-${Math.random()}`,
      });

      const buyer = await User.create({
        name: "Buyer",
        email: `buyer-${Date.now()}@test.com`,
        password: "hashed",
        shareableBagId: `bag-${Date.now()}-${Math.random()}`,
      });

      const listing = await Listing.create({
        title: "Test Disc",
        brand: "Innova",
        type: "Sell",
        userId: seller._id,
        sold: true,
      });

      const result = await checkRatingEligibility(
        buyer._id.toString(),
        seller._id.toString(),
        listing._id.toString()
      );

      expect(result.eligible).toBe(false);
      expect(result.reason).toBe("No conversation found");
    });

    test("returns false if insufficient messages", async () => {
      const seller = await User.create({
        name: "Seller",
        email: `seller-${Date.now()}@test.com`,
        password: "hashed",
        shareableBagId: `bag-${Date.now()}-${Math.random()}`,
      });

      const buyer = await User.create({
        name: "Buyer",
        email: `buyer-${Date.now()}@test.com`,
        password: "hashed",
        shareableBagId: `bag-${Date.now()}-${Math.random()}`,
      });

      const listing = await Listing.create({
        title: "Test Disc",
        brand: "Innova",
        type: "Sell",
        userId: seller._id,
        sold: true,
      });

      // Create thread with only 2 messages (need 3 minimum)
      const thread = await MessageThread.create({
        participants: [seller._id, buyer._id],
        listingId: listing._id,
        messages: [
          {
            sender: buyer._id,
            content: "Message 1",
            timestamp: new Date(),
          },
          {
            sender: seller._id,
            content: "Message 2",
            timestamp: new Date(),
          },
        ],
      });

      const result = await checkRatingEligibility(
        buyer._id.toString(),
        seller._id.toString(),
        listing._id.toString()
      );

      expect(result.eligible).toBe(false);
      expect(result.reason).toContain("Need at least 3 messages");
    });

    test("returns false if already rated", async () => {
      const seller = await User.create({
        name: "Seller",
        email: `seller-${Date.now()}@test.com`,
        password: "hashed",
        shareableBagId: `bag-${Date.now()}-${Math.random()}`,
      });

      const buyer = await User.create({
        name: "Buyer",
        email: `buyer-${Date.now()}@test.com`,
        password: "hashed",
        shareableBagId: `bag-${Date.now()}-${Math.random()}`,
      });

      const listing = await Listing.create({
        title: "Test Disc",
        brand: "Innova",
        type: "Sell",
        userId: seller._id,
        sold: true,
      });

      // Create thread with enough messages
      const thread = await MessageThread.create({
        participants: [seller._id, buyer._id],
        listingId: listing._id,
        messages: [
          { sender: buyer._id, content: "Message 1", timestamp: new Date() },
          { sender: seller._id, content: "Message 2", timestamp: new Date() },
          { sender: buyer._id, content: "Message 3", timestamp: new Date() },
          { sender: seller._id, content: "Message 4", timestamp: new Date() },
        ],
      });

      // Create existing rating
      await Rating.create({
        raterUserId: buyer._id,
        ratedUserId: seller._id,
        listingId: listing._id,
        rating: 5,
        role: "buyer",
      });

      const result = await checkRatingEligibility(
        buyer._id.toString(),
        seller._id.toString(),
        listing._id.toString()
      );

      expect(result.eligible).toBe(false);
      expect(result.reason).toBe("Already rated this interaction");
    });

    test("returns true for valid eligibility", async () => {
      const seller = await User.create({
        name: "Seller",
        email: `seller-${Date.now()}@test.com`,
        password: "hashed",
        shareableBagId: `bag-${Date.now()}-${Math.random()}`,
      });

      const buyer = await User.create({
        name: "Buyer",
        email: `buyer-${Date.now()}@test.com`,
        password: "hashed",
        shareableBagId: `bag-${Date.now()}-${Math.random()}`,
      });

      const listing = await Listing.create({
        title: "Test Disc",
        brand: "Innova",
        type: "Sell",
        userId: seller._id,
        sold: true,
      });

      // Create thread with enough messages
      const thread = await MessageThread.create({
        participants: [seller._id, buyer._id],
        listingId: listing._id,
        messages: [
          { sender: buyer._id, content: "Message 1", timestamp: new Date() },
          { sender: seller._id, content: "Message 2", timestamp: new Date() },
          { sender: buyer._id, content: "Message 3", timestamp: new Date() },
          { sender: seller._id, content: "Message 4", timestamp: new Date() },
        ],
      });

      const result = await checkRatingEligibility(
        buyer._id.toString(),
        seller._id.toString(),
        listing._id.toString()
      );

      expect(result.eligible).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    test("excludes system messages from count", async () => {
      const seller = await User.create({
        name: "Seller",
        email: `seller-${Date.now()}@test.com`,
        password: "hashed",
        shareableBagId: `bag-${Date.now()}-${Math.random()}`,
      });

      const buyer = await User.create({
        name: "Buyer",
        email: `buyer-${Date.now()}@test.com`,
        password: "hashed",
        shareableBagId: `bag-${Date.now()}-${Math.random()}`,
      });

      const listing = await Listing.create({
        title: "Test Disc",
        brand: "Innova",
        type: "Sell",
        userId: seller._id,
        sold: true,
      });

      const systemSenderId = new mongoose.Types.ObjectId("000000000000000000000000");

      // Create thread with user messages + system messages
      const thread = await MessageThread.create({
        participants: [seller._id, buyer._id],
        listingId: listing._id,
        messages: [
          { sender: buyer._id, content: "Message 1", timestamp: new Date() },
          { sender: seller._id, content: "Message 2", timestamp: new Date() },
          { sender: systemSenderId, content: "System message", timestamp: new Date() },
          { sender: buyer._id, content: "Message 3", timestamp: new Date() },
          { sender: systemSenderId, content: "Another system message", timestamp: new Date() },
          { sender: seller._id, content: "Message 4", timestamp: new Date() },
        ],
      });

      // Should be eligible (4 user messages, system messages excluded)
      const result = await checkRatingEligibility(
        buyer._id.toString(),
        seller._id.toString(),
        listing._id.toString()
      );

      expect(result.eligible).toBe(true);
    });
  });

  describe("updateUserRating", () => {
    test("sets rating to null and count to 0 when no ratings exist", async () => {
      const user = await User.create({
        name: "User",
        email: `user-${Date.now()}@test.com`,
        password: "hashed",
        shareableBagId: `bag-${Date.now()}-${Math.random()}`,
        averageRating: 4.5,
        ratingCount: 10,
      });

      await updateUserRating(user._id.toString());

      const updatedUser = await User.findById(user._id);
      expect(updatedUser?.averageRating).toBeNull();
      expect(updatedUser?.ratingCount).toBe(0);
    });

    test("calculates average rating correctly", async () => {
      const user = await User.create({
        name: "User",
        email: `user-${Date.now()}@test.com`,
        password: "hashed",
        shareableBagId: `bag-${Date.now()}-${Math.random()}`,
      });

      const rater1 = await User.create({
        name: "Rater 1",
        email: `rater1-${Date.now()}@test.com`,
        password: "hashed",
        shareableBagId: `bag-${Date.now()}-${Math.random()}`,
      });

      const rater2 = await User.create({
        name: "Rater 2",
        email: `rater2-${Date.now()}@test.com`,
        password: "hashed",
        shareableBagId: `bag-${Date.now()}-${Math.random()}`,
      });

      const rater3 = await User.create({
        name: "Rater 3",
        email: `rater3-${Date.now()}@test.com`,
        password: "hashed",
        shareableBagId: `bag-${Date.now()}-${Math.random()}`,
      });

      // Create ratings: 5, 4, 3 = average 4.0
      await Rating.create({
        raterUserId: rater1._id,
        ratedUserId: user._id,
        rating: 5,
        role: "buyer",
      });

      await Rating.create({
        raterUserId: rater2._id,
        ratedUserId: user._id,
        rating: 4,
        role: "buyer",
      });

      await Rating.create({
        raterUserId: rater3._id,
        ratedUserId: user._id,
        rating: 3,
        role: "buyer",
      });

      await updateUserRating(user._id.toString());

      const updatedUser = await User.findById(user._id);
      expect(updatedUser?.averageRating).toBe(4.0);
      expect(updatedUser?.ratingCount).toBe(3);
    });

    test("rounds average to 1 decimal place", async () => {
      const user = await User.create({
        name: "User",
        email: `user-${Date.now()}@test.com`,
        password: "hashed",
        shareableBagId: `bag-${Date.now()}-${Math.random()}`,
      });

      const rater1 = await User.create({
        name: "Rater 1",
        email: `rater1-${Date.now()}@test.com`,
        password: "hashed",
        shareableBagId: `bag-${Date.now()}-${Math.random()}`,
      });

      const rater2 = await User.create({
        name: "Rater 2",
        email: `rater2-${Date.now()}@test.com`,
        password: "hashed",
        shareableBagId: `bag-${Date.now()}-${Math.random()}`,
      });

      // Create ratings: 5, 4 = average 4.5
      await Rating.create({
        raterUserId: rater1._id,
        ratedUserId: user._id,
        rating: 5,
        role: "buyer",
      });

      await Rating.create({
        raterUserId: rater2._id,
        ratedUserId: user._id,
        rating: 4,
        role: "buyer",
      });

      await updateUserRating(user._id.toString());

      const updatedUser = await User.findById(user._id);
      expect(updatedUser?.averageRating).toBe(4.5);
    });

    test("handles fractional averages correctly", async () => {
      const user = await User.create({
        name: "User",
        email: `user-${Date.now()}@test.com`,
        password: "hashed",
        shareableBagId: `bag-${Date.now()}-${Math.random()}`,
      });

      const rater1 = await User.create({
        name: "Rater 1",
        email: `rater1-${Date.now()}@test.com`,
        password: "hashed",
        shareableBagId: `bag-${Date.now()}-${Math.random()}`,
      });

      const rater2 = await User.create({
        name: "Rater 2",
        email: `rater2-${Date.now()}@test.com`,
        password: "hashed",
        shareableBagId: `bag-${Date.now()}-${Math.random()}`,
      });

      const rater3 = await User.create({
        name: "Rater 3",
        email: `rater3-${Date.now()}@test.com`,
        password: "hashed",
        shareableBagId: `bag-${Date.now()}-${Math.random()}`,
      });

      // Create ratings: 5, 4, 4 = average 4.333... rounded to 4.3
      await Rating.create({
        raterUserId: rater1._id,
        ratedUserId: user._id,
        rating: 5,
        role: "buyer",
      });

      await Rating.create({
        raterUserId: rater2._id,
        ratedUserId: user._id,
        rating: 4,
        role: "buyer",
      });

      await Rating.create({
        raterUserId: rater3._id,
        ratedUserId: user._id,
        rating: 4,
        role: "buyer",
      });

      await updateUserRating(user._id.toString());

      const updatedUser = await User.findById(user._id);
      expect(updatedUser?.averageRating).toBe(4.3);
      expect(updatedUser?.ratingCount).toBe(3);
    });
  });
});

