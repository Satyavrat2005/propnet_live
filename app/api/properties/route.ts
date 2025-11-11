// app/api/properties/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function parseScopeOfWork(value: any): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  try {
    const parsed = JSON.parse(String(value));
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch {
    if (typeof value === "string") {
      return value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    }
    return [];
  }
}

function toOwnerObject(row: any) {
  return {
    name: row.owner_name ?? null,
    phone: row.owner_phone ?? null,
    email: null,
  };
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const includePending = searchParams.get("includePending") === "true";

    let query = supabase
      .from("properties")
      .select(
        `
        property_id,
        id,
        property_title,
        property_type,
        transaction_type,
        sale_price,
        area,
        area_unit,
        bhk,
        location,
        full_address,
        description,
        listing_type,
        property_photos,
        commission_terms,
        scope_of_work,
        approval_status,
        public_property,
        latitude,
        longitude,
        owner_name,
        owner_phone,
        created_at,
        updated_at
      `
      )
      .order("created_at", { ascending: false });

    if (!includePending) {
      query = query.eq("approval_status", "approved");
    }

    const { data, error } = await query;

    if (error) {
      console.error("[GET /api/properties] Supabase error:", error);
      return NextResponse.json({ message: "Failed to load properties" }, { status: 500 });
    }

    const mapped = (data || []).map((row) => ({
      id: row.property_id,
      ownerId: row.id,
      title: row.property_title,
      propertyType: row.property_type,
      transactionType: row.transaction_type,
      price: row.sale_price,
      size: row.area,
      sizeUnit: row.area_unit,
      bhk: row.bhk,
      location: row.location,
      fullAddress: row.full_address,
      description: row.description,
      listingType: row.listing_type,
      photos: Array.isArray(row.property_photos) ? row.property_photos : [],
      commissionTerms: row.commission_terms,
      scopeOfWork: parseScopeOfWork(row.scope_of_work),
      owner: toOwnerObject(row),
      ownerApprovalStatus: row.approval_status,
      isPubliclyVisible: row.public_property,
      lat: row.latitude,
      lng: row.longitude,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    return NextResponse.json(mapped, { status: 200 });
  } catch (err: any) {
    console.error("[GET /api/properties] Unexpected error:", err);
    return NextResponse.json({ message: err?.message || "Unexpected error" }, { status: 500 });
  }
}

export async function POST() {
  return NextResponse.json(
    { message: "Property creation moved to /api/my-properties" },
    { status: 405 }
  );
}
