// app/api/clients/deals/route.ts
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
    const userId = (payload as any).sub || (payload as any).id;

    // Fetch clients for this broker with their associated properties
    const { data: clients, error: clientError } = await supabase
      .from("client")
      .select(`
        client_id,
        client_name,
        client_phone,
        client_type,
        property_id,
        created_at,
        properties:property_id (
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
        )
      `)
      .eq("broker_id", userId);

    if (clientError) throw clientError;

    // Extract properties from the client records
    const properties = (clients || [])
      .filter((c: any) => c.properties)
      .map((c: any) => ({
        ...c.properties,
        client_info: {
          client_id: c.client_id,
          client_name: c.client_name,
          client_phone: c.client_phone,
          client_type: c.client_type
        }
      }));

    return NextResponse.json(properties);
  } catch (err: any) {
    console.error("GET /api/clients/deals error:", err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}
