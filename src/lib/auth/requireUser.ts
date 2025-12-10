import { authOptions } from "../auth";
import { UnauthorizedError } from "@/lib/errors/UnauthorizedError";
import type { Session } from "next-auth";

/**
 * Ensures the request comes from a logged-in user.
 * Throws UnauthorizedError if not authenticated.
 */
export async function requireUser(): Promise<Session> {
  const nextAuth = await import("next-auth") as unknown as { getServerSession: (options: typeof authOptions) => Promise<Session | null> };
  const { getServerSession } = nextAuth;
  const session = await getServerSession(authOptions);

  if (!session) {
    throw new UnauthorizedError("User must be logged in to access this resource");
  }

  return session;
}
