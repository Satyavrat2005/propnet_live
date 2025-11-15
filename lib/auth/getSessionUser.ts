import { NextRequest } from "next/server";
import { verifySession } from "./session";

function extractSessionToken(req: NextRequest) {
  const cookieHeader = req.headers.get("cookie") || "";
  const sessionPair = cookieHeader
    .split(";")
    .map((chunk) => chunk.trim())
    .find((chunk) => chunk.startsWith("session="));
  if (!sessionPair) return null;
  const [, token] = sessionPair.split("=");
  return token || null;
}

export async function getSessionUser(req: NextRequest) {
  const token = extractSessionToken(req);
  if (!token) return null;
  try {
    const payload = await verifySession(token);
    return payload;
  } catch {
    return null;
  }
}
