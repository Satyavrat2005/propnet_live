import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { signSession, getSessionCookieHeader } from "@/lib/auth/session";

// ---------- Supabase (server) ----------
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ---------- Helpers ----------
function normalizePhoneToE164(raw: string) {
  const s = (raw || "").trim();
  if (!s) return s;
  if (s.startsWith("+")) return s; // already E.164
  const digits = s.replace(/[^\d]/g, "");
  // Default to +91 if no country code provided
  return `+91${digits}`;
}

async function verifyWithTwilio(phone: string, code: string) {
  const sid = process.env.TWILIO_ACCOUNT_SID!;
  const token = process.env.TWILIO_AUTH_TOKEN!;
  const service = process.env.TWILIO_VERIFY_SERVICE_SID!;
  const basic = Buffer.from(`${sid}:${token}`).toString("base64");

  const resp = await fetch(
    `https://verify.twilio.com/v2/Services/${service}/VerificationCheck`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${basic}`,
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      },
      body: new URLSearchParams({ To: phone, Code: code }),
      cache: "no-store",
    }
  );

  if (!resp.ok) {
    throw new Error(`Twilio Verify failed with status ${resp.status}`);
  }

  const json = await resp.json();
  return json.status === "approved";
}

/**
 * Read POST body as JSON, urlencoded, or multipart/form-data.
 * Accepts common field aliases:
 *  - otp OR code
 *  - phone
 */
async function readPayload(req: NextRequest) {
  const ct = req.headers.get("content-type") || "";

  const getFromFormData = async () => {
    const fd = await req.formData();
    const rawPhone = fd.get("phone")?.toString() ?? "";
    const rawOtp = (fd.get("otp") ?? fd.get("code"))?.toString() ?? "";
    return { phone: rawPhone, otp: rawOtp };
  };

  if (ct.includes("application/json")) {
    try {
      const j = await req.json();
      return {
        phone: (j?.phone ?? "").toString(),
        otp: (j?.otp ?? j?.code ?? "").toString(),
      };
    } catch {
      // fall through to try form parsing
    }
  }

  if (ct.includes("application/x-www-form-urlencoded") || ct.includes("multipart/form-data")) {
    return await getFromFormData();
  }

  // Fallback: try JSON, then form
  try {
    const j = await req.json();
    return {
      phone: (j?.phone ?? "").toString(),
      otp: (j?.otp ?? j?.code ?? "").toString(),
    };
  } catch {
    return await getFromFormData();
  }
}

// ---------- Route: POST /api/verify-route ----------
export async function POST(req: NextRequest) {
  try {
    const { phone, otp } = await readPayload(req);

    if (!phone || !otp) {
      return NextResponse.json(
        { error: "phone and otp are required" },
        { status: 400 }
      );
    }

    const e164Phone = normalizePhoneToE164(phone);

    // 1) Verify OTP via Twilio Verify
    const ok = await verifyWithTwilio(e164Phone, String(otp));
    if (!ok) {
      return NextResponse.json({ error: "Invalid OTP" }, { status: 401 });
    }

    // 2) Check if user exists in profiles table by phone
    const { data: existing, error: selErr } = await supabase
      .from("profiles")
      .select("*")
      .eq("phone", e164Phone)
      .maybeSingle();

    if (selErr) {
      return NextResponse.json({ error: selErr.message }, { status: 500 });
    }

    let profile = existing;
    let redirectTo = "/dashboard"; // default

    if (!profile) {
      // User doesn't exist - create new profile
      const { data: created, error: insErr } = await supabase
        .from("profiles")
        .insert([{ phone: e164Phone, profile_complete: false, status: "pending" }])
        .select("*")
        .single();

      if (insErr) {
        return NextResponse.json({ error: insErr.message }, { status: 500 });
      }
      profile = created;
      redirectTo = "/auth/complete-profile"; // New user needs to complete profile
    } else {
      // User exists - determine redirect based on profile status
      const isProfileComplete = profile.profile_complete === true;
      const status = profile.status || "pending";

      if (!isProfileComplete) {
        // Profile not complete
        redirectTo = "/auth/complete-profile";
      } else if (isProfileComplete && status === "approved") {
        // Profile complete and approved
        redirectTo = "/dashboard";
      } else if (isProfileComplete && status === "pending") {
        // Profile complete but pending approval
        redirectTo = "/auth/approval-pending";
      } else {
        // Fallback for other statuses (rejected, etc.)
        redirectTo = "/auth/approval-pending";
      }
    }

    // 3) Create signed session token & set secure, httpOnly cookie
    const token = await signSession({ sub: profile.id, phone: profile.phone });

    const res = NextResponse.json({
      user: profile,
      redirectTo: redirectTo,
      requiresProfileComplete: profile.profile_complete !== true, // backward compatibility
    });

    res.headers.set("Set-Cookie", getSessionCookieHeader(token));
    return res;
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Verification failed" },
      { status: 500 }
    );
  }
}
