// app/api/secure-portal/logout/route.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { destroySession } from "@/lib/server-data";

function getCookieFromReq(req: NextRequest, name: string) {
  const cookieHeader = req.headers.get("cookie") ?? "";
  const parts = cookieHeader.split(";").map((p) => p.trim());
  for (const p of parts) {
    if (p.startsWith(`${name}=`)) return decodeURIComponent(p.split("=")[1] ?? "");
  }
  return undefined;
}

export async function POST(req: NextRequest) {
  try {
    const sid = getCookieFromReq(req, "adminSession");
    destroySession(sid);

    const res = NextResponse.json({ success: true });
    // remove cookie by setting it expired
    res.cookies.set({
      name: "adminSession",
      value: "",
      httpOnly: true,
      path: "/",
      maxAge: 0,
    });
    return res;
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message || "Logout failed" }, { status: 500 });
  }
}
