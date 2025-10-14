import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");

  if (!lat || !lng) {
    return NextResponse.json({ error: "Missing lat or lng" }, { status: 400 });
  }

  try {
    const apiKey = process.env.OPENCAGE_API_KEY;
    const res = await fetch(
      `https://api.opencagedata.com/geocode/v1/json?q=${lat}+${lng}&key=${apiKey}`
    );
    const data = await res.json();
    const components = data.results?.[0]?.components || {};

    const city = components.city || components.town || components.village || "";
    const state = components.state || "";

    return NextResponse.json({ city, state });
  } catch (err: any) {
    console.error("Reverse geocode failed:", err);
    return NextResponse.json({ error: "Reverse geocode failed" }, { status: 500 });
  }
}
