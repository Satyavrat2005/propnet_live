// app/api/secure-portal/me/route.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSession } from "@/lib/server-data";

function getCookieFromReq(req: NextRequest, name: string) {
  const cookieHeader = req.headers.get("cookie") ?? "";
  const parts = cookieHeader.split(";").map((p) => p.trim());
  for (const p of parts) {
    if (p.startsWith(`${name}=`)) return decodeURIComponent(p.split("=")[1] ?? "");
  }
  return undefined;
}

export async function GET(req: NextRequest) {
  try {
    const sid = getCookieFromReq(req, "adminSession");
    const session = getSession(sid);
    if (!session) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    return NextResponse.json({
      authenticated: true,
      admin: { username: session.username },
    });
  } catch (err: any) {
    return NextResponse.json({ authenticated: false }, { status: 500 });
  }
}
