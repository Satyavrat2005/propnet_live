import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSessionUser } from "@/lib/auth/getSessionUser";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session?.sub) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("id, name, phone, agency_name")
      .neq("id", session.sub)
      .order("name", { ascending: true });

    if (error) {
      console.error("[GET /api/network-users]", error);
      return NextResponse.json({ error: "Failed to load users" }, { status: 500 });
    }

    const payload = (data || []).map((user) => ({
      id: user.id,
      name: user.name || "Unknown user",
      phone: user.phone,
      agencyName: user.agency_name,
    }));

    return NextResponse.json(payload, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    console.error("[GET /api/network-users] unexpected", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
