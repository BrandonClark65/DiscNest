import { describe, test, expect, beforeAll, afterEach, afterAll, vi } from "vitest";
import request from "supertest";
import app from "../../utils/testServer";
import { connectTestDb, resetTestDb, closeTestDb } from "../../utils/testDb";
import MessageThread from "@/models/MessageThread";
import User from "@/models/User";
import Listing from "@/models/Listing";

// Mock database connection
vi.mock("@/lib/mongodb", () => ({
  connectToDatabase: async () => {},
}));

// Mock error logger
vi.mock("@/lib/errorLogger", () => ({
  logError: vi.fn(),
}));

// Mock withErrorHandling
vi.mock("@/lib/withErrorHandling", () => ({
  withErrorHandling: (handler: any) => handler,
}));

// Mock getServerSession
const mockGetServerSession = vi.fn();
vi.mock("next-auth", () => ({
  getServerSession: () => mockGetServerSession(),
}));

describe("GET /api/messages", () => {
  beforeAll(connectTestDb);
  afterEach(async () => {
    await resetTestDb();
    mockGetServerSession.mockReset();
  });
  afterAll(closeTestDb);

  test("requires authentication", async () => {
    mockGetServerSession.mockResolvedValueOnce(null);

    const res = await request(app).get("/api/messages");

    expect(res.status).toBe(401);
  });

  test("returns empty array when user has no threads", async () => {
    const user = await User.create({
      name: "User",
      email: "user@test.com",
      password: "hashed",
      shareableBagId: `bag-${Date.now()}-${Math.random()}`,
    });

    mockGetServerSession.mockResolvedValueOnce({
      user: { id: user._id.toString() },
    });

    const res = await request(app).get("/api/messages");

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  test("returns user's message threads", async () => {
    const user1 = await User.create({
      name: "User 1",
      email: "user1@test.com",
      password: "hashed",
      shareableBagId: `bag-${Date.now()}-${Math.random()}`,
    });

    const user2 = await User.create({
      name: "User 2",
      email: "user2@test.com",
      password: "hashed",
      shareableBagId: `bag-${Date.now()}-${Math.random()}`,
    });

    const listing = await Listing.create({
      title: "Test Listing",
      brand: "Innova",
      type: "Sell",
      condition: "New",
      userId: user2._id,
    });

    const thread = await MessageThread.create({
      participants: [user1._id, user2._id],
      listingId: listing._id,
      messages: [
        {
          sender: user1._id,
          content: "Hello",
          readBy: [user1._id],
        },
      ],
    });

    mockGetServerSession.mockResolvedValueOnce({
      user: { id: user1._id.toString() },
    });

    const res = await request(app).get("/api/messages");

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0]._id).toBe(thread._id.toString());
  });
});

describe("POST /api/messages", () => {
  beforeAll(connectTestDb);
  afterEach(async () => {
    await resetTestDb();
    mockGetServerSession.mockReset();
  });
  afterAll(closeTestDb);

  test("requires authentication", async () => {
    mockGetServerSession.mockResolvedValueOnce(null);

    const res = await request(app)
      .post("/api/messages")
      .send({ recipientId: "user2", listingId: "listing1" });

    expect(res.status).toBe(401);
  });

  test("requires recipientId", async () => {
    const user = await User.create({
      name: "User",
      email: "user@test.com",
      password: "hashed",
      shareableBagId: `bag-${Date.now()}-${Math.random()}`,
    });

    mockGetServerSession.mockResolvedValueOnce({
      user: { id: user._id.toString() },
    });

    const res = await request(app)
      .post("/api/messages")
      .send({ listingId: "listing1" });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Recipient is required");
  });

  test("requires listingId or requestId", async () => {
    const user1 = await User.create({
      name: "User 1",
      email: "user1@test.com",
      password: "hashed",
      shareableBagId: `bag-${Date.now()}-${Math.random()}`,
    });

    const user2 = await User.create({
      name: "User 2",
      email: "user2@test.com",
      password: "hashed",
      shareableBagId: `bag-${Date.now()}-${Math.random()}`,
    });

    mockGetServerSession.mockResolvedValueOnce({
      user: { id: user1._id.toString() },
    });

    const res = await request(app)
      .post("/api/messages")
      .send({ recipientId: user2._id.toString() });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Either listingId or requestId is required");
  });

  test("creates new thread with listing", async () => {
    const user1 = await User.create({
      name: "User 1",
      email: "user1@test.com",
      password: "hashed",
      shareableBagId: `bag-${Date.now()}-${Math.random()}`,
    });

    const user2 = await User.create({
      name: "User 2",
      email: "user2@test.com",
      password: "hashed",
      shareableBagId: `bag-${Date.now()}-${Math.random()}`,
    });

    const listing = await Listing.create({
      title: "Test Listing",
      brand: "Innova",
      type: "Sell",
      condition: "New",
      userId: user2._id,
    });

    mockGetServerSession.mockResolvedValueOnce({
      user: { id: user1._id.toString() },
    });

    const res = await request(app)
      .post("/api/messages")
      .send({
        recipientId: user2._id.toString(),
        listingId: listing._id.toString(),
        content: "Hello, is this available?",
      });

    expect(res.status).toBe(200);
    expect(res.body.participants).toHaveLength(2);
    expect(res.body.listingId).toBeTruthy();
    expect(res.body.messages).toHaveLength(1);
    expect(res.body.messages[0].content).toBe("Hello, is this available?");
  });

  test("returns existing thread if already exists", async () => {
    const user1 = await User.create({
      name: "User 1",
      email: "user1@test.com",
      password: "hashed",
      shareableBagId: `bag-${Date.now()}-${Math.random()}`,
    });

    const user2 = await User.create({
      name: "User 2",
      email: "user2@test.com",
      password: "hashed",
      shareableBagId: `bag-${Date.now()}-${Math.random()}`,
    });

    const listing = await Listing.create({
      title: "Test Listing",
      brand: "Innova",
      type: "Sell",
      condition: "New",
      userId: user2._id,
    });

    const existingThread = await MessageThread.create({
      participants: [user1._id, user2._id],
      listingId: listing._id,
      messages: [],
    });

    mockGetServerSession.mockResolvedValueOnce({
      user: { id: user1._id.toString() },
    });

    const res = await request(app)
      .post("/api/messages")
      .send({
        recipientId: user2._id.toString(),
        listingId: listing._id.toString(),
      });

    expect(res.status).toBe(200);
    expect(res.body._id).toBe(existingThread._id.toString());
  });
});
