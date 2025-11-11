// app/api/places/autocomplete/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const input = req.nextUrl.searchParams.get("input");
  const types = req.nextUrl.searchParams.get("types") || "establishment";
  const key = process.env.GOOGLE_MAPS_API_KEY;

  if (!key) {
    return NextResponse.json({ error: "Google Maps API key not set" }, { status: 500 });
  }
  if (!input) {
    return NextResponse.json({ error: "Missing input parameter" }, { status: 400 });
  }

  const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&types=${encodeURIComponent(types)}&key=${encodeURIComponent(key)}`;

  try {
    const res = await fetch(url);
    const data = await res.json();
    // Normalize predictions for frontend compatibility
    if (Array.isArray(data.predictions)) {
      data.predictions = data.predictions.map((p: any) => ({
        ...p,
        structured_formatting: {
          main_text: p.structured_formatting?.main_text || p.description?.split(",")[0] || p.description || "",
          secondary_text: p.structured_formatting?.secondary_text || p.description?.replace(p.description?.split(",")[0] + ", ", "") || "",
        },
      }));
    }
    console.log("Google Places Autocomplete response (normalized):", data);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch autocomplete results" }, { status: 500 });
  }
}
