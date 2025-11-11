// app/api/config/google-maps-key/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) {
    return NextResponse.json({ error: "Google Maps API key not set" }, { status: 500 });
  }
  return NextResponse.json({ key });
}
