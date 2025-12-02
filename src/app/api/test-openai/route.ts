import { NextResponse } from "next/server";
import OpenAI from "openai";

export async function GET() {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const mod = await openai.moderations.create({
    model: "omni-moderation-latest",
    input: "This is a test message",
  });

  return NextResponse.json(mod);
}
