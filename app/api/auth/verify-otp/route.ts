// app/api/auth/verify-otp/route.ts
import { NextResponse } from "next/server";
import Twilio from "twilio";
import { createClient } from "@supabase/supabase-js";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!accountSid || !authToken || !verifyServiceSid) {
  console.warn("Missing Twilio env vars in verify-otp route");
}

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.warn("Missing Supabase env vars in verify-otp route");
}

const twilioClient = accountSid && authToken ? Twilio(accountSid, authToken) : null;
const supabase = supabaseUrl && supabaseServiceRoleKey ? createClient(supabaseUrl, supabaseServiceRoleKey) : null;

function cookieString(name: string, value: string, days = 30) {
  const maxAge = days * 24 * 60 * 60;
  // Note: Secure is omitted so it works in local http. In production you may want Secure; add it conditionally.
  return `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}`;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const phoneRaw = String(body.phone || "");
    const phone = phoneRaw.replace(/\D/g, "");
    const code = String(body.code || "");
    const purpose = body.purpose || "login";

    if (!phone || phone.length < 7 || !code) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    if (!twilioClient || !verifyServiceSid) {
      return NextResponse.json({ error: "Server misconfiguration: missing Twilio credentials or Verify SID" }, { status: 500 });
    }

    const to = `+91${phone}`;

    try {
      const check = await twilioClient.verify.v2.services(verifyServiceSid).verificationChecks.create({
        to,
        code,
      });

      if (check.status !== "approved") {
        return NextResponse.json({ error: "Invalid verification code" }, { status: 400 });
      }
    } catch (twErr: any) {
      console.error("Twilio Verify error (check):", twErr);
      const msg = twErr?.message || String(twErr);
      return NextResponse.json({ error: "Twilio verification failed: " + msg }, { status: 400 });
    }

    // Verified. Create or update user profile in Supabase. Determine profile_complete
    let requiresProfileComplete = true;
    let userProfile: any = null;

    if (supabase) {
      try {
        // normalize phone for storage
        const normalizedPhone = phone;

        // try fetch existing profile
        const { data: existing, error: selectErr } = await supabase
          .from("profiles")
          .select("*")
          .eq("phone", normalizedPhone)
          .limit(1);

        if (selectErr) {
          console.error("Supabase select error in verify-otp:", selectErr);
        }

        if (existing && existing.length > 0) {
          userProfile = existing[0];
        } else {
          // no profile exists — create one with profile_complete = false
          const { data: inserted, error: insertErr } = await supabase
            .from("profiles")
            .insert([{ phone: normalizedPhone, profile_complete: false }])
            .select()
            .limit(1);

          if (insertErr) {
            console.error("Supabase insert error in verify-otp:", insertErr);
          } else if (inserted && inserted.length > 0) {
            userProfile = inserted[0];
          }
        }

        if (userProfile && userProfile.profile_complete === true) {
          requiresProfileComplete = false;
        } else {
          requiresProfileComplete = true;
        }
      } catch (supErr: any) {
        console.error("Supabase error in verify-otp:", supErr);
        // don't block success; still return verified = true but default to requiring profile completion
        requiresProfileComplete = true;
      }
    }

    // Set cookie propnet_phone so client can fetch /api/auth/me
    const cookie = cookieString("propnet_phone", phone, 60); // 60 days

    const resp = NextResponse.json({
      success: true,
      message: "Phone verified",
      requiresProfileComplete,
      user: userProfile ?? null,
    });

    resp.headers.set("Set-Cookie", cookie);

    return resp;
  } catch (err: any) {
    console.error("verify-otp route unexpected error:", err);
    return NextResponse.json({ error: err?.message || "Verification failed" }, { status: 500 });
  }
}
