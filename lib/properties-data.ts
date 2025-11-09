// app/lib/properties-data.ts
import fs from "fs";
import path from "path";

export interface Property {
  id: number;
  title: string;
  propertyType: string;
  transactionType?: string;
  price: string;
  size: string;
  sizeUnit?: string;
  location: string;
  fullAddress?: string;
  description?: string;
  bhk?: number | null;
  listingType: string;
  photos: string[]; // URLs under /uploads
  agreementDocument?: string | null;
  createdAt: string;
  ownerId: number; // simple owner mock
  ownerName?: string;
  ownerPhone?: string;
  ownerApprovalStatus?: "pending" | "approved" | "rejected";
  approvalTimestamp?: string | null;
}

// shared in-memory store (demo only)
export const PROPERTIES: Property[] = [];

// uploads folder
export const uploadDir = path.join(process.cwd(), "public", "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

export function nextPropertyId() {
  return PROPERTIES.length === 0 ? 1 : Math.max(...PROPERTIES.map(p => p.id)) + 1;
}
