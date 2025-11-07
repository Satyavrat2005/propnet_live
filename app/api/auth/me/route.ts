// app/api/auth/me/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.warn("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env");
}

const supabase = createClient(supabaseUrl ?? "", supabaseServiceRoleKey ?? "");

/**
 * GET /api/auth/me
 * - tries to read phone from cookie 'propnet_phone'
 * - if present, returns profile where phone matches
 * - if no cookie, returns the most recently created profile as a fallback (helps after OTP flow)
 * Response: { user: { ...profile } } or { user: null }
 */
export async function GET(req: Request) {
  try {
    // read cookie
    const cookieHeader = req.headers.get("cookie") || "";
    // parse cookie manually (simple)
    const cookies = Object.fromEntries(
      cookieHeader
        .split(";")
        .map((c) => c.trim())
        .filter(Boolean)
        .map((c) => {
          const [k, ...v] = c.split("=");
          return [k, decodeURIComponent(v.join("="))];
        })
    );

    const phoneFromCookie = cookies["propnet_phone"] ?? null;

    if (phoneFromCookie) {
      // try to find profile by phone
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("phone", phoneFromCookie)
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("supabase error in /api/auth/me (by phone):", error);
        return NextResponse.json({ user: null });
      }

      if (data) {
        return NextResponse.json({ user: data });
      }
    }

    // fallback: return most recent profile
    const { data: recent, error: recentErr } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (recentErr) {
      console.error("supabase error in /api/auth/me (recent):", recentErr);
      return NextResponse.json({ user: null });
    }

    if (recent) {
      return NextResponse.json({ user: recent });
    }

    return NextResponse.json({ user: null });
  } catch (err: any) {
    console.error("Unexpected error in /api/auth/me:", err);
    return NextResponse.json({ user: null });
  }
}
