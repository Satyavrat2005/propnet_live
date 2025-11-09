// app/api/properties/route.ts
import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { PROPERTIES, Property, uploadDir, nextPropertyId } from "@/lib/properties-data";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const dataStr = formData.get("data");
    const payload = dataStr && typeof dataStr === "string" ? JSON.parse(dataStr) : {};

    const files = formData.getAll("photos") as File[]; // may be empty
    const agreementFile = formData.get("agreementDocument") as File | null;

    // save photos
    const savedPhotos: string[] = [];
    for (const f of files) {
      const bytes = await f.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const filename = `${Date.now()}-${f.name.replace(/\s+/g, "_")}`;
      const p = path.join(uploadDir, filename);
      fs.writeFileSync(p, buffer);
      savedPhotos.push(`/uploads/${filename}`);
    }

    // save agreement doc if present
    let savedAgreement: string | undefined;
    if (agreementFile && agreementFile.name) {
      const bytes = await agreementFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const filename = `${Date.now()}-agreement-${agreementFile.name.replace(/\s+/g, "_")}`;
      const p = path.join(uploadDir, filename);
      fs.writeFileSync(p, buffer);
      savedAgreement = `/uploads/${filename}`;
    }

    // Create property object (mock ownerId = 1)
    const newProperty: Property = {
      id: nextPropertyId(),
      title: String(payload.title ?? payload.name ?? "Untitled property"),
      propertyType: String(payload.propertyType ?? "Apartment"),
      transactionType: payload.transactionType ?? "sale",
      price: String(payload.price ?? ""),
      size: String(payload.size ?? ""),
      sizeUnit: payload.sizeUnit ?? "sq.ft",
      location: String(payload.location ?? ""),
      fullAddress: String(payload.fullAddress ?? ""),
      description: String(payload.description ?? ""),
      bhk: payload.bhk ?? null,
      listingType: String(payload.listingType ?? "exclusive"),
      photos: savedPhotos,
      agreementDocument: savedAgreement ?? null,
      createdAt: new Date().toISOString(),
      ownerId: 1,
      ownerName: payload.ownerName ?? undefined,
      ownerPhone: payload.ownerPhone ?? undefined,
      ownerApprovalStatus: payload.ownerApprovalStatus ?? "pending",
      approvalTimestamp: payload.approvalTimestamp ?? null,
    };

    PROPERTIES.push(newProperty);

    return NextResponse.json({ success: true, property: newProperty });
  } catch (err: any) {
    console.error("POST /api/properties error:", err);
    return NextResponse.json({ success: false, message: String(err?.message ?? "Internal error") }, { status: 500 });
  }
}

export async function GET() {
  // Return public feed (all properties)
  return NextResponse.json(PROPERTIES);
}
