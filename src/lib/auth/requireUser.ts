import { getServerSession } from "next-auth";
import { authOptions } from "../auth";
import { UnauthorizedError } from "@/lib/errors/UnauthorizedError";
import type { Session } from "next-auth";

/**
 * Ensures the request comes from a logged-in user.
 * Throws UnauthorizedError if not authenticated.
 */
export async function requireUser(): Promise<Session> {
  const session = await getServerSession(authOptions);

  if (!session) {
    throw new UnauthorizedError("User must be logged in to access this resource");
  }

  return session;
}
