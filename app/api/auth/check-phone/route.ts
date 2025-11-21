import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone } = body;

    if (!phone) {
      return NextResponse.json(
        { error: "Phone number is required" },
        { status: 400 }
      );
    }

    // Normalize phone to E.164 format
    const normalizedPhone = phone.startsWith("+91") ? phone : `+91${phone}`;

    // Check if profile exists with this phone
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("id, phone, password")
      .eq("phone", normalizedPhone)
      .maybeSingle();

    if (error) {
      console.error("Error checking phone:", error);
      return NextResponse.json(
        { error: "Failed to check phone number" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      exists: !!profile,
      hasPassword: !!profile?.password,
    });
  } catch (error) {
    console.error("Check phone error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
