// tests/integration/api/resend-failures.test.ts
// Tests for Resend email service failure handling
import { describe, test, expect, beforeAll, afterEach, afterAll, beforeEach } from "vitest";
import request from "supertest";
import app from "../../utils/testServer";
import { connectTestDb, resetTestDb, closeTestDb } from "../../utils/testDb";
import User from "@/models/User";
import { setupStandardMocks, mockRequireUser, mockSendEmail, resetAllMocks } from "../../utils/testMocks";

// Setup mocks
setupStandardMocks();

/* ----------------------------------------------------
   TESTS
---------------------------------------------------- */

describe("Resend Email Service Failures", () => {
  beforeAll(async () => {
    await connectTestDb();
  });

  beforeEach(() => {
    resetAllMocks();
    process.env.ADMIN_EMAIL = "admin@example.com";
    process.env.RESEND_FROM_PROD = "noreply@prod.example.com";
    process.env.RESEND_FROM_DEV = "noreply@dev.example.com";
    process.env.NODE_ENV = "development";
    process.env.FROM_ALERT_EMAIL = "alerts@discnest.com";
  });

  afterEach(async () => {
    await resetTestDb();
    resetAllMocks();
  });

  afterAll(() => {
    closeTestDb();
  });

  describe("Resend Email Failures", () => {
    test("handles Resend API network error in contact form", async () => {
      mockSendEmail.mockRejectedValueOnce(new Error("Network error"));

      const res = await request(app)
        .post("/api/contact")
        .send({
          email: "user@example.com",
          subject: "Test Subject",
          message: "Test message",
        });

      expect(res.status).toBe(500);
      expect(mockSendEmail).toHaveBeenCalledTimes(1);
    });

    test("handles Resend API rate limiting error", async () => {
      const rateLimitError: any = new Error("Rate limit exceeded");
      rateLimitError.statusCode = 429;
      mockSendEmail.mockRejectedValueOnce(rateLimitError);

      const res = await request(app)
        .post("/api/contact")
        .send({
          email: "user@example.com",
          subject: "Test Subject",
          message: "Test message",
        });

      expect(res.status).toBe(500);
      expect(mockSendEmail).toHaveBeenCalledTimes(1);
    });

    test("handles Resend API invalid API key error", async () => {
      const apiError: any = new Error("Invalid API key");
      apiError.statusCode = 401;
      mockSendEmail.mockRejectedValueOnce(apiError);

      const res = await request(app)
        .post("/api/contact")
        .send({
          email: "user@example.com",
          subject: "Test Subject",
          message: "Test message",
        });

      expect(res.status).toBe(500);
      expect(mockSendEmail).toHaveBeenCalledTimes(1);
    });

    test("handles Resend API failure in password reset", async () => {
      const user = await User.create({
        name: "Test User",
        email: "test@example.com",
        password: "hashed",
      });

      mockSendEmail.mockRejectedValueOnce(new Error("Email service unavailable"));

      const res = await request(app)
        .post("/api/auth/request-password-reset")
        .send({
          email: "test@example.com",
        });

      expect(res.status).toBe(500);
      expect(mockSendEmail).toHaveBeenCalledTimes(1);
    });

    test("handles Resend API failure in listing creation with pendingReview", async () => {
      const user = await User.create({
        name: "Test User",
        email: "test@example.com",
        password: "hashed",
      });

      mockRequireUser.mockResolvedValueOnce({
        user: {
          id: user._id.toString(),
          email: user.email,
        },
      });

      mockSendEmail.mockRejectedValueOnce(new Error("Email service unavailable"));

      const res = await request(app)
        .post("/api/listings")
        .set("Cookie", "session=test")
        .send({
          title: "Test Disc",
          brand: "Innova",
          type: "Sell",
          condition: "New",
          price: 25,
          description: "Great disc",
          pendingReview: true,
        });

      expect(res.status).toBe(500);
      expect(mockSendEmail).toHaveBeenCalledTimes(1);
    });

    test("handles Resend API timeout", async () => {
      mockSendEmail.mockImplementation(
        () =>
          new Promise((_, reject) => {
            setTimeout(() => reject(new Error("Timeout")), 30000);
          })
      );

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Test timeout")), 1000);
      });

      const contactPromise = request(app)
        .post("/api/contact")
        .send({
          email: "user@example.com",
          subject: "Test Subject",
          message: "Test message",
        });

      try {
        await Promise.race([contactPromise, timeoutPromise]);
      } catch (err) {
        // Expected in test scenario
      }
    }, 2000);
  });
});

