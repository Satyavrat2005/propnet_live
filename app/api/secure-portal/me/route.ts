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
    console.log(`[ME] Received session cookie: ${sid ? sid.substring(0, 20) + '...' : 'NONE'}`);
    
    if (!sid) {
      console.log(`[ME] No session cookie, returning 401`);
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }
    
    const { verifySession } = await import("@/lib/server-data");
    const session = await verifySession(sid);
    
    if (!session) {
      console.log(`[ME] Invalid session, returning 401`);
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    console.log(`[ME] Session valid for user: ${session.username}`);
    return NextResponse.json({
      authenticated: true,
      admin: { username: session.username },
    });
  } catch (err: any) {
    console.error(`[ME] Error:`, err);
    return NextResponse.json({ authenticated: false }, { status: 500 });
  }
}
