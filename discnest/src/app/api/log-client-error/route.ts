import { NextResponse } from "next/server";
import { logError } from "@/lib/errorLogger";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const { message, stack, route, metadata, severity } = await req.json();

    await logError({
      error: { message, stack },
      route: route || "client",
      severity: severity || "medium",
      userId: session?.user?.id,
      metadata: { source: "client", ...metadata },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Failed to log client error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
