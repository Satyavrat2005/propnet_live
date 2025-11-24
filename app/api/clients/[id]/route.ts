import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// read env variables (you already have these in .env.local)
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export async function GET(req: Request, { params }: { params: any }) {
  try {
    // Next.js may provide params as a Promise (error seen). Ensure it's resolved.
    const resolvedParams = await params;
    const rawId = resolvedParams?.id;
    if (!rawId) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    // id may be encoded (e.g. 9820904940%7C%7CDhruv), decode first
    const decoded = decodeURIComponent(rawId.toString());
    // support "phone||name" or just "phone"
    let phone = decoded;
    let name: string | null = null;
    if (decoded.includes("||")) {
      const parts = decoded.split("||");
      phone = parts[0];
      name = parts[1] || null;
    }

    // query properties where owner_phone matches phone
    const { data: properties, error: propErr } = await supabase
      .from("properties")
      .select("*")
      .eq("owner_phone", phone)
      .order("created_at", { ascending: false });

    if (propErr) {
      return NextResponse.json({ error: "Database error", details: propErr.message }, { status: 500 });
    }

    // Also fetch properties from client table where client_phone matches
    const { data: clientRecords, error: clientErr } = await supabase
      .from("client")
      .select(`
        client_id,
        client_name,
        client_phone,
        client_type,
        property_id,
        created_at,
        properties:property_id (*)
      `)
      .eq("client_phone", phone);

    if (clientErr) {
      console.error("Error fetching client records:", clientErr);
    }

    // Combine properties from both sources
    const propertiesFromClients = (clientRecords || [])
      .filter((c: any) => c.properties)
      .map((c: any) => c.properties);

    const allProperties = [...(properties || []), ...propertiesFromClients];

    // Basic owner info: if name provided use it, otherwise try to read from first property.owner_name
    const ownerName = name || (allProperties && allProperties[0]?.owner_name) || null;

    const result = {
      owner_phone: phone,
      owner_name: ownerName,
      properties: allProperties,
      count: allProperties.length,
    };

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: "Server error", details: err.message }, { status: 500 });
  }
}
