// app/api/properties/[propertyId]/renew/route.ts
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function getUserFromCookie(req: NextRequest) {
  const cookie = req.headers.get("cookie") || "";
  const part = cookie.split(";").find((c) => c.trim().startsWith("session="));
  if (!part) return null;
  try {
    const token = part.split("=")[1];
    const { verifySession, getUserIdFromSession } = await import("@/lib/auth/session");
    const session = await verifySession(token);
    return getUserIdFromSession(session);
  } catch {
    return null;
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ propertyId: string }> }
) {
  try {
    const userId = await getUserFromCookie(req);
    if (!userId) {
      return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
    }

    const { propertyId } = await params;

    // Verify property belongs to user
    const { data: property, error: fetchError } = await supabase
      .from("properties")
      .select("id, expires_at")
      .eq("property_id", propertyId)
      .single();

    if (fetchError || !property) {
      return NextResponse.json(
        { message: "Property not found" },
        { status: 404 }
      );
    }

    if (property.id !== userId) {
      return NextResponse.json(
        { message: "You don't have permission to renew this property" },
        { status: 403 }
      );
    }

    // Calculate new expiry date: current time + 30 days
    const newExpiryDate = new Date();
    newExpiryDate.setDate(newExpiryDate.getDate() + 30);

    // Update expires_at
    const { data: updatedProperty, error: updateError } = await supabase
      .from("properties")
      .update({ 
        expires_at: newExpiryDate.toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq("property_id", propertyId)
      .select("expires_at")
      .single();

    if (updateError) {
      console.error("Failed to renew property:", updateError);
      return NextResponse.json(
        { message: "Failed to renew property" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { 
        message: "Property renewed successfully",
        expiresAt: updatedProperty.expires_at
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[POST /api/properties/[propertyId]/renew] Error:", error);
    return NextResponse.json(
      { message: error?.message || "Unexpected error" },
      { status: 500 }
    );
  }
}
