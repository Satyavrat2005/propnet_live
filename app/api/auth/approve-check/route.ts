// app/api/auth/approve-check/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * Server route: POST /api/auth/approve-check
 *
 * Body: { phone: string, name: string, rera_id: string }
 * Response: { approved: boolean }
 *
 * Requirements:
 *  - Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your environment
 *  - This route MUST run server-side (it does as app/api/... route)
 *
 * Security:
 *  - This route performs a DB update using the service role key.
 *  - In production, validate the requester (cookie/session/CSRF) before performing updates.
 */

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  // If env missing, throw early so deploy-time problems are obvious
  throw new Error(
    "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables."
  );
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    // server-side client; no browser auth required
  },
});

/**
 * Helper for consistent JSON responses
 */
function json(data: any, status = 200) {
  return NextResponse.json(data, { status });
}

export async function POST(req: NextRequest) {
  try {
    // parse body
    const body = await req.json().catch(() => null);
    if (!body) {
      return json({ error: "Invalid JSON body" }, 400);
    }

    const phoneRaw = body.phone ?? body.mobile ?? "";
    const nameRaw = body.name ?? "";
    const reraIdRaw = body.rera_id ?? body.reraId ?? body.rera ?? "";

    const phone = String(phoneRaw).trim();
    const name = String(nameRaw).trim();
    const rera_id = String(reraIdRaw).trim();

    if (!phone) {
      return json({ error: "phone is required" }, 400);
    }
    if (!name) {
      return json({ error: "name is required" }, 400);
    }
    if (!rera_id) {
      return json({ error: "rera_id is required" }, 400);
    }

    // -------------------------
    // Optional: server-side auth check
    // -------------------------
    // If you have a session cookie / CSRF token / internal auth mechanism,
    // validate it here. Example:
    //   const sessionOk = await validateSessionCookie(req);
    //   if (!sessionOk) return json({ error: "Not authenticated" }, 401);
    //
    // For now we proceed using the provided phone.

    // 1) Try to find a matching verified_user_check row (case-insensitive exact match)
    // Using ilike without wildcards acts like case-insensitive equality in Postgres
    const { data: verifiedRow, error: verifyErr } = await supabase
      .from("verified_user_check")
      .select("id")
      .ilike("name", name)
      .ilike("rera_id", rera_id)
      .maybeSingle();

    if (verifyErr) {
      console.error("verify query error:", verifyErr);
      return json({ error: "Database error while verifying user" }, 500);
    }

    if (!verifiedRow) {
      // no exact match
      return json({ approved: false }, 200);
    }

    // 2) Match found -> update profiles.status to 'approved' for the matching phone
    const { data: updated, error: updateErr } = await supabase
      .from("profiles")
      .update({ status: "approved", updated_at: new Date().toISOString() })
      .eq("phone", phone)
      .select("id, phone, name, rera_id, status")
      .maybeSingle();

    if (updateErr) {
      console.error("profiles update error:", updateErr);
      return json(
        { error: "Database error while updating profile status" },
        500
      );
    }

    if (!updated) {
      // No profile row to update: return approved:false so client goes to pending
      return json(
        { approved: false, message: "No profile found for provided phone" },
        200
      );
    }

    // Success
    return json({ approved: true, profile: updated }, 200);
  } catch (err) {
    console.error("approve-check route error:", err);
    return json({ error: "Internal server error" }, 500);
  }
}
