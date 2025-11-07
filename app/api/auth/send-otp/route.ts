// app/api/auth/send-otp/route.ts
import { NextResponse } from "next/server";
import Twilio from "twilio";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

if (!accountSid || !authToken || !verifyServiceSid) {
  console.warn("Missing Twilio env vars in send-otp route");
}

const client = accountSid && authToken ? Twilio(accountSid, authToken) : null;

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const phoneRaw = String(payload?.phone || "");
    const phone = phoneRaw.replace(/\D/g, "");

    if (!phone || phone.length < 7) {
      return NextResponse.json({ error: "Invalid phone number" }, { status: 400 });
    }

    if (!client || !verifyServiceSid) {
      return NextResponse.json({ error: "Server misconfiguration: missing Twilio credentials or Verify SID" }, { status: 500 });
    }

    const to = `+91${phone}`;

    try {
      // use v2.services to avoid deprecation warning
      const verification = await client.verify.v2.services(verifyServiceSid).verifications.create({
        to,
        channel: "sms",
      });
      return NextResponse.json({ success: true, status: verification.status, message: "Verification code sent" });
    } catch (twErr: any) {
      console.error("Twilio Verify error (send):", twErr);
      const msg = twErr?.message || String(twErr);
      const code = twErr?.code;
      // return the Twilio message & code to client (useful while debugging)
      return NextResponse.json({ error: msg, code }, { status: 400 });
    }
  } catch (err: any) {
    console.error("send-otp route unexpected error:", err);
    return NextResponse.json({ error: err?.message || "Failed to process request" }, { status: 500 });
  }
}
