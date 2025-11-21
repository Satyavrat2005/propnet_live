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
    const { phone, pin, keepLoggedIn } = body;

    if (!phone || !pin) {
      return NextResponse.json(
        { error: "Phone and PIN are required" },
        { status: 400 }
      );
    }

    // Normalize phone to E.164 format
    const normalizedPhone = phone.startsWith("+91") ? phone : `+91${phone}`;

    // Check if profile exists with this phone
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("phone", normalizedPhone)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 }
      );
    }

    // Check if PIN already exists
    if (profile.password) {
      return NextResponse.json(
        { error: "PIN already exists. Please use login." },
        { status: 400 }
      );
    }

    // Hash the PIN
    const hashedPin = await bcrypt.hash(pin, 12);

    // Update profile with hashed PIN
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ 
        password: hashedPin,
        updated_at: new Date().toISOString()
      })
      .eq("id", profile.id);

    if (updateError) {
      console.error("Error updating PIN:", updateError);
      return NextResponse.json(
        { error: "Failed to setup PIN" },
        { status: 500 }
      );
    }

    // Create session with correct payload format (sub and phone)
    const sessionData = {
      sub: profile.id,
      phone: profile.phone,
    };

    const sessionCookie = await signSession(sessionData);

    const response = NextResponse.json({
      success: true,
      message: "PIN created successfully",
    });

    response.cookies.set("session", sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: keepLoggedIn ? 30 * 24 * 60 * 60 : 24 * 60 * 60, // 30 days or 1 day
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Setup PIN error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
