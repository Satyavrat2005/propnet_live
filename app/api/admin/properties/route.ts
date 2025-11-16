// app/api/admin/properties/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { validateAdminSession } from "@/lib/server-data";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(req: Request) {
  try {
    // Validate admin session
    await validateAdminSession(req);

    const { data, error } = await supabase
      .from("properties")
      .select(`
        property_id,
        id,
        property_title,
        property_type,
        transaction_type,
        bhk,
        area,
        area_unit,
        sale_price,
        location,
        full_address,
        building_society,
        description,
        property_photos,
        listing_type,
        public_property,
        owner_name,
        owner_phone,
        commission_terms,
        scope_of_work,
        agreement_document,
        approval_status,
        created_at,
        updated_at
      `)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    // return as-is (UI maps these)
    return NextResponse.json(data ?? [], { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ message: e?.message || "Unexpected error" }, { status: 500 });
  }
}
