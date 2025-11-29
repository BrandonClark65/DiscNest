// tests/integration/api/report.test.ts
import { describe, test, expect, beforeAll, afterEach, afterAll, vi } from "vitest";
import request from "supertest";
import app from "../../utils/testServer";
import { connectTestDb, resetTestDb, closeTestDb } from "../../utils/testDb";
import User from "@/models/User";
import UserReport from "@/models/UserReport";
import { UnauthorizedError } from "@/lib/errors/UnauthorizedError";

/* ----------------------------------------------------
   MOCK DATABASE (use in-memory DB instead of Mongo)
---------------------------------------------------- */
vi.mock("@/lib/mongodb", () => ({
  connectToDatabase: async () => {}, // no-op
}));

/* ----------------------------------------------------
   MOCK ERROR LOGGER
---------------------------------------------------- */
vi.mock("@/lib/errorLogger", () => ({
  logError: vi.fn(), // disable email sending
}));

/* ----------------------------------------------------
   MOCK withErrorHandling (so it doesn't wrap errors)
---------------------------------------------------- */
vi.mock("@/lib/withErrorHandling", () => ({
  withErrorHandling: (handler: any) => handler, // passthrough
}));

/* ----------------------------------------------------
   MOCK AUTHENTICATION
---------------------------------------------------- */
// Mock requireUser for authenticated routes
const mockRequireUser = vi.fn();
vi.mock("@/lib/auth/requireUser", () => ({
  requireUser: () => mockRequireUser(),
}));

// Mock withUserAuth
vi.mock("@/lib/auth/withUserAuth", () => ({
  withUserAuth: (handler: any) => async (req: Request, context?: any) => {
    try {
      const session = await mockRequireUser();
      return handler(req, session, context);
    } catch (err: any) {
      const { NextResponse } = await import("next/server");
      const status = err.name === "UnauthorizedError" ? 401 : 500;
      return NextResponse.json({ error: err.message }, { status });
    }
  },
}));

/* ----------------------------------------------------
   TESTS
---------------------------------------------------- */

describe("POST /api/report", () => {
  beforeAll(connectTestDb);
  afterEach(async () => {
    await resetTestDb();
    mockRequireUser.mockReset();
  });
  afterAll(closeTestDb);

  test("requires authentication", async () => {
    mockRequireUser.mockRejectedValueOnce(new UnauthorizedError("Unauthorized"));

    const res = await request(app)
      .post("/api/report")
      .send({
        reportedUserId: "507f1f77bcf86cd799439011",
      });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Unauthorized: Unauthorized");
  });

  test("validates reportedUserId is required", async () => {
    const reporter = await User.create({
      name: "Reporter",
      email: "reporter@example.com",
      password: "hashed",
      shareableBagId: `bag-${Date.now()}-${Math.random()}`,
    });

    mockRequireUser.mockResolvedValueOnce({
      user: { id: reporter._id.toString() },
    });

    const res = await request(app)
      .post("/api/report")
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Missing reportedUserId");
  });

  test("prevents self-reporting", async () => {
    const user = await User.create({
      name: "Test User",
      email: "test@example.com",
      password: "hashed",
      shareableBagId: `bag-${Date.now()}-${Math.random()}`,
    });

    mockRequireUser.mockResolvedValueOnce({
      user: { id: user._id.toString() },
    });

    const res = await request(app)
      .post("/api/report")
      .send({
        reportedUserId: user._id.toString(),
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("You cannot report yourself");
  });

  test("creates UserReport document", async () => {
    const reporter = await User.create({
      name: "Reporter",
      email: "reporter@example.com",
      password: "hashed",
      shareableBagId: `bag-${Date.now()}-${Math.random()}`,
    });

    const reportedUser = await User.create({
      name: "Reported User",
      email: "reported@example.com",
      password: "hashed",
      shareableBagId: `bag-${Date.now()}-${Math.random()}`,
    });

    mockRequireUser.mockResolvedValueOnce({
      user: { id: reporter._id.toString() },
    });

    const res = await request(app)
      .post("/api/report")
      .send({
        reportedUserId: reportedUser._id.toString(),
        reason: "Inappropriate behavior",
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Verify report was created
    const report = await UserReport.findOne({
      reporter: reporter._id,
      reportedUser: reportedUser._id,
    });

    expect(report).toBeTruthy();
    expect(report?.reporter.toString()).toBe(reporter._id.toString());
    expect(report?.reportedUser.toString()).toBe(reportedUser._id.toString());
    expect(report?.reason).toBe("Inappropriate behavior");
    expect(report?.status).toBe("pending");
  });

  test("increments reported user's moderationFlags", async () => {
    const reporter = await User.create({
      name: "Reporter",
      email: "reporter@example.com",
      password: "hashed",
      shareableBagId: `bag-${Date.now()}-${Math.random()}`,
    });

    const reportedUser = await User.create({
      name: "Reported User",
      email: "reported@example.com",
      password: "hashed",
      moderationFlags: 0,
      shareableBagId: `bag-${Date.now()}-${Math.random()}`,
    });

    mockRequireUser.mockResolvedValueOnce({
      user: { id: reporter._id.toString() },
    });

    const res = await request(app)
      .post("/api/report")
      .send({
        reportedUserId: reportedUser._id.toString(),
        reason: "Test reason",
      });

    expect(res.status).toBe(200);

    // Verify moderationFlags was incremented
    const updatedUser = await User.findById(reportedUser._id);
    expect(updatedUser?.moderationFlags).toBe(1);
  });

  test("updates lastFlaggedAt timestamp", async () => {
    const reporter = await User.create({
      name: "Reporter",
      email: "reporter@example.com",
      password: "hashed",
      shareableBagId: `bag-${Date.now()}-${Math.random()}`,
    });

    const reportedUser = await User.create({
      name: "Reported User",
      email: "reported@example.com",
      password: "hashed",
      shareableBagId: `bag-${Date.now()}-${Math.random()}`,
    });

    mockRequireUser.mockResolvedValueOnce({
      user: { id: reporter._id.toString() },
    });

    const beforeReport = new Date();
    
    const res = await request(app)
      .post("/api/report")
      .send({
        reportedUserId: reportedUser._id.toString(),
        reason: "Test reason",
      });

    expect(res.status).toBe(200);

    // Verify lastFlaggedAt was set
    const updatedUser = await User.findById(reportedUser._id);
    expect(updatedUser?.lastFlaggedAt).toBeDefined();
    expect(updatedUser?.lastFlaggedAt).toBeInstanceOf(Date);
    expect(updatedUser?.lastFlaggedAt!.getTime()).toBeGreaterThanOrEqual(beforeReport.getTime());
  });

  test("handles optional fields (threadId, listingId, requestId, reason)", async () => {
    const reporter = await User.create({
      name: "Reporter",
      email: "reporter@example.com",
      password: "hashed",
      shareableBagId: `bag-${Date.now()}-${Math.random()}`,
    });

    const reportedUser = await User.create({
      name: "Reported User",
      email: "reported@example.com",
      password: "hashed",
      shareableBagId: `bag-${Date.now()}-${Math.random()}`,
    });

    mockRequireUser.mockResolvedValueOnce({
      user: { id: reporter._id.toString() },
    });

    const threadId = "507f1f77bcf86cd799439011";
    const listingId = "507f1f77bcf86cd799439013";
    const requestId = "507f1f77bcf86cd799439014";
    const reason = "Spam message in thread";

    const res = await request(app)
      .post("/api/report")
      .send({
        reportedUserId: reportedUser._id.toString(),
        threadId,
        listingId,
        requestId,
        reason,
      });

    expect(res.status).toBe(200);

    // Verify report was created with all optional fields
    const report = await UserReport.findOne({
      reporter: reporter._id,
      reportedUser: reportedUser._id,
    });

    expect(report).toBeTruthy();
    expect(report?.threadId?.toString()).toBe(threadId);
    expect(report?.listingId?.toString()).toBe(listingId);
    expect(report?.requestId?.toString()).toBe(requestId);
    expect(report?.reason).toBe(reason);
  });

  test("handles optional fields as undefined when not provided", async () => {
    const reporter = await User.create({
      name: "Reporter",
      email: "reporter@example.com",
      password: "hashed",
      shareableBagId: `bag-${Date.now()}-${Math.random()}`,
    });

    const reportedUser = await User.create({
      name: "Reported User",
      email: "reported@example.com",
      password: "hashed",
      shareableBagId: `bag-${Date.now()}-${Math.random()}`,
    });

    mockRequireUser.mockResolvedValueOnce({
      user: { id: reporter._id.toString() },
    });

    const res = await request(app)
      .post("/api/report")
      .send({
        reportedUserId: reportedUser._id.toString(),
        reason: "Test reason",
      });

    expect(res.status).toBe(200);

    // Verify report was created without optional fields
    const report = await UserReport.findOne({
      reporter: reporter._id,
      reportedUser: reportedUser._id,
    });

    expect(report).toBeTruthy();
    expect(report?.threadId).toBeUndefined();
    expect(report?.listingId).toBeUndefined();
    expect(report?.requestId).toBeUndefined();
    expect(report?.reason).toBe("Test reason");
  });

  test("increments moderationFlags multiple times for multiple reports", async () => {
    const reporter1 = await User.create({
      name: "Reporter 1",
      email: "reporter1@example.com",
      password: "hashed",
      shareableBagId: `bag-${Date.now()}-${Math.random()}`,
    });

    const reporter2 = await User.create({
      name: "Reporter 2",
      email: "reporter2@example.com",
      password: "hashed",
      shareableBagId: `bag-${Date.now()}-${Math.random()}`,
    });

    const reportedUser = await User.create({
      name: "Reported User",
      email: "reported@example.com",
      password: "hashed",
      moderationFlags: 0,
      shareableBagId: `bag-${Date.now()}-${Math.random()}`,
    });

    // First report
    mockRequireUser.mockResolvedValueOnce({
      user: { id: reporter1._id.toString() },
    });

    const res1 = await request(app)
      .post("/api/report")
      .send({
        reportedUserId: reportedUser._id.toString(),
        reason: "First report reason",
      });

    expect(res1.status).toBe(200);

    // Second report
    mockRequireUser.mockResolvedValueOnce({
      user: { id: reporter2._id.toString() },
    });

    const res2 = await request(app)
      .post("/api/report")
      .send({
        reportedUserId: reportedUser._id.toString(),
        reason: "Second report reason",
      });

    expect(res2.status).toBe(200);

    // Verify moderationFlags was incremented twice
    const updatedUser = await User.findById(reportedUser._id);
    expect(updatedUser?.moderationFlags).toBe(2);

    // Verify both reports exist
    const reports = await UserReport.find({
      reportedUser: reportedUser._id,
    });
    expect(reports.length).toBe(2);
  });
});

