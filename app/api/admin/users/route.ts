// app/api/admin/users/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { validateAdminSession } from "@/lib/server-data";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(req: Request) {
  try {
    // Validate admin session
    await validateAdminSession(req);

    const { data, error } = await supabase
      .from("profiles")
      .select(
        `
        id,
        phone,
        name,
        email,
        bio,
        agency_name,
        rera_id,
        city,
        experience,
        website,
        area_of_expertise,
        working_regions,
        profile_photo_url,
        profile_complete,
        status,
        created_at,
        updated_at
      `
      )
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    return NextResponse.json(data ?? [], { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ message: e?.message || "Unexpected error" }, { status: 500 });
  }
}
