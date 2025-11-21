// app/api/my-requirements/route.ts
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

export async function GET(req: NextRequest) {
  try {
    const userId = await getUserFromCookie(req);
    if (!userId) return NextResponse.json([], { status: 200 });

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
      .eq("id", userId)
      .order("created_at", { ascending: false });

    if (error) return NextResponse.json({ message: error.message }, { status: 500 });

    const mapped = (data || []).map((r) => ({
      requirement_id: r.requirement_id,
      userId: r.id,
      propertyType: r.property_type,
      transactionType: r.transaction_type,
      location: r.preferred_location,
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
    console.error("[GET /api/my-requirements] ", e);
    return NextResponse.json({ message: e?.message || "Unexpected error" }, { status: 500 });
  }
}
