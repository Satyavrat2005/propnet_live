// app/api/clients/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifySession } from "@/lib/auth/session";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

function readSessionCookie(req: NextRequest) {
  const cookie = req.headers.get("cookie") || "";
  const part = cookie.split(";").find((c) => c.trim().startsWith("session="));
  if (!part) return null;
  const token = part.split("=")[1];
  return token || null;
}

export async function GET(req: NextRequest) {
  try {
    // Get logged-in user ID
    const token = readSessionCookie(req);
    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const payload = await verifySession(token);
    const userId = payload.sub;

    // fetch properties only for the logged-in user
    const { data: props, error } = await supabase
      .from("properties")
      .select("property_id, owner_name, owner_phone, created_at")
      .eq("id", userId)
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
