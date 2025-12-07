import { NextResponse } from "next/server";
import { spawn } from "child_process";
import { withAdminAuth } from "@/lib/auth/withAdminAuth";
import { withErrorHandling } from "@/lib/withErrorHandling";

const seedHandler = async () => {
  // Spawn the seed script
  const seed = spawn(
    "npx",
    ["ts-node", "-P", "tsconfig.seed.json", "scripts/seed/seedDiscs.ts"],
    { stdio: "inherit" } // pipe stdout/stderr to console
  );

  // Log process exit
  seed.on("close", (code) => {
    // Seed script completed
  });

  // Log spawn errors (optional safety)
  seed.on("error", (err) => {
    console.error("❌ Failed to start seed script:", err);
  });

  return NextResponse.json({ message: "Seeding started" });
};

export const POST = withErrorHandling(
  withAdminAuth(seedHandler),
  "/api/seed"
);
