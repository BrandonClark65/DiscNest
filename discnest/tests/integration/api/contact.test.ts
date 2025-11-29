// tests/integration/api/contact.test.ts
import { describe, test, expect, beforeAll, afterEach, afterAll, vi, beforeEach } from "vitest";
import request from "supertest";
import app from "../../utils/testServer";

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
   MOCK RESEND
---------------------------------------------------- */
const mockSendEmail = vi.fn().mockResolvedValue({ id: "email-123" });
vi.mock("resend", () => ({
  Resend: class {
    emails = {
      send: mockSendEmail,
    };
  },
}));

/* ----------------------------------------------------
   TESTS
---------------------------------------------------- */

describe("POST /api/contact", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset environment variables
    process.env = {
      ...originalEnv,
      ADMIN_EMAIL: "admin@example.com",
      RESEND_FROM_PROD: "noreply@prod.example.com",
      RESEND_FROM_DEV: "noreply@dev.example.com",
      NODE_ENV: "development",
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  test("validates required fields (email, subject, message)", async () => {
    const res = await request(app)
      .post("/api/contact")
      .send({
        email: "user@example.com",
        subject: "Test Subject",
        message: "Test message",
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test("returns 400 for missing email", async () => {
    const res = await request(app)
      .post("/api/contact")
      .send({
        subject: "Test Subject",
        message: "Test message",
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Missing required fields");
  });

  test("returns 400 for missing subject", async () => {
    const res = await request(app)
      .post("/api/contact")
      .send({
        email: "user@example.com",
        message: "Test message",
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Missing required fields");
  });

  test("returns 400 for missing message", async () => {
    const res = await request(app)
      .post("/api/contact")
      .send({
        email: "user@example.com",
        subject: "Test Subject",
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Missing required fields");
  });

  test("returns 400 for empty email string", async () => {
    const res = await request(app)
      .post("/api/contact")
      .send({
        email: "",
        subject: "Test Subject",
        message: "Test message",
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Missing required fields");
  });

  test("returns 400 for empty subject string", async () => {
    const res = await request(app)
      .post("/api/contact")
      .send({
        email: "user@example.com",
        subject: "",
        message: "Test message",
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Missing required fields");
  });

  test("returns 400 for empty message string", async () => {
    const res = await request(app)
      .post("/api/contact")
      .send({
        email: "user@example.com",
        subject: "Test Subject",
        message: "",
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Missing required fields");
  });

  test("returns 500 if ADMIN_EMAIL not configured", async () => {
    delete process.env.ADMIN_EMAIL;

    const res = await request(app)
      .post("/api/contact")
      .send({
        email: "user@example.com",
        subject: "Test Subject",
        message: "Test message",
      });

    expect(res.status).toBe(500);
    expect(res.body.error).toBe("ADMIN_EMAIL not configured");
  });

  test("sends email via Resend", async () => {
    const email = "user@example.com";
    const subject = "Test Subject";
    const message = "Test message content";

    const res = await request(app)
      .post("/api/contact")
      .send({
        email,
        subject,
        message,
      });

    expect(res.status).toBe(200);
    expect(mockSendEmail).toHaveBeenCalledTimes(1);
    expect(mockSendEmail).toHaveBeenCalledWith({
      from: process.env.RESEND_FROM_DEV,
      to: process.env.ADMIN_EMAIL,
      subject: `Contact Form: ${subject}`,
      replyTo: email,
      text: expect.stringContaining(email),
    });
  });

  test("uses correct from email in production", async () => {
    process.env.NODE_ENV = "production";

    const res = await request(app)
      .post("/api/contact")
      .send({
        email: "user@example.com",
        subject: "Test Subject",
        message: "Test message",
      });

    expect(res.status).toBe(200);
    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        from: process.env.RESEND_FROM_PROD,
      })
    );
  });

  test("uses correct from email in development", async () => {
    process.env.NODE_ENV = "development";

    const res = await request(app)
      .post("/api/contact")
      .send({
        email: "user@example.com",
        subject: "Test Subject",
        message: "Test message",
      });

    expect(res.status).toBe(200);
    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        from: process.env.RESEND_FROM_DEV,
      })
    );
  });

  test("sets replyTo to user's email", async () => {
    const email = "user@example.com";

    const res = await request(app)
      .post("/api/contact")
      .send({
        email,
        subject: "Test Subject",
        message: "Test message",
      });

    expect(res.status).toBe(200);
    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        replyTo: email,
      })
    );
  });

  test("includes user email, subject, and message in email text", async () => {
    const email = "user@example.com";
    const subject = "Test Subject";
    const message = "Test message content";

    const res = await request(app)
      .post("/api/contact")
      .send({
        email,
        subject,
        message,
      });

    expect(res.status).toBe(200);
    const callArgs = mockSendEmail.mock.calls[0][0];
    expect(callArgs.text).toContain(email);
    expect(callArgs.text).toContain(subject);
    expect(callArgs.text).toContain(message);
  });

  test("handles Resend API failures", async () => {
    const error = new Error("Resend API error");
    mockSendEmail.mockRejectedValueOnce(error);

    const res = await request(app)
      .post("/api/contact")
      .send({
        email: "user@example.com",
        subject: "Test Subject",
        message: "Test message",
      });

    // The error should be caught by withErrorHandling, but since we're mocking it
    // to passthrough, the error will propagate. Let's check what actually happens.
    // Since withErrorHandling is mocked to passthrough, the error will be thrown
    // and Next.js will handle it, likely returning a 500.
    expect(res.status).toBe(500);
  });

  test("formats email subject with 'Contact Form:' prefix", async () => {
    const subject = "Test Subject";

    const res = await request(app)
      .post("/api/contact")
      .send({
        email: "user@example.com",
        subject,
        message: "Test message",
      });

    expect(res.status).toBe(200);
    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: `Contact Form: ${subject}`,
      })
    );
  });
});

