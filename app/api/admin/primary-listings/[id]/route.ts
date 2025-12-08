// app/api/admin/primary-listings/[id]/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { validateAdminSession } from "@/lib/server-data";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * PATCH /api/admin/primary-listings/[id]
 * Update a primary listing
 */
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await validateAdminSession(req);

    const id = params.id;
    const body = await req.json();

    const { data, error } = await supabase
      .from("primarly_listing")
      .update(body)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("[ADMIN_PRIMARY_LISTINGS] Update error:", error);
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err: any) {
    console.error("[ADMIN_PRIMARY_LISTINGS] Unexpected error:", err);
    return NextResponse.json({ message: err?.message || "Internal server error" }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/primary-listings/[id]
 * Delete a primary listing
 */
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await validateAdminSession(req);

    const id = params.id;

    const { error } = await supabase
      .from("primarly_listing")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("[ADMIN_PRIMARY_LISTINGS] Delete error:", error);
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: "Primary listing deleted successfully" });
  } catch (err: any) {
    console.error("[ADMIN_PRIMARY_LISTINGS] Unexpected error:", err);
    return NextResponse.json({ message: err?.message || "Internal server error" }, { status: 500 });
  }
}
