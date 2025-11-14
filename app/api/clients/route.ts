// app/api/clients/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

export async function GET() {
  try {
    // fetch recent properties with owner info
    const { data: props, error } = await supabase
      .from("properties")
      .select("property_id, owner_name, owner_phone, created_at")
      .order("created_at", { ascending: false })
      .limit(500);

    if (error) throw error;

    // dedupe by owner_phone + owner_name to count unique clients and property count
    const map = new Map<string, any>();
    (props || []).forEach((p: any) => {
      const key = `${(p.owner_phone || "").trim()}||${(p.owner_name || "").trim()}`;
      if (!map.has(key)) {
        map.set(key, { owner_name: p.owner_name || "Unknown", owner_phone: p.owner_phone || "", count: 1, first_seen: p.created_at });
      } else {
        const existing = map.get(key);
        existing.count = (existing.count || 0) + 1;
      }
    });

    const clients = Array.from(map.entries()).map(([k, v], idx) => ({ key: `client-${idx}`, ...v }));

    return NextResponse.json(clients);
  } catch (err: any) {
    console.error("GET /api/clients error:", err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}
