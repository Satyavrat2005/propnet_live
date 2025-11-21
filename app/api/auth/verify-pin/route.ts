import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import { signSession } from "@/lib/auth/session";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, pin } = body;

    if (!phone || !pin) {
      return NextResponse.json(
        { error: "Phone and PIN are required" },
        { status: 400 }
      );
    }

    // Normalize phone to E.164 format
    const normalizedPhone = phone.startsWith("+91") ? phone : `+91${phone}`;

    // Get profile with this phone
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("phone", normalizedPhone)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "Invalid phone number or PIN" },
        { status: 401 }
      );
    }

    // Verify PIN
    if (!profile.password) {
      return NextResponse.json(
        { error: "PIN not set. Please complete signup." },
        { status: 400 }
      );
    }

    const isPinValid = await bcrypt.compare(pin, profile.password);

    if (!isPinValid) {
      return NextResponse.json(
        { error: "Invalid PIN" },
        { status: 401 }
      );
    }

    // Create session with correct payload format (sub and phone)
    const sessionData = {
      sub: profile.id,
      phone: profile.phone,
    };

    const sessionCookie = await signSession(sessionData);

    // Determine redirect based on profile status
    let redirectTo = "/dashboard";

    const profileComplete = profile.profile_complete === true;
    const status = profile.status || "pending";

    if (profileComplete && status === "approved") {
      redirectTo = "/dashboard";
    } else if (profileComplete && status === "pending") {
      redirectTo = "/auth/approval-pending";
    } else if (!profileComplete && status === "approved") {
      redirectTo = "/auth/complete-profile";
    } else if (!profileComplete && status === "pending") {
      redirectTo = "/auth/complete-profile";
    }

    const response = NextResponse.json({
      success: true,
      message: "Login successful",
      redirectTo,
    });

    response.cookies.set("session", sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Verify PIN error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
