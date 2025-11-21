import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcrypt";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * Reset PIN endpoint
 * Called after user verifies OTP during forgot password flow
 * Updates the profiles.password column with new bcrypt-hashed PIN
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, newPin } = body;

    // Validate inputs
    if (!phone || typeof phone !== "string") {
      return NextResponse.json(
        { error: "Phone number is required" },
        { status: 400 }
      );
    }

    if (!newPin || typeof newPin !== "string") {
      return NextResponse.json(
        { error: "New PIN is required" },
        { status: 400 }
      );
    }

    // Validate PIN format (4-6 digits)
    if (!/^\d{4,6}$/.test(newPin)) {
      return NextResponse.json(
        { error: "PIN must be 4-6 digits" },
        { status: 400 }
      );
    }

    // Normalize phone to E.164 format
    let normalizedPhone = phone.trim();
    if (!normalizedPhone.startsWith("+")) {
      normalizedPhone = `+91${normalizedPhone.replace(/^0+/, "")}`;
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if profile exists
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, phone")
      .eq("phone", normalizedPhone)
      .maybeSingle();

    if (profileError) {
      console.error("Database error checking profile:", profileError);
      return NextResponse.json(
        { error: "Database error" },
        { status: 500 }
      );
    }

    if (!profile) {
      return NextResponse.json(
        { error: "Phone number not registered" },
        { status: 404 }
      );
    }

    // Hash the new PIN
    const hashedPin = await bcrypt.hash(newPin, 12);

    // Update the password column with new hashed PIN
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ password: hashedPin })
      .eq("id", profile.id);

    if (updateError) {
      console.error("Error updating PIN:", updateError);
      return NextResponse.json(
        { error: "Failed to reset PIN" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "PIN reset successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Reset PIN error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
