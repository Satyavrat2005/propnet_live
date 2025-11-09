// app/api/properties/bulk-upload/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PROPERTIES, nextPropertyId } from "@/lib/properties-data";
import fs from "fs";
import path from "path";
import os from "os";
import Papa from "papaparse"; // WAIT: papaparse isn't available by default — we'll implement simple CSV parse

// We'll implement a small CSV parser (handles simple CSV with commas & quoted strings)
function parseCSV(text: string) {
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (lines.length === 0) return { fields: [], rows: [] };
  const header = lines[0].split(",").map(h => h.replace(/^"|"$/g, "").trim());
  const rows = lines.slice(1).map(line => {
    // naive split, handles quoted commas
    const row: string[] = [];
    let cur = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"' && line[i+1] === '"') { cur += '"'; i++; continue; }
      if (ch === '"') { inQuotes = !inQuotes; continue; }
      if (ch === ',' && !inQuotes) { row.push(cur); cur = ""; continue; }
      cur += ch;
    }
    row.push(cur);
    return row.map(c => c.replace(/^"|"$/g, "").trim());
  });
  return { fields: header, rows };
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ message: "No file uploaded" }, { status: 400 });
    }
    const text = await file.text();
    const { fields, rows } = parseCSV(text);

    // expected headers: title,propertyType,price,size,location,description,bhk,listingType
    const required = ["title", "propertyType", "price", "size", "location", "listingType"];
    const missing = required.filter(r => !fields.includes(r));
    if (missing.length > 0) {
      return NextResponse.json({ message: `CSV missing required columns: ${missing.join(", ")}` }, { status: 400 });
    }

    let successful = 0;
    let failed = 0;
    const errors: string[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      // create object mapping header->value
      const obj: any = {};
      for (let j = 0; j < fields.length; j++) obj[fields[j]] = row[j] ?? "";

      // basic validation
      if (!obj.title || !obj.propertyType || !obj.price || !obj.size || !obj.location) {
        failed++;
        errors.push(`Row ${i+2}: missing required fields`);
        continue;
      }

      const newProp = {
        id: nextPropertyId(),
        title: obj.title,
        propertyType: obj.propertyType,
        transactionType: obj.transactionType ?? "sale",
        price: obj.price,
        size: obj.size,
        sizeUnit: obj.sizeUnit ?? "sq.ft",
        location: obj.location,
        fullAddress: obj.fullAddress ?? "",
        description: obj.description ?? "",
        bhk: obj.bhk ? Number(obj.bhk) : null,
        listingType: obj.listingType ?? "exclusive",
        photos: [],
        agreementDocument: null,
        createdAt: new Date().toISOString(),
        ownerId: 1,
        ownerName: obj.ownerName ?? undefined,
        ownerPhone: obj.ownerPhone ?? undefined,
        ownerApprovalStatus: "pending",
        approvalTimestamp: null,
      };

      PROPERTIES.push(newProp as any);
      successful++;
    }

    return NextResponse.json({
      total: rows.length,
      successful,
      failed,
      errors,
    });
  } catch (err: any) {
    console.error("bulk upload error:", err);
    return NextResponse.json({ message: String(err?.message ?? "Bulk upload failed") }, { status: 500 });
  }
}
