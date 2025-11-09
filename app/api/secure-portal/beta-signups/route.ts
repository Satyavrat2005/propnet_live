// app/api/admin/beta-signups/route.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SIGNUPS } from "@/lib/server-data";

export async function GET(req: NextRequest) {
  // Public endpoint (no auth) — mirrors the in-memory signups
  return NextResponse.json(JSON.parse(JSON.stringify(SIGNUPS)));
}
