// app/api/property-requirements/[id]/route.ts
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifySession } from "@/lib/auth/session";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// UUID validator
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function getUserIdFromCookie(req: NextRequest) {
  const cookie = (req.headers.get("cookie") || "")
    .split(";")
    .find((c) => c.trim().startsWith("session="));
  if (!cookie) return null;
  const token = cookie.split("=").slice(1).join("="); // handle '=' in value
  try {
    const session = await verifySession(token);
    return String(session.sub);
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
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        input
      )}&key=${key}`,
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

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> } // params is a Promise in your Next version
) {
  try {
    const userId = await getUserIdFromCookie(req);
    if (!userId) return NextResponse.json({ message: "Not authenticated" }, { status: 401 });

    const { id } = await ctx.params;
    if (!id || !UUID_RE.test(id)) {
      return NextResponse.json({ message: "Invalid requirement id" }, { status: 400 });
    }

    const body = await req.json();

    // Check ownership
    const { data: existing, error: readErr } = await supabase
      .from("requirements")
      .select("requirement_id, id")
      .eq("requirement_id", id)
      .single();
    if (readErr || !existing) {
      return NextResponse.json({ message: "Requirement not found" }, { status: 404 });
    }
    if (existing.id !== userId) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    let lat: number | null | undefined = undefined;
    let lng: number | null | undefined = undefined;
    let formatted: string | null | undefined = undefined;

    if (typeof body.preferredLocation === "string") {
      const preferred = body.preferredLocation.trim();
      const geo = await geocodeAddress(preferred);
      if (geo) {
        lat = geo.lat;
        lng = geo.lng;
        formatted = geo.formatted || preferred;
      } else {
        lat = null;
        lng = null;
        formatted = preferred;
      }
    }

    const patch: any = {
      property_type: body.propertyType,
      transaction_type: body.transactionType,
      preferred_location: formatted ?? body.preferredLocation,
      // Prices are TEXT (as per your schema decision)
      min_price: body.minPrice,
      max_price: body.maxPrice,
      // Sizes remain numeric if columns are numeric
      min_size: body.minSize,
      max_size: body.maxSize,
      size_unit: body.sizeUnit,
      bhk: body.bhk,
      additional_requirement: body.additionalRequirement,
    };
    if (lat !== undefined) patch.latitude = lat;
    if (lng !== undefined) patch.longitude = lng;

    const { data, error } = await supabase
      .from("requirements")
      .update(patch)
      .eq("requirement_id", id)
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
      return NextResponse.json({ message: `Database error: ${error.message}` }, { status: 500 });
    }

    return NextResponse.json(
      {
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
      },
      { status: 200 }
    );
  } catch (e: any) {
    console.error("[PATCH /api/property-requirements/:id] ", e);
    return NextResponse.json({ message: e?.message || "Unexpected error" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> } // ✅ Fix: type matches Next expectation
) {
  try {
    const userId = await getUserIdFromCookie(req);
    if (!userId) return NextResponse.json({ message: "Not authenticated" }, { status: 401 });

    const { id } = await ctx.params;
    if (!id || !UUID_RE.test(id)) {
      return NextResponse.json({ message: "Invalid requirement id" }, { status: 400 });
    }

    // Ownership check
    const { data: existing, error: readErr } = await supabase
      .from("requirements")
      .select("requirement_id, id")
      .eq("requirement_id", id)
      .single();
    if (readErr || !existing) {
      return NextResponse.json({ message: "Requirement not found" }, { status: 404 });
    }
    if (existing.id !== userId) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const { error } = await supabase.from("requirements").delete().eq("requirement_id", id);
    if (error) {
      return NextResponse.json({ message: `Database error: ${error.message}` }, { status: 500 });
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e: any) {
    console.error("[DELETE /api/property-requirements/:id] ", e);
    return NextResponse.json({ message: e?.message || "Unexpected error" }, { status: 500 });
  }
}