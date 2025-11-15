// app/api/auth/logout/route.ts
import { NextResponse } from "next/server";

export async function POST() {
  const res = NextResponse.json({ ok: true });

  const cookieConfig = {
    httpOnly: true,
    path: "/",
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
  };

  res.cookies.set({ ...cookieConfig, name: "session", value: "" });
  res.cookies.set({ ...cookieConfig, name: "token", value: "" });

  return res;
}
