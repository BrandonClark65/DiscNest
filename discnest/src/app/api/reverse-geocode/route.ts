import { NextResponse } from "next/server";
import { withErrorHandling } from "@/lib/withErrorHandling";

const reverseGeocodeHandler = async (req: Request) => {
  const { searchParams } = new URL(req.url);
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");

  if (!lat || !lng) {
    return NextResponse.json({ error: "Missing lat or lng" }, { status: 400 });
  }

  const apiKey = process.env.OPENCAGE_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENCAGE_API_KEY not configured" },
      { status: 500 }
    );
  }

  const res = await fetch(
    `https://api.opencagedata.com/geocode/v1/json?q=${lat}+${lng}&key=${apiKey}`
  );
  const data = await res.json();

  const components = data.results?.[0]?.components || {};
  const city = components.city || components.town || components.village || "";
  const state = components.state || "";

  return NextResponse.json({ city, state });
};

export const GET = withErrorHandling(reverseGeocodeHandler, "/api/reverse-geocode");
