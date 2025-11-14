import { NextRequest, NextResponse } from "next/server";

const cache = new Map<string, { lat: number; lng: number; formatted: string; timestamp: number }>();
const CACHE_TTL_MS = 1000 * 60 * 60 * 12; // 12 hours

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const address = searchParams.get("address")?.trim();

    if (!address) {
      return NextResponse.json({ success: false, message: "address query parameter is required" }, { status: 400 });
    }

    const cacheKey = address.toLowerCase();
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return NextResponse.json(
        {
          success: true,
          latitude: cached.lat,
          longitude: cached.lng,
          formattedAddress: cached.formatted,
          cached: true,
        },
        { status: 200 }
      );
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, message: "GOOGLE_MAPS_API_KEY is not configured" },
        { status: 500 }
      );
    }

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`,
      { cache: "no-store" }
    );
    const data = await response.json();

    if (data?.status !== "OK" || !data?.results?.length) {
      return NextResponse.json(
        {
          success: false,
          message: data?.status || "Geocoding failed",
          details: data?.error_message,
        },
        { status: 404 }
      );
    }

    const bestMatch = data.results[0];
    const coords = bestMatch.geometry?.location;
    if (!coords || typeof coords.lat !== "number" || typeof coords.lng !== "number") {
      return NextResponse.json(
        { success: false, message: "Invalid geocode response" },
        { status: 502 }
      );
    }

    cache.set(cacheKey, {
      lat: coords.lat,
      lng: coords.lng,
      formatted: bestMatch.formatted_address,
      timestamp: Date.now(),
    });

    return NextResponse.json(
      {
        success: true,
        latitude: coords.lat,
        longitude: coords.lng,
        formattedAddress: bestMatch.formatted_address,
        cached: false,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[GET /api/places/geocode]", error);
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}