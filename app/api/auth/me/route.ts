import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifySession, readSessionCookie } from "@/lib/auth/session";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(req: NextRequest) {
  try {
    const token = await readSessionCookie();
    
    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const payload = await verifySession(token);
    
    // Support both old format (id) and new format (sub)
    const userId = (payload as any).sub || (payload as any).id;

    if (!userId) {
      return NextResponse.json({ error: "Invalid session format" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    return NextResponse.json({ user: data }, { status: 200 });
  } catch (err) {
    console.error("Auth me error:", err);
    return NextResponse.json({ error: "Invalid session" }, { status: 401 });
  }
}
