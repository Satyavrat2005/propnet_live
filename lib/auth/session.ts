import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const secret = new TextEncoder().encode(process.env.AUTH_SECRET || "replace_with_strong_secret");

export type SessionPayload = {
  sub: string;           // profiles.id
  phone: string;
};

export async function signSession(payload: SessionPayload) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret);
}

export async function verifySession(token: string) {
  const { payload } = await jwtVerify(token, secret);
  return payload as SessionPayload;
}

/**
 * Helper to extract user ID from session payload.
 * Supports both old format (id) and new format (sub) for backward compatibility.
 */
export function getUserIdFromSession(session: any): string {
  return session.sub || session.id || "";
}

export function getSessionCookieHeader(token: string) {
  const isProd = process.env.NODE_ENV === "production";
  // httpOnly, secure, sameSite=lax
  return `session=${token}; HttpOnly; Path=/; Max-Age=${60 * 60 * 24 * 30}; SameSite=Lax; ${
    isProd ? "Secure;" : ""
  }`;
}

/**
 * Read the session cookie token using Next.js cookies API
 * This is the recommended way to read cookies in Next.js API routes
 */
export async function readSessionCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("session");
  return sessionCookie?.value || null;
}
