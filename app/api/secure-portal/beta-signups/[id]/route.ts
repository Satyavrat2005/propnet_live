// app/api/admin/beta-signups/[id]/route.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SIGNUPS } from "@/lib/server-data";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id);
    const payload = await req.json();
    const { status, notes } = payload ?? {};

    const idx = SIGNUPS.findIndex((s) => s.id === id);
    if (idx === -1) return NextResponse.json({ message: "Not found" }, { status: 404 });

    if (status && ["pending", "approved", "rejected"].includes(status)) {
      SIGNUPS[idx].status = status as any;
      SIGNUPS[idx].approvedAt = status === "approved" ? new Date().toISOString() : null;
    }
    if (typeof notes === "string") SIGNUPS[idx].notes = notes;

    return NextResponse.json({ success: true, signup: SIGNUPS[idx] });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message || "Error" }, { status: 500 });
  }
}
