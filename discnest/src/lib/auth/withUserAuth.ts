import { NextResponse } from "next/server";
import { requireUser } from "./requireUser";

/**
 * Wraps any API route handler to enforce user authentication.
 * Passes (req, session, context) into the wrapped handler.
 */
export function withUserAuth<T extends { params?: any } = {}>(
  handler: (
    req: Request,
    session: Awaited<ReturnType<typeof requireUser>>,
    context?: T
  ) => Promise<NextResponse>
): (req: Request, context?: T) => Promise<NextResponse> {
  return async (req: Request, context?: T) => {
    try {
      const session = await requireUser();
      return await handler(req, session, context);
    } catch (err: any) {
      console.error("[withUserAuth]", err);
      const status = err.name === "UnauthorizedError" ? 401 : 500;
      return NextResponse.json({ error: err.message }, { status });
    }
  };
}
