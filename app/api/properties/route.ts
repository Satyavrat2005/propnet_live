// app/api/properties/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type PropertyRow = {
  property_id: string;
  id: string | null;
  property_title: string | null;
  property_type: string | null;
  transaction_type: string | null;
  sale_price: string | null;
  area: number | string | null;
  area_unit: string | null;
  bhk: number | null;
  location: string | null;
  full_address: string | null;
  flat_number : string | null;
  floor : string | null;
  building_society : string | null;
  description: string | null;
  listing_type: string | null;
  property_photos: string[] | null;
  commission_terms: string | null;
  scope_of_work: unknown;
  approval_status: string | null;
  public_property: boolean | null;
  latitude: number | null;
  longitude: number | null;
  owner_name: string | null;
  owner_phone: string | null;
  created_at: string | null;
  updated_at: string | null;
};

function parseScopeOfWork(value: unknown): string[] {
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

function toOwnerObject(row: PropertyRow) {
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
      .select<PropertyRow>(
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
        flat_number,
        floor,
        building_society,
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
      .order("created_at", { ascending: false })
      .range(0, 4999);

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
      flatNumber: row.flat_number,
      floor: row.floor,
      buildingSociety: row.building_society,
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
  } catch (err) {
    console.error("[GET /api/properties] Unexpected error:", err);
    const message = err instanceof Error ? err.message : "Unexpected error";
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function POST() {
  return NextResponse.json(
    { message: "Property creation moved to /api/my-properties" },
    { status: 405 }
  );
}
