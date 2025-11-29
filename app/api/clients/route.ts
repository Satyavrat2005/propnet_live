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
    // Support both old format (id) and new format (sub)
    const userId = (payload as any).sub || (payload as any).id;

    // fetch properties only for the logged-in user
    const { data: props, error } = await supabase
      .from("properties")
      .select("property_id, owner_name, owner_phone, created_at")
      .eq("id", userId)
      .order("created_at", { ascending: false })
      .limit(500);

    if (error) throw error;

    // Fetch clients from client table for this broker
    const { data: clientsFromTable, error: clientError } = await supabase
      .from("client")
      .select("client_id, client_name, client_phone, client_type, created_at")
      .eq("broker_id", userId)
      .order("created_at", { ascending: false });

    if (clientError) console.error("Error fetching clients:", clientError);

    // dedupe by owner_phone + owner_name to count unique clients and property count
    const map = new Map<string, any>();
    (props || []).forEach((p: any) => {
      const key = `${(p.owner_phone || "").trim()}||${(p.owner_name || "").trim()}`;
      if (!map.has(key)) {
        map.set(key, { owner_name: p.owner_name || "Unknown", owner_phone: p.owner_phone || "", count: 1, first_seen: p.created_at, source: "properties" });
      } else {
        const existing = map.get(key);
        existing.count = (existing.count || 0) + 1;
      }
    });

    // Add clients from client table
    for (const c of clientsFromTable || []) {
      const key = `${(c.client_phone || "").trim()}||${(c.client_name || "").trim()}`;
      // For tenants/buyers, count client rows with property_id for this name/phone
      let propertyCount = 0;
      if (c.client_type === "Tenant" || c.client_type === "Buyer") {
        const { data: clientProps, error: clientPropsError } = await supabase
          .from("client")
          .select("property_id")
          .eq("client_name", c.client_name)
          .eq("client_phone", c.client_phone)
          .not("property_id", "is", null);
        if (!clientPropsError && Array.isArray(clientProps)) {
          propertyCount = clientProps.length;
        }
      }
      if (!map.has(key)) {
        map.set(key, { 
          owner_name: c.client_name || "Unknown", 
          owner_phone: c.client_phone || "", 
          count: propertyCount || 0, 
          first_seen: c.created_at,
          source: "client_table",
          client_type: c.client_type,
          client_id: c.client_id
        });
      } else {
        // Client exists in both sources, keep the existing one
        const existing = map.get(key);
        existing.client_type = c.client_type;
        existing.client_id = c.client_id;
        // If client_type is Tenant/Buyer, update count
        if (c.client_type === "Tenant" || c.client_type === "Buyer") {
          existing.count = propertyCount || 0;
        }
      }
    }

    const clients = Array.from(map.entries()).map(([k, v], idx) => ({ key: `client-${idx}`, ...v }));

    return NextResponse.json(clients);
  } catch (err: any) {
    console.error("GET /api/clients error:", err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    // Get logged-in user ID
    const token = readSessionCookie(req);
    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const payload = await verifySession(token);
    const userId = (payload as any).sub || (payload as any).id;

    const body = await req.json();
    const { client_name, client_phone, client_type } = body;

    if (!client_name || !client_phone || !client_type) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Insert client without property_id
    const { data: client, error: clientError } = await supabase
      .from("client")
      .insert({
        client_name,
        client_phone,
        client_type,
        broker_id: userId
      })
      .select()
      .single();

    if (clientError) throw clientError;

    return NextResponse.json({ success: true, client });
  } catch (err: any) {
    console.error("POST /api/clients error:", err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}

// PATCH endpoint to associate property with client
export async function PATCH(req: NextRequest) {
  try {
    const token = readSessionCookie(req);
    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const payload = await verifySession(token);
    const userId = (payload as any).sub || (payload as any).id;
    const body = await req.json();
    const { client_id, property_id } = body;
    if (!client_id || !property_id) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    // Update client row with property_id
    const { error: clientError } = await supabase
      .from("client")
      .update({ property_id })
      .eq("client_id", client_id);
    if (clientError) throw clientError;
    // Update property: set public_property to false and listing_type to "Deal Done"
    const { error: propertyError } = await supabase
      .from("properties")
      .update({
        public_property: false,
        listing_type: "Deal Done"
      })
      .eq("property_id", property_id);
    if (propertyError) throw propertyError;
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("PATCH /api/clients error:", err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}
