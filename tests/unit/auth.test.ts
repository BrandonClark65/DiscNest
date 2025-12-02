import { describe, test, expect, beforeAll, beforeEach, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  connectToDatabase: vi.fn(),
  bcryptCompare: vi.fn(),
  userModel: {
    findOne: vi.fn(),
    create: vi.fn(),
  },
}));

vi.mock("@/lib/mongodb", () => ({
  connectToDatabase: mocks.connectToDatabase,
}));

vi.mock("@/models/User", () => ({
  default: mocks.userModel,
}));

vi.mock("bcryptjs", () => ({
  default: {
    compare: mocks.bcryptCompare,
  },
}));

const { connectToDatabase, bcryptCompare, userModel } = mocks;

let authOptions: typeof import("@/lib/auth").authOptions;

const loadAuthOptions = async () => {
  vi.stubEnv("GOOGLE_CLIENT_ID", "test-client");
  vi.stubEnv("GOOGLE_CLIENT_SECRET", "test-secret");
  vi.stubEnv("NEXTAUTH_SECRET", "test-secret");
  ({ authOptions } = await import("@/lib/auth"));
};

const getCredentialsAuthorize = () => {
  const provider = authOptions.providers.find(
    (p: any) => p.id === "credentials"
  ) as { options?: { authorize?: (credentials: any) => Promise<any> } };
  const authorize = provider?.options?.authorize;
  if (!authorize) throw new Error("Credentials authorize missing");
  return authorize;
};

beforeAll(async () => {
  await loadAuthOptions();
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe("authOptions credentials authorize", () => {
  test("returns sanitized user when email/password are valid", async () => {
    const userDoc = {
      _id: { toString: () => "abc123" },
      email: "valid@example.com",
      name: "Valid User",
      role: "user",
      password: "hashed",
      lastLogin: null,
      save: vi.fn().mockResolvedValue(undefined),
    };

    userModel.findOne.mockResolvedValueOnce(userDoc);
    bcryptCompare.mockResolvedValueOnce(true);

    const authorize = getCredentialsAuthorize();

    const result = await authorize({
      email: "valid@example.com",
      password: "secret",
    });

    expect(connectToDatabase).toHaveBeenCalled();
    expect(bcryptCompare).toHaveBeenCalledWith("secret", "hashed");
    expect(userDoc.save).toHaveBeenCalled();
    expect(result).toEqual({
      id: "abc123",
      email: "valid@example.com",
      name: "Valid User",
      role: "user",
    });
  });

  test("throws when user is banned", async () => {
    const bannedUser = {
      role: "banned",
    };
    userModel.findOne.mockResolvedValueOnce(bannedUser);

    const authorize = getCredentialsAuthorize();

    await expect(
      authorize({
        email: "banned@example.com",
        password: "secret",
      })
    ).rejects.toThrow("Your account has been banned.");

    expect(bcryptCompare).not.toHaveBeenCalled();
  });
});

describe("authOptions callbacks", () => {
  test("signIn blocks banned users", async () => {
    userModel.findOne.mockResolvedValueOnce({ role: "banned" });

    const allowed = await authOptions.callbacks?.signIn?.({
      user: { email: "banned@example.com" },
      account: { provider: "credentials" },
    } as any);

    expect(connectToDatabase).toHaveBeenCalled();
    expect(allowed).toBe(false);
  });

  test("signIn creates Google user when missing", async () => {
    userModel.findOne.mockResolvedValueOnce(null);
    userModel.create.mockResolvedValueOnce({});

    const allowed = await authOptions.callbacks?.signIn?.({
      user: { email: "new@google.com", name: "New User", image: "img.png" },
      account: { provider: "google", providerAccountId: "google-123" },
    } as any);

    expect(userModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "new@google.com",
        provider: "google",
        providerId: "google-123",
      })
    );
    expect(allowed).toBe(true);
  });

  test("jwt stores user details on token", async () => {
    const token = await authOptions.callbacks?.jwt?.({
      token: {},
      user: { id: "user123", email: "jwt@example.com", role: "admin" },
    } as any);

    expect(token).toMatchObject({
      sub: "user123",
      email: "jwt@example.com",
      role: "admin",
    });
  });

  test("session hydrates session.user from token", async () => {
    const session = await authOptions.callbacks?.session?.({
      session: { user: {} },
      token: { sub: "user123", email: "sess@example.com", role: "moderator" },
    } as any);

    expect(session?.user).toEqual({
      id: "user123",
      email: "sess@example.com",
      role: "moderator",
    });
  });
});

