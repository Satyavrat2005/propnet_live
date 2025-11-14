// app/api/deals/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const owner_phone = url.searchParams.get("owner_phone");

    let query = supabase
      .from("properties")
      .select("property_id, property_title, transaction_type, sale_price, location, approval_status, created_at, owner_name, owner_phone")
      .order("created_at", { ascending: false })
      .limit(500);

    if (owner_phone) {
      query = query.ilike("owner_phone", `%${owner_phone}%`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json(data || []);
  } catch (err: any) {
    console.error("GET /api/deals error:", err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}
