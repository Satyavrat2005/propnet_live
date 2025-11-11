import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function processConsentAction(consentId: string, status: "approved" | "rejected") {
  const { data: property, error } = await adminSupabase
    .from("properties")
    .select("property_id, approval_status")
    .eq("owner_consent_token", consentId)
    .maybeSingle();

  if (error) {
    console.error("[POST /api/consent] Supabase fetch error:", error);
    return NextResponse.json({ message: "Failed to load consent" }, { status: 500 });
  }

  if (!property) {
    return NextResponse.json({ message: "Consent link invalid" }, { status: 404 });
  }

  if (property.approval_status && property.approval_status !== "pending") {
    return NextResponse.json(
      { message: "Consent already processed", action: property.approval_status },
      { status: 409 }
    );
  }

  const nowIso = new Date().toISOString();

  const { error: updateError } = await adminSupabase
    .from("properties")
    .update({
      approval_status: status,
      owner_consent_response_at: nowIso,
    })
    .eq("property_id", property.property_id);

  if (updateError) {
    console.error("[POST /api/consent] Supabase update error:", updateError);
    return NextResponse.json({ message: "Failed to update consent" }, { status: 500 });
  }

  return NextResponse.json({ success: true, action: status === "approved" ? "approve" : "reject" });
}
