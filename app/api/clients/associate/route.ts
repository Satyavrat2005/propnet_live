// app/api/clients/associate/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.warn("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env for /api/clients/associate");
}

const supabase = createClient(SUPABASE_URL || "", SUPABASE_SERVICE_ROLE_KEY || "", {
  auth: { persistSession: false },
});

export async function PATCH(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { client_identifier, property_id } = body || {};

    if (!client_identifier || !property_id) {
      return NextResponse.json({ error: "client_identifier and property_id are required" }, { status: 400 });
    }

    // Resolve client by id or composite
    let clientRow: any = null;

    // If looks like uuid, try client_id direct match
    const maybeId = client_identifier?.toString?.();
    const isUuid = typeof maybeId === "string" && /^[0-9a-fA-F-]{36}$/.test(maybeId);

    if (isUuid) {
      const { data, error } = await supabase.from("client").select("*").eq("client_id", maybeId).limit(1).maybeSingle();
      if (error) throw error;
      clientRow = data;
    }

    // fallback to composite phone||name or phone
    if (!clientRow) {
      // try exact phone
      const { data: allClients } = await supabase.from("client").select("*");
      clientRow = (allClients || []).find((c: any) => {
        const composite = `${c.client_phone ?? c.owner_phone ?? ""}||${c.client_name ?? c.owner_name ?? ""}`;
        if (composite === client_identifier) return true;
        if ((c.client_phone ?? c.owner_phone ?? "") === client_identifier) return true;
        if ((c.client_id ?? "") === client_identifier) return true;
        return false;
      });
    }

    if (!clientRow) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Update client record: set property_id
    const { data: updatedClient, error: updateClientErr } = await supabase
      .from("client")
      .update({ property_id })
      .eq("client_id", clientRow.client_id)
      .select()
      .single();

    if (updateClientErr) throw updateClientErr;

    // Update property: mark listing_type = 'Deal Done' and public_property = false
    const { data: updatedProperty, error: updatePropertyErr } = await supabase
      .from("properties")
      .update({ listing_type: "Deal Done", public_property: false })
      .eq("property_id", property_id)
      .select()
      .single();

    // It's not fatal if property update returns no rows, but return info
    if (updatePropertyErr && updatePropertyErr.code !== "PGRST116") {
      // PGRST116 sometimes occurs for zero rows matched — ignore if you want strict check.
      console.warn("property update error", updatePropertyErr);
      // continue; // you can choose to throw or continue
    }

    return NextResponse.json({
      message: "Property associated with client",
      client: updatedClient || clientRow,
      property: updatedProperty || null,
    }, { status: 200 });
  } catch (err: any) {
    console.error("Associate route error:", err);
    return NextResponse.json({ error: err?.message || "Internal error" }, { status: 500 });
  }
}
