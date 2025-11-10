import { SignJWT, jwtVerify } from "jose";

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

export function getSessionCookieHeader(token: string) {
  const isProd = process.env.NODE_ENV === "production";
  // httpOnly, secure, sameSite=lax
  return `session=${token}; HttpOnly; Path=/; Max-Age=${60 * 60 * 24 * 30}; SameSite=Lax; ${
    isProd ? "Secure;" : ""
  }`;
}
