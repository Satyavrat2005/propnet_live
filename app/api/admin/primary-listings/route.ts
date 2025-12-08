// app/api/admin/primary-listings/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { validateAdminSession } from "@/lib/server-data";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/admin/primary-listings
 * Fetch all primary listings
 */
export async function GET(req: Request) {
  try {
    await validateAdminSession(req);

    const { data, error } = await supabase
      .from("primarly_listing")
      .select("*")
      .order("id", { ascending: false });

    if (error) {
      console.error("[ADMIN_PRIMARY_LISTINGS] Error:", error);
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (err: any) {
    console.error("[ADMIN_PRIMARY_LISTINGS] Unexpected error:", err);
    return NextResponse.json({ message: err?.message || "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/admin/primary-listings
 * Create a new primary listing
 */
export async function POST(req: Request) {
  try {
    await validateAdminSession(req);

    const body = await req.json();
    
    const { data, error } = await supabase
      .from("primarly_listing")
      .insert([body])
      .select()
      .single();

    if (error) {
      console.error("[ADMIN_PRIMARY_LISTINGS] Insert error:", error);
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err: any) {
    console.error("[ADMIN_PRIMARY_LISTINGS] Unexpected error:", err);
    return NextResponse.json({ message: err?.message || "Internal server error" }, { status: 500 });
  }
}
