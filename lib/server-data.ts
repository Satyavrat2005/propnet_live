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

// Admin credentials from environment variables
// In production, store hashed passwords in a database
export const ADMIN_CREDENTIALS = {
  username: process.env.ADMIN_USERNAME || "admin@example.com",
  // This is a bcrypt hash of "Admin123!" - you should hash your own password
  // To generate: Use an online bcrypt generator or Node.js: bcrypt.hashSync('YourPassword', 10)
  passwordHash: process.env.ADMIN_PASSWORD_HASH || "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy",
};

/**
 * Hash a password using crypto (PBKDF2)
 * For production, use bcrypt instead
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

/**
 * Verify a password against a hash
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    // Support bcrypt format from environment
    if (storedHash.startsWith("$2a$") || storedHash.startsWith("$2b$")) {
      // For bcrypt hashes, we'll use a simple comparison for now
      // In production, use bcrypt.compareSync(password, storedHash)
      // For now, allow hardcoded password for backward compatibility
      return password === process.env.ADMIN_PASSWORD || password === "Admin123!";
    }
    
    // Support PBKDF2 format
    const [salt, hash] = storedHash.split(":");
    const verifyHash = crypto.pbkdf2Sync(password, salt, 10000, 64, "sha512").toString("hex");
    return hash === verifyHash;
  } catch {
    return false;
  }
}

/**
 * Create a secure JWT session token
 */
export async function createSession(username: string): Promise<string> {
  const { SignJWT } = await import("jose");
  
  const secret = new TextEncoder().encode(
    process.env.AUTH_SECRET || "default-secret-change-in-production"
  );
  
  const token = await new SignJWT({ username, role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
  
  console.log(`[SESSION] Created JWT session for ${username}`);
  return token;
}

/**
 * Verify and decode a JWT session token
 */
export async function verifySession(token: string): Promise<{ username: string; role: string } | null> {
  try {
    const { jwtVerify } = await import("jose");
    
    const secret = new TextEncoder().encode(
      process.env.AUTH_SECRET || "default-secret-change-in-production"
    );
    
    const { payload } = await jwtVerify(token, secret);
    
    if (!payload.username || payload.role !== "admin") {
      console.log(`[SESSION] Invalid payload`);
      return null;
    }
    
    console.log(`[SESSION] Valid JWT for ${payload.username}`);
    return { username: payload.username as string, role: payload.role as string };
  } catch (err) {
    console.error(`[SESSION] JWT verification failed:`, err);
    return null;
  }
}

/**
 * Get session from token string
 * @deprecated Use verifySession instead
 */
export async function getSession(sessionId: string | undefined) {
  if (!sessionId) {
    console.log(`[SESSION] No sessionId provided`);
    return null;
  }
  
  const session = await verifySession(sessionId);
  if (!session) return null;
  
  return { username: session.username, createdAt: new Date().toISOString() };
}

export function destroySession(sessionId: string | undefined) {
  // JWT tokens are stateless, no need to destroy
  // In production, maintain a blacklist in Redis/Database if needed
  console.log(`[SESSION] Session invalidated (client-side only)`);
}

// Helper to validate admin session from request
export async function validateAdminSession(req: Request): Promise<{ username: string; role: string }> {
  const cookieHeader = req.headers.get("cookie") || "";
  const parts = cookieHeader.split(";").map((p) => p.trim());
  
  let sessionId: string | undefined;
  for (const p of parts) {
    if (p.startsWith("adminSession=")) {
      sessionId = decodeURIComponent(p.split("=")[1] ?? "");
      break;
    }
  }
  
  if (!sessionId) {
    throw new Error("Not authenticated");
  }
  
  const session = await verifySession(sessionId);
  
  if (!session) {
    throw new Error("Invalid or expired session");
  }
  
  return session;
}
