// app/api/property-requirements/route.ts
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifySession, getUserIdFromSession } from "@/lib/auth/session";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function getUserFromCookie(req: NextRequest) {
  const cookie = req.headers.get("cookie") || "";
  const part = cookie.split(";").find((c) => c.trim().startsWith("session="));
  if (!part) return null;
  try {
    const token = part.split("=")[1];
    const session = await verifySession(token);
    return getUserIdFromSession(session);
  } catch {
    return null;
  }
}

async function geocodeAddress(input: string) {
  if (!input) return null;
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(input)}&key=${key}`,
      { cache: "no-store" }
    );
    const data = await res.json();
    if (data.status !== "OK" || !data.results?.length) return null;
    const best = data.results[0];
    return {
      lat: best.geometry.location.lat as number,
      lng: best.geometry.location.lng as number,
      formatted: best.formatted_address as string,
    };
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("requirements")
      .select(
        `
        requirement_id,
        id,
        property_type,
        transaction_type,
        preferred_location,
        min_price,
        max_price,
        min_size,
        max_size,
        size_unit,
        bhk,
        additional_requirement,
        latitude,
        longitude,
        created_at
      `
      )
      .order("created_at", { ascending: false });

    if (error) return NextResponse.json({ message: error.message }, { status: 500 });

    const mapped = (data || []).map((r) => ({
      requirement_id: r.requirement_id,
      userId: r.id,
      propertyType: r.property_type,
      transactionType: r.transaction_type,
      location: r.preferred_location,
      // keep TEXT
      minPrice: r.min_price,
      maxPrice: r.max_price,
      minSize: r.min_size,
      maxSize: r.max_size,
      sizeUnit: r.size_unit,
      bhk: r.bhk,
      description: r.additional_requirement,
      lat: r.latitude,
      lng: r.longitude,
      createdAt: r.created_at,
    }));

    return NextResponse.json(mapped, { status: 200 });
  } catch (e: any) {
    console.error("[GET /api/property-requirements] ", e);
    return NextResponse.json({ message: e?.message || "Unexpected error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserFromCookie(req);
    if (!userId) return NextResponse.json({ message: "Not authenticated" }, { status: 401 });

    const body = await req.json();
    const preferredLocation = (body.preferredLocation || "").toString().trim();

    let lat: number | null = null;
    let lng: number | null = null;
    let formatted: string | null = preferredLocation || null;

    const geo = await geocodeAddress(preferredLocation);
    if (geo) {
      lat = geo.lat;
      lng = geo.lng;
      formatted = geo.formatted || preferredLocation;
    }

    const payload = {
      id: userId,
      property_type: body.propertyType,
      transaction_type: body.transactionType,
      preferred_location: formatted || preferredLocation,
      // PRICES AS TEXT
      min_price: body.minPrice ?? null,
      max_price: body.maxPrice ?? null,
      // Sizes remain numeric if your DB columns are numeric
      min_size: body.minSize ?? null,
      max_size: body.maxSize ?? null,
      size_unit: body.sizeUnit ?? null,
      bhk: body.bhk ?? null,
      additional_requirement: body.additionalRequirement ?? null,
      latitude: lat,
      longitude: lng,
    };

    const { data, error } = await supabase
      .from("requirements")
      .insert([payload])
      .select(
        `
        requirement_id,
        id,
        property_type,
        transaction_type,
        preferred_location,
        min_price,
        max_price,
        min_size,
        max_size,
        size_unit,
        bhk,
        additional_requirement,
        latitude,
        longitude,
        created_at
      `
      )
      .single();

    if (error) {
      console.error("Supabase insert error:", error);
      return NextResponse.json({ message: `Database error: ${error.message}` }, { status: 500 });
    }

    const mapped = {
      requirement_id: data.requirement_id,
      userId: data.id,
      propertyType: data.property_type,
      transactionType: data.transaction_type,
      location: data.preferred_location,
      minPrice: data.min_price,
      maxPrice: data.max_price,
      minSize: data.min_size,
      maxSize: data.max_size,
      sizeUnit: data.size_unit,
      bhk: data.bhk,
      description: data.additional_requirement,
      lat: data.latitude,
      lng: data.longitude,
      createdAt: data.created_at,
    };

    return NextResponse.json(mapped, { status: 201 });
  } catch (e: any) {
    console.error("[POST /api/property-requirements] ", e);
    return NextResponse.json({ message: e?.message || "Unexpected error" }, { status: 500 });
  }
}
