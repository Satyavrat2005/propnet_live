import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
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

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ consentId: string }> }
) {
  try {
    const { consentId } = await params;
    if (!consentId) {
      return NextResponse.json({ message: "Consent token missing" }, { status: 400 });
    }

    const { data, error } = await adminSupabase
      .from("properties")
      .select(
        `
        property_id,
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
        commission_terms,
        scope_of_work,
        approval_status,
        owner_name,
        owner_phone,
        profiles:profiles!properties_id_fkey (
          id,
          name,
          phone,
          agency_name,
          experience,
          rera_id,
          profile_photo_url
        )
      `
      )
      .eq("owner_consent_token", consentId)
      .maybeSingle();

    if (error) {
      console.error("[GET /api/consent] Supabase error:", error);
      return NextResponse.json({ message: "Failed to load consent" }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ message: "Consent link invalid" }, { status: 404 });
    }

  const scopeOfWork = parseScopeOfWork(data.scope_of_work);
  const agentProfile = Array.isArray(data.profiles) ? data.profiles[0] : data.profiles;

    const payload = {
      id: data.property_id,
      status: (data.approval_status || "pending") as "pending" | "approved" | "rejected",
      property: {
        id: data.property_id,
        title: data.property_title,
        propertyType: data.property_type,
        transactionType: data.transaction_type,
        price: data.sale_price,
        size: data.area,
        sizeUnit: data.area_unit,
        bhk: data.bhk,
        location: data.location,
        fullAddress: data.full_address,
        description: data.description,
        listingType: data.listing_type,
        commissionTerms: data.commission_terms,
        scopeOfWork,
      },
      agent: {
        id: agentProfile?.id ?? null,
        name: agentProfile?.name ?? null,
        agencyName: agentProfile?.agency_name ?? null,
        phone: agentProfile?.phone ?? null,
        experience: agentProfile?.experience ?? null,
        reraId: agentProfile?.rera_id ?? null,
        profilePhoto: agentProfile?.profile_photo_url ?? null,
      },
    };

    return NextResponse.json(payload, { status: 200 });
  } catch (err: any) {
    console.error("[GET /api/consent/:id] Unexpected error:", err);
    return NextResponse.json({ message: err?.message || "Unexpected error" }, { status: 500 });
  }
}
