// app/api/auth/logout/route.ts
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  // If your auth uses a different cookie/session mechanism replace here.
  const res = NextResponse.json({ ok: true });

  // Clear cookie; adapt name if your session cookie is different.
  // set-cookie header must include attributes (path, sameSite, secure when needed)
  res.headers.set("Set-Cookie", `token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax;`);

  return res;
}
