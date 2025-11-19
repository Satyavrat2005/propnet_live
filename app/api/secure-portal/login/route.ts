// app/api/secure-portal/login/route.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ADMIN_CREDENTIALS, createSession } from "@/lib/server-data";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body ?? {};

    if (!username || !password) {
      return NextResponse.json({ success: false, message: "Username and password required" }, { status: 400 });
    }

    // Verify username
    if (username !== ADMIN_CREDENTIALS.username) {
      return NextResponse.json({ success: false, message: "Invalid credentials" }, { status: 401 });
    }

    // Verify password with secure bcrypt comparison
    const { verifyPassword } = await import("@/lib/server-data");
    const isValid = verifyPassword(password, ADMIN_CREDENTIALS.passwordHash);
    
    if (!isValid) {
      return NextResponse.json({ success: false, message: "Invalid credentials" }, { status: 401 });
    }

    const sessionId = await createSession(username);

    const res = NextResponse.json({ success: true });
    // cookie options appropriate for local dev and production:
    res.cookies.set({
      name: "adminSession",
      value: sessionId,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return res;
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message || "Login failed" }, { status: 500 });
  }
}
