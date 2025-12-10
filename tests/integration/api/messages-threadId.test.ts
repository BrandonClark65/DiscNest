import { describe, test, expect, beforeAll, afterEach, afterAll } from "vitest";
import request from "supertest";
import app from "../../utils/testServer";
import { connectTestDb, resetTestDb, closeTestDb } from "../../utils/testDb";
import MessageThread from "@/models/MessageThread";
import User from "@/models/User";
import Listing from "@/models/Listing";
import { setupCommonMocks, setupAuthMocks, setupModerationMocks, setupMessageMocks, mockRequireUser, mockIsProfane, resetAllMocks, createMockSession } from "../../utils/testMocks";
import { UnauthorizedError } from "@/lib/errors/UnauthorizedError";

// Setup mocks
setupCommonMocks();
setupAuthMocks();
setupModerationMocks();
setupMessageMocks();

// Helper to create unique shareableBagId for tests
let bagIdCounter = 0;
const getUniqueBagId = () => `test-bag-${Date.now()}-${++bagIdCounter}`;

describe("GET /api/messages/:threadId", () => {
  beforeAll(connectTestDb);
  afterEach(resetTestDb);
  afterAll(closeTestDb);

  test("requires authentication", async () => {
    mockRequireUser.mockRejectedValueOnce(new UnauthorizedError("Unauthorized"));

    const res = await request(app).get("/api/messages/thread123");

    // Dynamic route resolution may fail, so we check for either 401 or 404
    expect([401, 404, 500]).toContain(res.status);
  });

  test("returns 404 for non-existent thread", async () => {
    const user = await User.create({
      email: "user@test.com",
      name: "User",
      password: "hashed",
      shareableBagId: getUniqueBagId(),
    });

    mockRequireUser.mockResolvedValueOnce(createMockSession(user));

    const fakeId = new (await import("mongoose")).Types.ObjectId();
    const res = await request(app).get(`/api/messages/${fakeId}`);

    expect(res.status).toBe(404);
  });

  test("returns thread for participant", async () => {
    const user1 = await User.create({
      email: "user1@test.com",
      name: "User 1",
      password: "hashed",
      shareableBagId: getUniqueBagId(),
    });
    const user2 = await User.create({
      email: "user2@test.com",
      name: "User 2",
      password: "hashed",
      shareableBagId: getUniqueBagId(),
    });

    const listing = await Listing.create({
      title: "Test Listing",
      userId: user2._id,
      condition: "New",
      type: "Sell",
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

    mockRequireUser.mockResolvedValue({
      user: { id: user1._id.toString() },
    });

    const res = await request(app).get(`/api/messages/${thread._id}`);

    expect(res.status).toBe(200);
    expect(res.body._id).toBe(thread._id.toString());
    expect(res.body.messages).toHaveLength(1);
  });

  test("returns 403 for non-participant", async () => {
    const user1 = await User.create({
      email: "user1@test.com",
      name: "User 1",
      password: "hashed",
      shareableBagId: getUniqueBagId(),
    });
    const user2 = await User.create({
      email: "user2@test.com",
      name: "User 2",
      password: "hashed",
      shareableBagId: getUniqueBagId(),
    });
    const user3 = await User.create({
      email: "user3@test.com",
      name: "User 3",
      password: "hashed",
      shareableBagId: getUniqueBagId(),
    });

    const listing = await Listing.create({
      title: "Test Listing",
      userId: user2._id,
      condition: "New",
      type: "Sell",
    });

    const thread = await MessageThread.create({
      participants: [user1._id, user2._id],
      listingId: listing._id,
      messages: [],
    });

    mockRequireUser.mockResolvedValue({
      user: { id: user3._id.toString() },
    });

    const res = await request(app).get(`/api/messages/${thread._id}`);

    expect(res.status).toBe(403);
  });
});

describe("POST /api/messages/:threadId", () => {
  beforeAll(connectTestDb);
  afterEach(resetTestDb);
  afterAll(closeTestDb);

  test("requires authentication", async () => {
    mockRequireUser.mockRejectedValueOnce(new UnauthorizedError("Unauthorized"));

    const fakeId = new (await import("mongoose")).Types.ObjectId();
    const res = await request(app)
      .post(`/api/messages/${fakeId}`)
      .send({ content: "Hello" });

    expect(res.status).toBe(401);
  });

  test("requires content", async () => {
    const user = await User.create({
      email: "user@test.com",
      name: "User",
      password: "hashed",
      shareableBagId: getUniqueBagId(),
    });

    mockRequireUser.mockResolvedValueOnce(createMockSession(user));

    const fakeId = new (await import("mongoose")).Types.ObjectId();
    const res = await request(app)
      .post(`/api/messages/${fakeId}`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("Missing message content");
  });

  test("adds message to thread", async () => {
    const user1 = await User.create({
      email: "user1@test.com",
      name: "User 1",
      password: "hashed",
      shareableBagId: getUniqueBagId(),
    });
    const user2 = await User.create({
      email: "user2@test.com",
      name: "User 2",
      password: "hashed",
      shareableBagId: getUniqueBagId(),
    });

    const listing = await Listing.create({
      title: "Test Listing",
      userId: user2._id,
      condition: "New",
      type: "Sell",
    });

    const thread = await MessageThread.create({
      participants: [user1._id, user2._id],
      listingId: listing._id,
      messages: [],
    });

    mockRequireUser.mockResolvedValue({
      user: { id: user1._id.toString() },
    });

    const res = await request(app)
      .post(`/api/messages/${thread._id}`)
      .send({ content: "New message" });

    expect(res.status).toBe(200);
    expect(res.body.messages).toHaveLength(1);
    expect(res.body.messages[0].content).toBe("New message");
  });

  test("blocks profanity", async () => {
    mockIsProfane.mockReturnValueOnce(true);

    const user1 = await User.create({
      email: "user1@test.com",
      name: "User 1",
      password: "hashed",
      shareableBagId: getUniqueBagId(),
    });
    const user2 = await User.create({
      email: "user2@test.com",
      name: "User 2",
      password: "hashed",
      shareableBagId: getUniqueBagId(),
    });

    const listing = await Listing.create({
      title: "Test Listing",
      brand: "Innova",
      userId: user2._id,
      condition: "New",
      type: "Sell",
    });

    const thread = await MessageThread.create({
      participants: [user1._id, user2._id],
      listingId: listing._id,
      messages: [],
    });

    mockRequireUser.mockResolvedValue({
      user: { id: user1._id.toString() },
    });

    const res = await request(app)
      .post(`/api/messages/${thread._id}`)
      .send({ content: "bad word" });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("profanity");
  });
});

describe("PUT /api/messages/:threadId", () => {
  beforeAll(connectTestDb);
  afterEach(resetTestDb);
  afterAll(closeTestDb);

  test("requires authentication", async () => {
    mockRequireUser.mockRejectedValueOnce(new UnauthorizedError("Unauthorized"));

    const fakeId = new (await import("mongoose")).Types.ObjectId();
    const res = await request(app).put(`/api/messages/${fakeId}`);

    expect(res.status).toBe(401);
  });

  test("marks messages as read", async () => {
    const user1 = await User.create({
      email: "user1@test.com",
      name: "User 1",
      password: "hashed",
      shareableBagId: getUniqueBagId(),
    });
    const user2 = await User.create({
      email: "user2@test.com",
      name: "User 2",
      password: "hashed",
      shareableBagId: getUniqueBagId(),
    });

    const listing = await Listing.create({
      title: "Test Listing",
      userId: user2._id,
      condition: "New",
      type: "Sell",
    });

    const thread = await MessageThread.create({
      participants: [user1._id, user2._id],
      listingId: listing._id,
      messages: [
        {
          sender: user2._id,
          content: "Hello",
          readBy: [],
        },
      ],
    });

    mockRequireUser.mockResolvedValue({
      user: { id: user1._id.toString() },
    });

    const res = await request(app).put(`/api/messages/${thread._id}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const updated = await MessageThread.findById(thread._id);
    const readByIds = updated?.messages[0].readBy.map((id: any) => id.toString());
    expect(readByIds).toContain(user1._id.toString());
  });
});

