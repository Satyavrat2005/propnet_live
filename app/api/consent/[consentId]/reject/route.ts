import { NextRequest, NextResponse } from "next/server";
import { processConsentAction } from "../_helpers";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ consentId: string }> }
) {
  const { consentId } = await params;
  if (!consentId) {
    return NextResponse.json({ message: "Consent token missing" }, { status: 400 });
  }

  return processConsentAction(consentId, "rejected");
}
