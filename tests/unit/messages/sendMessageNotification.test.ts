import { describe, test, expect, beforeAll, beforeEach, afterAll, vi } from "vitest";
import MessageThread from "@/models/MessageThread";
import User from "@/models/User";
import Listing from "@/models/Listing";
import DiscRequest from "@/models/DiscRequest";
import mongoose from "mongoose";
import { connectTestDb, resetTestDb, closeTestDb } from "../../utils/testDb";

// Mock Resend - must be hoisted
const mockSendEmail = vi.fn();
vi.mock("@/lib/resend", () => ({
  resend: {
    emails: {
      send: (...args: any[]) => mockSendEmail(...args),
    },
  },
}));

// Mock error logger - must be hoisted
const mockLogError = vi.fn();
vi.mock("@/lib/errorLogger", () => ({
  logError: (...args: any[]) => mockLogError(...args),
}));

// Import after mocks are set up
import { sendMessageNotification } from "@/lib/messages/sendMessageNotification";

// Helper to create unique shareableBagId for tests
let bagIdCounter = 0;
const getUniqueBagId = () => `test-bag-${Date.now()}-${++bagIdCounter}`;

describe("sendMessageNotification", () => {
  beforeAll(async () => {
    await connectTestDb();
    mockSendEmail.mockResolvedValue({ id: "email-123" });
  });
  beforeEach(async () => {
    await resetTestDb();
    mockSendEmail.mockClear();
    mockSendEmail.mockResolvedValue({ id: "email-123" });
    mockLogError.mockClear();
    process.env.RESEND_FROM_DEV = "noreply@dev.example.com";
    process.env.RESEND_FROM_PROD = "noreply@prod.example.com";
    process.env.NODE_ENV = "development";
    process.env.NEXT_PUBLIC_BASE_URL = "http://localhost:3000";
  });
  afterAll(closeTestDb);

  test("skips system messages", async () => {
    const systemSenderId = "000000000000000000000000";
    
    await sendMessageNotification("thread123", systemSenderId, "System message");

    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  test("skips when thread not found", async () => {
    const user = await User.create({
      name: "Sender",
      email: "sender@test.com",
      password: "hashed",
      shareableBagId: getUniqueBagId(),
    });

    const fakeThreadId = new mongoose.Types.ObjectId().toString();
    await sendMessageNotification(fakeThreadId, user._id.toString(), "Hello");

    expect(mockSendEmail).not.toHaveBeenCalled();
    expect(mockLogError).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining("Thread"),
        severity: "medium",
      })
    );
  });

  test("skips when sender not found", async () => {
    const user1 = await User.create({
      name: "User 1",
      email: "user1@test.com",
      password: "hashed",
      shareableBagId: getUniqueBagId(),
    });
    const user2 = await User.create({
      name: "User 2",
      email: "user2@test.com",
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

    const fakeSenderId = new mongoose.Types.ObjectId().toString();
    await sendMessageNotification(thread._id.toString(), fakeSenderId, "Hello");

    expect(mockSendEmail).not.toHaveBeenCalled();
    expect(mockLogError).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining("Sender"),
        severity: "medium",
      })
    );
  });

  test("skips when no recipients", async () => {
    const user = await User.create({
      name: "User",
      email: "user@test.com",
      password: "hashed",
      shareableBagId: getUniqueBagId(),
    });

    const listing = await Listing.create({
      title: "Test Listing",
      userId: user._id,
      condition: "New",
      type: "Sell",
    });

    const thread = await MessageThread.create({
      participants: [user._id], // Only sender, no recipient
      listingId: listing._id,
      messages: [],
    });

    await sendMessageNotification(thread._id.toString(), user._id.toString(), "Hello");

    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  test("skips when recipients have no email", async () => {
    const sender = await User.create({
      name: "Sender",
      email: "sender@test.com",
      password: "hashed",
      shareableBagId: getUniqueBagId(),
    });

    const recipient = await User.create({
      name: "Recipient",
      // No email
      password: "hashed",
      shareableBagId: getUniqueBagId(),
    });

    const listing = await Listing.create({
      title: "Test Listing",
      userId: recipient._id,
      condition: "New",
      type: "Sell",
    });

    const thread = await MessageThread.create({
      participants: [sender._id, recipient._id],
      listingId: listing._id,
      messages: [],
    });

    await sendMessageNotification(thread._id.toString(), sender._id.toString(), "Hello");

    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  test("sends email notification to recipient", async () => {
    const sender = await User.create({
      name: "John Doe",
      email: "sender@test.com",
      password: "hashed",
      shareableBagId: getUniqueBagId(),
    });

    const recipient = await User.create({
      name: "Jane Smith",
      email: "recipient@test.com",
      password: "hashed",
      shareableBagId: getUniqueBagId(),
    });

    const listing = await Listing.create({
      title: "Champion Teebird",
      userId: recipient._id,
      condition: "New",
      type: "Sell",
    });

    const thread = await MessageThread.create({
      participants: [sender._id, recipient._id],
      listingId: listing._id,
      messages: [],
    });

    await sendMessageNotification(
      thread._id.toString(),
      sender._id.toString(),
      "Is this disc still available?"
    );

    expect(mockSendEmail).toHaveBeenCalledTimes(1);
    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        from: "noreply@dev.example.com",
        to: "recipient@test.com",
        subject: expect.stringMatching(/John Doe.*Champion Teebird|Champion Teebird.*John Doe/),
        text: expect.stringContaining("Is this disc still available?"),
        html: expect.stringContaining("Is this disc still available?"),
      })
    );
  });

  test("sends email with request context", async () => {
    const sender = await User.create({
      name: "John Doe",
      email: "sender@test.com",
      password: "hashed",
      shareableBagId: getUniqueBagId(),
    });

    const recipient = await User.create({
      name: "Jane Smith",
      email: "recipient@test.com",
      password: "hashed",
      shareableBagId: getUniqueBagId(),
    });

    const request = await DiscRequest.create({
      title: "Looking for Destroyer",
      userId: recipient._id,
      location: {
        type: "Point",
        coordinates: [-122.4194, 37.7749],
      },
    });

    const thread = await MessageThread.create({
      participants: [sender._id, recipient._id],
      requestId: request._id,
      messages: [],
    });

    await sendMessageNotification(
      thread._id.toString(),
      sender._id.toString(),
      "I have one available!"
    );

    expect(mockSendEmail).toHaveBeenCalledTimes(1);
    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: expect.stringContaining("Looking for Destroyer"),
        text: expect.stringContaining("Looking for Destroyer"),
      })
    );
  });

  test("sends email without context when no listing or request", async () => {
    const sender = await User.create({
      name: "John Doe",
      email: "sender@test.com",
      password: "hashed",
      shareableBagId: getUniqueBagId(),
    });

    const recipient = await User.create({
      name: "Jane Smith",
      email: "recipient@test.com",
      password: "hashed",
      shareableBagId: getUniqueBagId(),
    });

    const thread = await MessageThread.create({
      participants: [sender._id, recipient._id],
      messages: [],
    });

    await sendMessageNotification(
      thread._id.toString(),
      sender._id.toString(),
      "Hello!"
    );

    expect(mockSendEmail).toHaveBeenCalledTimes(1);
    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: "New message from John Doe",
        text: expect.not.stringContaining("about"),
      })
    );
  });

  test("truncates long messages in preview", async () => {
    const sender = await User.create({
      name: "John Doe",
      email: "sender@test.com",
      password: "hashed",
      shareableBagId: getUniqueBagId(),
    });

    const recipient = await User.create({
      name: "Jane Smith",
      email: "recipient@test.com",
      password: "hashed",
      shareableBagId: getUniqueBagId(),
    });

    const thread = await MessageThread.create({
      participants: [sender._id, recipient._id],
      messages: [],
    });

    const longMessage = "A".repeat(200);
    await sendMessageNotification(thread._id.toString(), sender._id.toString(), longMessage);

    expect(mockSendEmail).toHaveBeenCalledTimes(1);
    const call = mockSendEmail.mock.calls[0][0];
    expect(call.text).toContain("A".repeat(150) + "...");
    expect(call.html).toContain("A".repeat(150) + "...");
  });

  test("uses production email in production environment", async () => {
    process.env.NODE_ENV = "production";

    const sender = await User.create({
      name: "John Doe",
      email: "sender@test.com",
      password: "hashed",
      shareableBagId: getUniqueBagId(),
    });

    const recipient = await User.create({
      name: "Jane Smith",
      email: "recipient@test.com",
      password: "hashed",
      shareableBagId: getUniqueBagId(),
    });

    const thread = await MessageThread.create({
      participants: [sender._id, recipient._id],
      messages: [],
    });

    await sendMessageNotification(thread._id.toString(), sender._id.toString(), "Hello");

    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        from: "noreply@prod.example.com",
      })
    );
  });

  test("handles email send failure gracefully", async () => {
    mockSendEmail.mockRejectedValueOnce(new Error("Email service unavailable"));

    const sender = await User.create({
      name: "John Doe",
      email: "sender@test.com",
      password: "hashed",
      shareableBagId: getUniqueBagId(),
    });

    const recipient = await User.create({
      name: "Jane Smith",
      email: "recipient@test.com",
      password: "hashed",
      shareableBagId: getUniqueBagId(),
    });

    const thread = await MessageThread.create({
      participants: [sender._id, recipient._id],
      messages: [],
    });

    // Should not throw
    await expect(
      sendMessageNotification(thread._id.toString(), sender._id.toString(), "Hello")
    ).resolves.not.toThrow();

    expect(mockLogError).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining("Failed to send message notification email"),
        severity: "medium",
      })
    );
  });

  test("sends to multiple recipients", async () => {
    const sender = await User.create({
      name: "John Doe",
      email: "sender@test.com",
      password: "hashed",
      shareableBagId: getUniqueBagId(),
    });

    const recipient1 = await User.create({
      name: "Jane Smith",
      email: "recipient1@test.com",
      password: "hashed",
      shareableBagId: getUniqueBagId(),
    });

    const recipient2 = await User.create({
      name: "Bob Johnson",
      email: "recipient2@test.com",
      password: "hashed",
      shareableBagId: getUniqueBagId(),
    });

    const thread = await MessageThread.create({
      participants: [sender._id, recipient1._id, recipient2._id],
      messages: [],
    });

    await sendMessageNotification(thread._id.toString(), sender._id.toString(), "Hello all!");

    expect(mockSendEmail).toHaveBeenCalledTimes(2);
    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: "recipient1@test.com" })
    );
    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: "recipient2@test.com" })
    );
  });

  test("logs error when RESEND_FROM_DEV not configured", async () => {
    delete process.env.RESEND_FROM_DEV;
    delete process.env.RESEND_FROM_PROD;

    const sender = await User.create({
      name: "John Doe",
      email: "sender@test.com",
      password: "hashed",
      shareableBagId: getUniqueBagId(),
    });

    const recipient = await User.create({
      name: "Jane Smith",
      email: "recipient@test.com",
      password: "hashed",
      shareableBagId: getUniqueBagId(),
    });

    const thread = await MessageThread.create({
      participants: [sender._id, recipient._id],
      messages: [],
    });

    await sendMessageNotification(thread._id.toString(), sender._id.toString(), "Hello");

    expect(mockSendEmail).not.toHaveBeenCalled();
    expect(mockLogError).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining("RESEND_FROM_PROD or RESEND_FROM_DEV not configured"),
        severity: "high",
      })
    );
  });

  test("includes thread URL in email", async () => {
    const sender = await User.create({
      name: "John Doe",
      email: "sender@test.com",
      password: "hashed",
      shareableBagId: getUniqueBagId(),
    });

    const recipient = await User.create({
      name: "Jane Smith",
      email: "recipient@test.com",
      password: "hashed",
      shareableBagId: getUniqueBagId(),
    });

    const thread = await MessageThread.create({
      participants: [sender._id, recipient._id],
      messages: [],
    });

    await sendMessageNotification(thread._id.toString(), sender._id.toString(), "Hello");

    const call = mockSendEmail.mock.calls[0][0];
    const threadUrl = `http://localhost:3000/messages/${thread._id}`;
    expect(call.text).toContain(threadUrl);
    expect(call.html).toContain(threadUrl);
  });
});

