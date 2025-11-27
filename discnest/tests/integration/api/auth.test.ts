import { describe, test, expect, beforeAll, afterEach, afterAll, vi } from "vitest";
import request from "supertest";
import app from "../../utils/testServer";
import { connectTestDb, resetTestDb, closeTestDb } from "../../utils/testDb";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import crypto from "crypto";

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

// Mock Resend
const mockSendEmail = vi.fn().mockResolvedValue({ id: "email-123" });
vi.mock("@/lib/resend", () => ({
  resend: {
    emails: {
      send: mockSendEmail,
    },
  },
}));

describe("POST /api/auth/signup", () => {
  beforeAll(connectTestDb);
  afterEach(async () => {
    await resetTestDb();
    mockSendEmail.mockClear();
  });
  afterAll(closeTestDb);

  test("creates new user", async () => {
    const res = await request(app)
      .post("/api/auth/signup")
      .send({
        name: "Test User",
        email: "test@example.com",
        password: "password123",
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.name).toBe("Test User");
    expect(res.body.user.email).toBe("test@example.com");
    expect(res.body.user.password).toBeDefined(); // Should be hashed
    expect(res.body.user.hasOnboarded).toBe(false);
  });

  test("hashes password", async () => {
    const res = await request(app)
      .post("/api/auth/signup")
      .send({
        name: "Test User",
        email: "test@example.com",
        password: "password123",
      });

    expect(res.status).toBe(200);
    const user = await User.findOne({ email: "test@example.com" });
    expect(user).toBeTruthy();
    expect(user?.password).toBeDefined();
    expect(user?.password).not.toBe("password123");
    
    // Verify password can be compared using bcrypt
    const isValid = await bcrypt.compare("password123", user!.password!);
    expect(isValid).toBe(true);
  });

  test("returns 400 if email already exists (password user)", async () => {
    // Create existing user with password
    await User.create({
      name: "Existing User",
      email: "existing@example.com",
      password: "hashedpassword",
    });

    const res = await request(app)
      .post("/api/auth/signup")
      .send({
        name: "New User",
        email: "existing@example.com",
        password: "newpassword",
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe(
      "An account with this email already exists. Please log in."
    );
  });

  test("handles OAuth conflict (user exists with no password)", async () => {
    // Create OAuth user (no password)
    await User.create({
      name: "OAuth User",
      email: "oauth@example.com",
      // password is undefined/null for OAuth users
    });

    const res = await request(app)
      .post("/api/auth/signup")
      .send({
        name: "New User",
        email: "oauth@example.com",
        password: "newpassword",
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe(
      "This email is already registered using Google. Please sign in with Google instead."
    );
  });

  test("sets hasOnboarded to false", async () => {
    const res = await request(app)
      .post("/api/auth/signup")
      .send({
        name: "Test User",
        email: "test2@example.com",
        password: "password123",
      });

    expect(res.status).toBe(200);
    expect(res.body.user.hasOnboarded).toBe(false);
    
    const user = await User.findOne({ email: "test2@example.com" });
    expect(user?.hasOnboarded).toBe(false);
  });

  test("handles missing required fields", async () => {
    const res = await request(app)
      .post("/api/auth/signup")
      .send({
        name: "Test User",
        // Missing email and password
      });

    // The route doesn't validate, but MongoDB will fail
    // This tests that the route handles errors gracefully
    expect(res.status).toBeGreaterThanOrEqual(400);
  });
});

describe("POST /api/auth/request-password-reset", () => {
  beforeAll(connectTestDb);
  afterEach(async () => {
    await resetTestDb();
    mockSendEmail.mockClear();
    vi.clearAllMocks();
  });
  afterAll(closeTestDb);

  test("requires email", async () => {
    const res = await request(app)
      .post("/api/auth/request-password-reset")
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Email is required");
  });

  test("returns 200 even if email doesn't exist (security)", async () => {
    const res = await request(app)
      .post("/api/auth/request-password-reset")
      .send({ email: "nonexistent@example.com" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  test("validates email exists", async () => {
    const user = await User.create({
      name: "Test User",
      email: "test@example.com",
      password: "hashedpassword",
    });

    const res = await request(app)
      .post("/api/auth/request-password-reset")
      .send({ email: "test@example.com" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    
    // Verify reset token was generated
    const updatedUser = await User.findById(user._id);
    expect(updatedUser?.passwordResetToken).toBeDefined();
    expect(updatedUser?.passwordResetExpires).toBeDefined();
    expect(updatedUser?.passwordResetExpires!.getTime()).toBeGreaterThan(
      Date.now()
    );
  });

  test("generates reset token", async () => {
    const user = await User.create({
      name: "Test User",
      email: "test@example.com",
      password: "hashedpassword",
    });

    await request(app)
      .post("/api/auth/request-password-reset")
      .send({ email: "test@example.com" });

    const updatedUser = await User.findById(user._id);
    expect(updatedUser?.passwordResetToken).toBeDefined();
    // Token should be hashed (SHA-256 produces 64 hex characters)
    expect(updatedUser?.passwordResetToken).toMatch(/^[a-f0-9]{64}$/); // SHA-256 hash (64 hex chars)
  });

  test("sets token expiry to 1 hour", async () => {
    const user = await User.create({
      name: "Test User",
      email: "test@example.com",
      password: "hashedpassword",
    });

    const beforeRequest = Date.now();
    await request(app)
      .post("/api/auth/request-password-reset")
      .send({ email: "test@example.com" });
    const afterRequest = Date.now();

    const updatedUser = await User.findById(user._id);
    const expiryTime = updatedUser?.passwordResetExpires!.getTime();
    const expectedExpiryMin = beforeRequest + 60 * 60 * 1000; // 1 hour
    const expectedExpiryMax = afterRequest + 60 * 60 * 1000 + 1000; // Add 1s buffer

    expect(expiryTime).toBeGreaterThanOrEqual(expectedExpiryMin);
    expect(expiryTime).toBeLessThanOrEqual(expectedExpiryMax);
  });

  test("sends reset email", async () => {
    const user = await User.create({
      name: "Test User",
      email: "test@example.com",
      password: "hashedpassword",
    });

    await request(app)
      .post("/api/auth/request-password-reset")
      .send({ email: "test@example.com" });

    expect(mockSendEmail).toHaveBeenCalledTimes(1);
    const emailCall = mockSendEmail.mock.calls[0][0];
    expect(emailCall.to).toBe("test@example.com");
    expect(emailCall.from).toBe("DiscNest <no-reply@discnest.com>");
    expect(emailCall.subject).toBe("Reset your DiscNest password");
    expect(emailCall.html).toContain("reset your password");
    expect(emailCall.html).toContain("expires in 1 hour");
  });

  test("reset URL contains token", async () => {
    const user = await User.create({
      name: "Test User",
      email: "test@example.com",
      password: "hashedpassword",
    });

    // We need to intercept the token generation
    // Since the token is random, we'll check the email contains a reset URL pattern
    await request(app)
      .post("/api/auth/request-password-reset")
      .send({ email: "test@example.com" });

    expect(mockSendEmail).toHaveBeenCalledTimes(1);
    const emailCall = mockSendEmail.mock.calls[0][0];
    expect(emailCall.html).toMatch(/\/reset-password\/[a-f0-9]{64}/);
  });
});

describe("POST /api/auth/reset-password", () => {
  beforeAll(connectTestDb);
  afterEach(async () => {
    await resetTestDb();
    vi.clearAllMocks();
  });
  afterAll(closeTestDb);

  test("requires token and password", async () => {
    const res1 = await request(app)
      .post("/api/auth/reset-password")
      .send({ token: "some-token" }); // Missing password

    expect(res1.status).toBe(400);
    expect(res1.body.error).toBe("Token and password are required");

    const res2 = await request(app)
      .post("/api/auth/reset-password")
      .send({ password: "newpassword" }); // Missing token

    expect(res2.status).toBe(400);
    expect(res2.body.error).toBe("Token and password are required");
  });

  test("validates reset token and updates password", async () => {
    // Create user with reset token
    const plainToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto
      .createHash("sha256")
      .update(plainToken)
      .digest("hex");
    
    const user = await User.create({
      name: "Test User",
      email: "test@example.com",
      password: "oldpasswordhash",
      passwordResetToken: tokenHash,
      passwordResetExpires: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
    });

    const res = await request(app)
      .post("/api/auth/reset-password")
      .send({
        token: plainToken,
        password: "newpassword123",
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Verify password was updated
    const updatedUser = await User.findById(user._id);
    expect(updatedUser?.password).toBeDefined();
    
    // Verify old password doesn't work
    const oldPasswordValid = await bcrypt.compare(
      "oldpasswordhash",
      updatedUser!.password!
    );
    expect(oldPasswordValid).toBe(false);

    // Verify new password works
    const newPasswordValid = await bcrypt.compare(
      "newpassword123",
      updatedUser!.password!
    );
    expect(newPasswordValid).toBe(true);
  });

  test("invalidates token after use", async () => {
    const plainToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto
      .createHash("sha256")
      .update(plainToken)
      .digest("hex");
    
    const user = await User.create({
      name: "Test User",
      email: "test@example.com",
      password: "oldpasswordhash",
      passwordResetToken: tokenHash,
      passwordResetExpires: new Date(Date.now() + 60 * 60 * 1000),
    });

    await request(app)
      .post("/api/auth/reset-password")
      .send({
        token: plainToken,
        password: "newpassword123",
      });

    // Verify token was cleared
    const updatedUser = await User.findById(user._id);
    expect(updatedUser?.passwordResetToken).toBeNull();
    expect(updatedUser?.passwordResetExpires).toBeNull();
  });

  test("returns error for invalid token", async () => {
    const res = await request(app)
      .post("/api/auth/reset-password")
      .send({
        token: "invalid-token",
        password: "newpassword123",
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Reset link is invalid or expired");
  });

  test("returns error for expired token", async () => {
    const plainToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto
      .createHash("sha256")
      .update(plainToken)
      .digest("hex");
    
    // Create user with expired token
    await User.create({
      name: "Test User",
      email: "test@example.com",
      password: "oldpasswordhash",
      passwordResetToken: tokenHash,
      passwordResetExpires: new Date(Date.now() - 1000), // Expired 1 second ago
    });

    const res = await request(app)
      .post("/api/auth/reset-password")
      .send({
        token: plainToken,
        password: "newpassword123",
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Reset link is invalid or expired");
  });

  test("returns error for non-existent token", async () => {
    // Create user without reset token
    await User.create({
      name: "Test User",
      email: "test@example.com",
      password: "oldpasswordhash",
    });

    const plainToken = crypto.randomBytes(32).toString("hex");

    const res = await request(app)
      .post("/api/auth/reset-password")
      .send({
        token: plainToken,
        password: "newpassword123",
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Reset link is invalid or expired");
  });

  test("hashes new password", async () => {
    const plainToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto
      .createHash("sha256")
      .update(plainToken)
      .digest("hex");
    
    const user = await User.create({
      name: "Test User",
      email: "test@example.com",
      password: "oldpasswordhash",
      passwordResetToken: tokenHash,
      passwordResetExpires: new Date(Date.now() + 60 * 60 * 1000),
    });

    await request(app)
      .post("/api/auth/reset-password")
      .send({
        token: plainToken,
        password: "newpassword123",
      });

    const updatedUser = await User.findById(user._id);
    // Password should be hashed, not plaintext
    expect(updatedUser?.password).toBeDefined();
    expect(updatedUser?.password).not.toBe("newpassword123");
    
    // But it should verify correctly
    const isValid = await bcrypt.compare(
      "newpassword123",
      updatedUser!.password!
    );
    expect(isValid).toBe(true);
  });
});

