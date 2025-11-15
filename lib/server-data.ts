// app/lib/server-data.ts
import crypto from "crypto";

export type SignupStatus = "pending" | "approved" | "rejected";

export interface BetaSignup {
  id: number;
  name: string;
  phone: string;
  email?: string;
  businessName?: string;
  reraId?: string;
  experience?: string;
  workingRegions?: string[];
  areaOfExpertise?: string[];
  notes?: string;
  status: SignupStatus;
  createdAt: string;
  approvedAt?: string | null;
}

const now = () => new Date().toISOString();

// --- In-memory signups (starter data) ---
export const SIGNUPS: BetaSignup[] = [
  {
    id: 1,
    name: "Deepak Vishwakarma",
    phone: "9769559889",
    email: "deepak@example.com",
    businessName: "DV Realty",
    reraId: "RERA-001",
    experience: "5 years",
    workingRegions: ["Mumbai", "Pune"],
    areaOfExpertise: ["Residential"],
    status: "pending",
    createdAt: now(),
  },
  {
    id: 2,
    name: "Asha Verma",
    phone: "9876543210",
    email: "asha@example.com",
    businessName: "Asha Estates",
    reraId: "RERA-002",
    experience: "8 years",
    workingRegions: ["Bengaluru"],
    areaOfExpertise: ["Commercial"],
    status: "approved",
    createdAt: now(),
    approvedAt: now(),
  }
];

// --- Simple in-memory sessions map (sessionId -> admin info) ---
export const SESSIONS = new Map<string, { username: string; createdAt: string }>();

// Hard-coded admin credential for this demo (change in production)
export const ADMIN_CREDENTIALS = {
  username: "admin@example.com",
  password: "Admin123!",
};

export function createSession(username: string) {
  const id = crypto.randomBytes(24).toString("hex");
  SESSIONS.set(id, { username, createdAt: new Date().toISOString() });
  return id;
}

export function destroySession(sessionId: string | undefined) {
  if (!sessionId) return;
  SESSIONS.delete(sessionId);
}

export function getSession(sessionId: string | undefined) {
  if (!sessionId) return null;
  return SESSIONS.get(sessionId) ?? null;
}

// Helper to validate admin session from request
export function validateAdminSession(req: Request): { username: string } {
  const cookie = (req.headers.get("cookie") || "")
    .split(";")
    .find((c) => c.trim().startsWith("adminSession="));
  
  if (!cookie) {
    throw new Error("Not authenticated");
  }
  
  const sessionId = cookie.split("=")[1];
  const session = getSession(sessionId);
  
  if (!session) {
    throw new Error("Invalid or expired session");
  }
  
  return { username: session.username };
}
