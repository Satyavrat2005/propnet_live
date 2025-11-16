// app/api/admin/users/[id]/route.ts
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { validateAdminSession } from "@/lib/server-data";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// UUID validator
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> } // Next 14+ passes params as a Promise in route handlers
) {
  try {
    // Auth
    await validateAdminSession(req);

    // Params
    const { id } = await ctx.params;
    if (!id || !UUID_RE.test(id)) {
      return NextResponse.json({ message: "Invalid user id" }, { status: 400 });
    }

    // Body
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      /* ignore empty body */
    }
    const status = String(body?.status || "").toLowerCase();
    if (!["approved", "rejected"].includes(status)) {
      return NextResponse.json({ message: "Invalid status" }, { status: 400 });
    }

    // Update
    const { data, error } = await supabase
      .from("profiles")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select(
        `
        id,
        name,
        phone,
        email,
        status,
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
