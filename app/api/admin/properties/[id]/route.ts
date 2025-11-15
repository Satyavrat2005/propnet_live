// app/api/admin/properties/[id]/route.ts
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { validateAdminSession } from "@/lib/server-data";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Simple UUID v4-ish check (accepts any valid 36-char UUID form)
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function PATCH(
  req: NextRequest,
  // IMPORTANT: in your Next version, params is a Promise—await it.
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    // ---- Auth (admin session cookie) ----
    validateAdminSession(req);

    // ---- Params (await the Promise) ----
    const { id } = await ctx.params;
    if (!id || !UUID_RE.test(id)) {
      return NextResponse.json({ message: "Invalid property id" }, { status: 400 });
    }

    // ---- Body ----
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      // no body
    }
    const status = String(body?.status || "").toLowerCase();
    if (!["approved", "rejected"].includes(status)) {
      return NextResponse.json({ message: "Invalid status" }, { status: 400 });
    }

    // ---- Update ----
    const { data, error } = await supabase
      .from("properties")
      .update({ approval_status: status, updated_at: new Date().toISOString() })
      .eq("property_id", id)
      .select(
        `
        property_id,
        property_title,
        approval_status,
        updated_at
      `
      )
      .single();

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ message: e?.message || "Unexpected error" }, { status: 500 });
  }
}
