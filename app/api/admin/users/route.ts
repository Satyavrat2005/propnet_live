// app/api/admin/users/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifySession } from "@/lib/auth/session";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(req: Request) {
  try {
    // Require a valid admin session cookie
    const cookie = (req.headers.get("cookie") || "")
      .split(";")
      .find((c) => c.trim().startsWith("session="));
    if (!cookie) return NextResponse.json({ message: "Not authenticated" }, { status: 401 });

    const token = cookie.split("=").slice(1).join("="); // handle '=' inside value
    await verifySession(token); // throws if invalid

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
