import { describe, test, expect, beforeAll, afterEach, afterAll } from "vitest";
import request from "supertest";
import app from "../../utils/testServer";
import { connectTestDb, resetTestDb, closeTestDb } from "../../utils/testDb";
import Listing from "@/models/Listing";
import User from "@/models/User";
import MessageThread from "@/models/MessageThread";
import { UnauthorizedError } from "@/lib/errors/UnauthorizedError";
import { setupStandardMocks, setupCloudinaryMocks, setupMessageMocks, mockRequireUser, mockAddSystemMessageToThreads, mockCloudinaryDestroy, resetAllMocks } from "../../utils/testMocks";

// Setup mocks
setupStandardMocks();
setupCloudinaryMocks();
setupMessageMocks();

beforeAll(connectTestDb);
afterAll(closeTestDb);

describe("GET /api/listings/[id]", () => {
  afterEach(async () => {
    await resetTestDb();
    resetAllMocks();
  });

  test("returns listing by ID", async () => {
    const user = await User.create({
      name: "Seller",
      email: `seller-get-${Date.now()}@test.com`,
      password: "hashed",
      shareableBagId: `bag-${Date.now()}-${Math.random()}`,
    });

    const listing = await Listing.create({
      title: "Test Disc",
      brand: "Innova",
      type: "Sell",
      condition: "New",
      price: 25,
      description: "Great disc",
      userId: user._id,
      location: {
        type: "Point",
        coordinates: [-118, 34],
      },
    });

    const res = await request(app).get(`/api/listings/${listing._id}`);

    expect(res.status).toBe(200);
    expect(res.body.listing).toBeDefined();
    expect(res.body.listing._id).toBe(listing._id.toString());
    expect(res.body.listing.title).toBe("Test Disc");
    expect(res.body.listing.brand).toBe("Innova");
  });

  test("returns 404 for non-existent listing", async () => {
    // Use a valid ObjectId format but non-existent ID
    const fakeId = "507f1f77bcf86cd799439011";
    const res = await request(app).get(`/api/listings/${fakeId}`);

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Listing not found");
  });

  test("returns 500 for invalid ID format", async () => {
    // Mongoose throws CastError for invalid ObjectId format
    // This gets caught by error handling and returns 500
    const res = await request(app).get("/api/listings/invalid-id");

    expect(res.status).toBe(500);
  });
});

describe("PATCH /api/listings/[id]", () => {
  afterEach(async () => {
    await resetTestDb();
    resetAllMocks();
  });

  test("requires authentication", async () => {
    const user = await User.create({
      name: "Seller",
      email: `seller-patch-auth-${Date.now()}@test.com`,
      password: "hashed",
      shareableBagId: `bag-${Date.now()}-${Math.random()}`,
    });

    const listing = await Listing.create({
      title: "Test Disc",
      brand: "Innova",
      type: "Sell",
      condition: "New",
      userId: user._id,
      location: {
        type: "Point",
        coordinates: [-118, 34],
      },
    });

    mockRequireUser.mockRejectedValueOnce(new UnauthorizedError("Unauthorized"));

    const res = await request(app)
      .patch(`/api/listings/${listing._id}`)
      .send({ action: "markSold" });

    expect(res.status).toBe(401);
  });

  test("marks listing as sold when owner", async () => {
    const user = await User.create({
      name: "Seller",
      email: `seller-${Date.now()}@test.com`,
      password: "hashed",
      shareableBagId: `bag-${Date.now()}-${Math.random()}`,
    });

    const listing = await Listing.create({
      title: "Test Disc",
      brand: "Innova",
      type: "Sell",
      condition: "New",
      userId: user._id,
      sold: false,
      location: {
        type: "Point",
        coordinates: [-118, 34],
      },
    });

    // Create a message thread for this listing
    const thread = await MessageThread.create({
      listingId: listing._id,
      buyerId: new User()._id,
      sellerId: user._id,
      messages: [],
    });

    mockRequireUser.mockResolvedValueOnce({
      user: { id: user._id.toString() },
    });

    const res = await request(app)
      .patch(`/api/listings/${listing._id}`)
      .send({ action: "markSold" });

    expect(res.status).toBe(200);
    expect(res.body.listing).toBeDefined();
    expect(res.body.listing.sold).toBe(true);

    // Verify listing was updated in database
    const updatedListing = await Listing.findById(listing._id);
    expect(updatedListing?.sold).toBe(true);

    // Verify system message was sent to threads
    expect(mockAddSystemMessageToThreads).toHaveBeenCalledWith(
      listing._id.toString(),
      "This listing has been marked as SOLD by the seller."
    );
  });

  test("returns 403 when non-owner tries to mark as sold", async () => {
    const owner = await User.create({
      name: "Owner",
      email: `owner-patch-${Date.now()}@test.com`,
      password: "hashed",
      shareableBagId: `bag-${Date.now()}-${Math.random()}`,
    });

    const otherUser = await User.create({
      name: "Other User",
      email: `other-patch-${Date.now()}@test.com`,
      password: "hashed",
      shareableBagId: `bag-${Date.now()}-${Math.random()}`,
    });

    const listing = await Listing.create({
      title: "Test Disc",
      brand: "Innova",
      type: "Sell",
      condition: "New",
      userId: owner._id,
      location: {
        type: "Point",
        coordinates: [-118, 34],
      },
    });

    mockRequireUser.mockResolvedValueOnce({
      user: { id: otherUser._id.toString() },
    });

    const res = await request(app)
      .patch(`/api/listings/${listing._id}`)
      .send({ action: "markSold" });

    expect(res.status).toBe(403);
    expect(res.body.error).toBe("Forbidden");

    // Verify listing was not updated (sold should remain false or undefined)
    const unchangedListing = await Listing.findById(listing._id);
    expect(unchangedListing?.sold).not.toBe(true);

    // Verify system message was not sent
    expect(mockAddSystemMessageToThreads).not.toHaveBeenCalled();
  });

  test("returns 404 for non-existent listing", async () => {
    const user = await User.create({
      name: "Seller",
      email: `seller-patch-404-${Date.now()}@test.com`,
      password: "hashed",
      shareableBagId: `bag-${Date.now()}-${Math.random()}`,
    });

    mockRequireUser.mockResolvedValueOnce({
      user: { id: user._id.toString() },
    });

    const fakeId = "507f1f77bcf86cd799439011";
    const res = await request(app)
      .patch(`/api/listings/${fakeId}`)
      .send({ action: "markSold" });

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Listing not found");
  });

  test("ignores invalid action and performs full update when other fields are provided", async () => {
    const user = await User.create({
      name: "Seller",
      email: `seller-invalid-${Date.now()}@test.com`,
      password: "hashed",
      shareableBagId: `bag-${Date.now()}-${Math.random()}`,
    });

    const listing = await Listing.create({
      title: "Test Disc",
      brand: "Innova",
      type: "Sell",
      condition: "New",
      userId: user._id,
      location: {
        type: "Point",
        coordinates: [-118, 34],
      },
    });

    mockRequireUser.mockResolvedValueOnce({
      user: { id: user._id.toString() },
    });

    // Invalid action is ignored, update proceeds with provided fields
    const res = await request(app)
      .patch(`/api/listings/${listing._id}`)
      .send({ action: "invalidAction", title: "Updated Title" });

    expect(res.status).toBe(200);
    expect(res.body.listing.title).toBe("Updated Title");
  });

  test("updates listing when owner", async () => {
    const user = await User.create({
      name: "Seller",
      email: `seller-update-${Date.now()}@test.com`,
      password: "hashed",
      shareableBagId: `bag-${Date.now()}-${Math.random()}`,
    });

    const listing = await Listing.create({
      title: "Original Title",
      description: "Original description",
      brand: "Innova",
      plastic: "DX",
      weight: 175,
      color: "Red",
      condition: "New",
      type: "Sell",
      price: 20,
      city: "Los Angeles",
      state: "CA",
      userId: user._id,
      listingType: "single",
      location: {
        type: "Point",
        coordinates: [-118, 34],
      },
    });

    mockRequireUser.mockResolvedValueOnce({
      user: { id: user._id.toString() },
    });

    const res = await request(app)
      .patch(`/api/listings/${listing._id}`)
      .send({
        title: "Updated Title",
        description: "Updated description",
        brand: "Discraft",
        plastic: "ESP",
        weight: 177,
        color: "Blue",
        condition: "Like New",
        type: "Trade",
        price: 25,
        city: "San Francisco",
        state: "CA",
      });

    expect(res.status).toBe(200);
    expect(res.body.listing).toBeDefined();
    expect(res.body.listing.title).toBe("Updated Title");
    expect(res.body.listing.description).toBe("Updated description");
    expect(res.body.listing.brand).toBe("Discraft");
    expect(res.body.listing.plastic).toBe("ESP");
    expect(res.body.listing.weight).toBe(177);
    expect(res.body.listing.color).toBe("Blue");
    expect(res.body.listing.condition).toBe("Like New");
    expect(res.body.listing.type).toBe("Trade");
    expect(res.body.listing.price).toBe(25);
    expect(res.body.listing.city).toBe("San Francisco");
    expect(res.body.listing.state).toBe("CA");

    // Verify listing was updated in database
    const updatedListing = await Listing.findById(listing._id);
    expect(updatedListing?.title).toBe("Updated Title");
    expect(updatedListing?.description).toBe("Updated description");
    expect(updatedListing?.brand).toBe("Discraft");
  });

  test("updates group listing correctly (excludes single-disc fields)", async () => {
    const user = await User.create({
      name: "Seller",
      email: `seller-group-update-${Date.now()}@test.com`,
      password: "hashed",
      shareableBagId: `bag-${Date.now()}-${Math.random()}`,
    });

    const listing = await Listing.create({
      title: "Group Listing",
      description: "Multiple discs",
      brand: "Innova",
      type: "Sell",
      userId: user._id,
      listingType: "group",
      location: {
        type: "Point",
        coordinates: [-118, 34],
      },
    });

    mockRequireUser.mockResolvedValueOnce({
      user: { id: user._id.toString() },
    });

    const res = await request(app)
      .patch(`/api/listings/${listing._id}`)
      .send({
        title: "Updated Group Listing",
        description: "Updated description",
        brand: "Discraft",
        // Try to set single-disc fields (should be ignored/cleared)
        plastic: "ESP",
        weight: 177,
        color: "Blue",
        condition: "Like New",
        price: 25,
      });

    expect(res.status).toBe(200);
    expect(res.body.listing.title).toBe("Updated Group Listing");
    expect(res.body.listing.description).toBe("Updated description");
    expect(res.body.listing.brand).toBe("Discraft");

    // Verify single-disc fields are cleared for group listings
    // Mongoose converts undefined to null when saving
    const updatedListing = await Listing.findById(listing._id);
    expect(updatedListing?.plastic == null).toBe(true); // null or undefined
    expect(updatedListing?.weight == null).toBe(true); // null or undefined
    expect(updatedListing?.color == null).toBe(true); // null or undefined
    expect(updatedListing?.condition == null).toBe(true); // null or undefined
    expect(updatedListing?.price == null).toBe(true); // null or undefined
  });

  test("updates listing images", async () => {
    const user = await User.create({
      name: "Seller",
      email: `seller-images-${Date.now()}@test.com`,
      password: "hashed",
      shareableBagId: `bag-${Date.now()}-${Math.random()}`,
    });

    const listing = await Listing.create({
      title: "Test Disc",
      brand: "Innova",
      type: "Sell",
      condition: "New",
      userId: user._id,
      imageUrls: ["https://example.com/image1.jpg"],
      publicIds: ["publicId1"],
      location: {
        type: "Point",
        coordinates: [-118, 34],
      },
    });

    mockRequireUser.mockResolvedValueOnce({
      user: { id: user._id.toString() },
    });

    const res = await request(app)
      .patch(`/api/listings/${listing._id}`)
      .send({
        imageUrls: ["https://example.com/image1.jpg", "https://example.com/image2.jpg"],
        publicIds: ["publicId1", "publicId2"],
      });

    expect(res.status).toBe(200);
    expect(res.body.listing.imageUrls).toHaveLength(2);
    expect(res.body.listing.imageUrls).toContain("https://example.com/image2.jpg");
    expect(res.body.listing.publicIds).toHaveLength(2);
  });

  test("returns 403 when non-owner tries to update", async () => {
    const owner = await User.create({
      name: "Owner",
      email: `owner-update-${Date.now()}@test.com`,
      password: "hashed",
      shareableBagId: `bag-${Date.now()}-${Math.random()}`,
    });

    const otherUser = await User.create({
      name: "Other User",
      email: `other-update-${Date.now()}@test.com`,
      password: "hashed",
      shareableBagId: `bag-${Date.now()}-${Math.random()}`,
    });

    const listing = await Listing.create({
      title: "Test Disc",
      brand: "Innova",
      type: "Sell",
      condition: "New",
      userId: owner._id,
      location: {
        type: "Point",
        coordinates: [-118, 34],
      },
    });

    mockRequireUser.mockResolvedValueOnce({
      user: { id: otherUser._id.toString() },
    });

    const res = await request(app)
      .patch(`/api/listings/${listing._id}`)
      .send({
        title: "Hacked Title",
      });

    expect(res.status).toBe(403);
    expect(res.body.error).toBe("Forbidden");

    // Verify listing was not updated
    const unchangedListing = await Listing.findById(listing._id);
    expect(unchangedListing?.title).toBe("Test Disc");
  });
});

describe("DELETE /api/listings/[id]", () => {
  afterEach(async () => {
    await resetTestDb();
    resetAllMocks();
  });

  test("requires authentication", async () => {
    const user = await User.create({
      name: "Seller",
      email: `seller-delete-auth-${Date.now()}@test.com`,
      password: "hashed",
      shareableBagId: `bag-${Date.now()}-${Math.random()}`,
    });

    const listing = await Listing.create({
      title: "Test Disc",
      brand: "Innova",
      type: "Sell",
      condition: "New",
      userId: user._id,
      location: {
        type: "Point",
        coordinates: [-118, 34],
      },
    });

    mockRequireUser.mockRejectedValueOnce(new UnauthorizedError("Unauthorized"));

    const res = await request(app).delete(`/api/listings/${listing._id}`);

    expect(res.status).toBe(401);
  });

  test("deletes listing when owner", async () => {
    const user = await User.create({
      name: "Seller",
      email: `seller-delete-owner-${Date.now()}@test.com`,
      password: "hashed",
      shareableBagId: `bag-${Date.now()}-${Math.random()}`,
    });

    const listing = await Listing.create({
      title: "Test Disc",
      brand: "Innova",
      type: "Sell",
      condition: "New",
      userId: user._id,
      imageUrls: ["https://res.cloudinary.com/test/image/upload/v123/test.jpg"],
      publicIds: ["test"],
      location: {
        type: "Point",
        coordinates: [-118, 34],
      },
    });

    // Create a message thread for this listing
    const thread = await MessageThread.create({
      listingId: listing._id,
      buyerId: new User()._id,
      sellerId: user._id,
      messages: [],
    });

    mockRequireUser.mockResolvedValueOnce({
      user: { id: user._id.toString() },
    });

    const res = await request(app).delete(`/api/listings/${listing._id}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Listing deleted successfully");

    // Verify listing was deleted from database
    const deletedListing = await Listing.findById(listing._id);
    expect(deletedListing).toBeNull();

    // Verify system message was sent to threads
    expect(mockAddSystemMessageToThreads).toHaveBeenCalledWith(
      listing._id.toString(),
      "This listing has been deleted by the seller."
    );
  });

  test("deletes Cloudinary images when listing has publicIds", async () => {
    const user = await User.create({
      name: "Seller",
      email: `seller-cloudinary1-${Date.now()}@test.com`,
      password: "hashed",
      shareableBagId: `bag-${Date.now()}-${Math.random()}`,
    });

    const listing = await Listing.create({
      title: "Test Disc",
      brand: "Innova",
      type: "Sell",
      condition: "New",
      userId: user._id,
      publicIds: ["image1", "image2"],
      location: {
        type: "Point",
        coordinates: [-118, 34],
      },
    });

    mockRequireUser.mockResolvedValueOnce({
      user: { id: user._id.toString() },
    });

    await request(app).delete(`/api/listings/${listing._id}`);

    // Verify Cloudinary destroy was called for each publicId
    expect(mockCloudinaryDestroy).toHaveBeenCalledWith("image1");
    expect(mockCloudinaryDestroy).toHaveBeenCalledWith("image2");
  });

  test("deletes Cloudinary images when listing has imageUrls but no publicIds", async () => {
    const user = await User.create({
      name: "Seller",
      email: `seller-cloudinary2-${Date.now()}@test.com`,
      password: "hashed",
      shareableBagId: `bag-${Date.now()}-${Math.random()}`,
    });

    const listing = await Listing.create({
      title: "Test Disc",
      brand: "Innova",
      type: "Sell",
      condition: "New",
      userId: user._id,
      imageUrls: [
        "https://res.cloudinary.com/test/image/upload/v123/image1.jpg",
        "https://res.cloudinary.com/test/image/upload/v456/image2.png",
      ],
      location: {
        type: "Point",
        coordinates: [-118, 34],
      },
    });

    mockRequireUser.mockResolvedValueOnce({
      user: { id: user._id.toString() },
    });

    await request(app).delete(`/api/listings/${listing._id}`);

    // Verify Cloudinary destroy was called with extracted publicIds from URLs
    // The code extracts publicIds from Cloudinary URLs when publicIds array is empty
    expect(mockCloudinaryDestroy).toHaveBeenCalledWith("image1");
    expect(mockCloudinaryDestroy).toHaveBeenCalledWith("image2");
  });

  test("returns 403 when non-owner tries to delete", async () => {
    const owner = await User.create({
      name: "Owner",
      email: `owner-delete-${Date.now()}@test.com`,
      password: "hashed",
      shareableBagId: `bag-${Date.now()}-${Math.random()}`,
    });

    const otherUser = await User.create({
      name: "Other User",
      email: `other-delete-${Date.now()}@test.com`,
      password: "hashed",
      shareableBagId: `bag-${Date.now()}-${Math.random()}`,
    });

    const listing = await Listing.create({
      title: "Test Disc",
      brand: "Innova",
      type: "Sell",
      condition: "New",
      userId: owner._id,
      location: {
        type: "Point",
        coordinates: [-118, 34],
      },
    });

    mockRequireUser.mockResolvedValueOnce({
      user: { id: otherUser._id.toString() },
    });

    const res = await request(app).delete(`/api/listings/${listing._id}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toBe("Forbidden");

    // Verify listing was not deleted
    const unchangedListing = await Listing.findById(listing._id);
    expect(unchangedListing).toBeTruthy();

    // Verify system message was not sent
    expect(mockAddSystemMessageToThreads).not.toHaveBeenCalled();
  });

  test("returns 404 for non-existent listing", async () => {
    const user = await User.create({
      name: "Seller",
      email: `seller-delete-404-${Date.now()}@test.com`,
      password: "hashed",
      shareableBagId: `bag-${Date.now()}-${Math.random()}`,
    });

    mockRequireUser.mockResolvedValueOnce({
      user: { id: user._id.toString() },
    });

    // Use a valid ObjectId format but non-existent ID
    const fakeId = "507f1f77bcf86cd799439011";
    const res = await request(app).delete(`/api/listings/${fakeId}`);

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Listing not found");
  });

  test("handles Cloudinary deletion errors gracefully", async () => {
    const user = await User.create({
      name: "Seller",
      email: `seller-error-${Date.now()}@test.com`,
      password: "hashed",
      shareableBagId: `bag-${Date.now()}-${Math.random()}`,
    });

    const listing = await Listing.create({
      title: "Test Disc",
      brand: "Innova",
      type: "Sell",
      condition: "New",
      userId: user._id,
      publicIds: ["failing-image"],
      location: {
        type: "Point",
        coordinates: [-118, 34],
      },
    });

    // Mock Cloudinary to throw an error
    mockCloudinaryDestroy.mockRejectedValueOnce(
      new Error("Cloudinary error")
    );

    mockRequireUser.mockResolvedValueOnce({
      user: { id: user._id.toString() },
    });

    // Should still succeed even if Cloudinary fails
    const res = await request(app).delete(`/api/listings/${listing._id}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Listing deleted successfully");

    // Verify listing was still deleted
    const deletedListing = await Listing.findById(listing._id);
    expect(deletedListing).toBeNull();
  });
});

