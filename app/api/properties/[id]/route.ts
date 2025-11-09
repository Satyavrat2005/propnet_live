// app/api/properties/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { PROPERTIES, uploadDir } from "@/lib/properties-data";

function findIndexById(id: number) {
  return PROPERTIES.findIndex(p => p.id === id);
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  const prop = PROPERTIES.find(p => p.id === id);
  if (!prop) return NextResponse.json({ message: "Not found" }, { status: 404 });
  return NextResponse.json(prop);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id);
    const idx = findIndexById(id);
    if (idx === -1) return NextResponse.json({ message: "Not found" }, { status: 404 });

    const formData = await req.formData();
    // The client sometimes sends a "data" JSON field, or plain fields — handle both
    const dataField = formData.get("data");
    let payload: any = {};
    if (dataField && typeof dataField === "string") {
      try { payload = JSON.parse(dataField); } catch { payload = {}; }
    } else {
      // collect other string form fields
      for (const [k, v] of formData.entries()) {
        if (k === "photos" || k === "agreementDocument") continue;
        if (typeof v === "string") payload[k] = v;
      }
    }

    // update simple fields
    const updatable = ["title","propertyType","price","size","sizeUnit","location","fullAddress","description","listingType","bhk","ownerName","ownerPhone","ownerApprovalStatus"];
    for (const key of updatable) {
      if (payload[key] !== undefined) (PROPERTIES[idx] as any)[key] = payload[key];
    }

    // handle new photos
    const newPhotos = formData.getAll("photos") as File[];
    for (const f of newPhotos) {
      const bytes = await f.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const filename = `${Date.now()}-${f.name.replace(/\s+/g, "_")}`;
      const filePath = path.join(uploadDir, filename);
      fs.writeFileSync(filePath, buffer);
      PROPERTIES[idx].photos.push(`/uploads/${filename}`);
    }

    // agreementDocument if present
    const agreement = formData.get("agreementDocument") as File | null;
    if (agreement && agreement.name) {
      const bytes = await agreement.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const filename = `${Date.now()}-agreement-${agreement.name.replace(/\s+/g, "_")}`;
      const filePath = path.join(uploadDir, filename);
      fs.writeFileSync(filePath, buffer);
      PROPERTIES[idx].agreementDocument = `/uploads/${filename}`;
    }

    // update approval timestamp if status set to approved
    if (payload.ownerApprovalStatus === "approved") {
      PROPERTIES[idx].approvalTimestamp = new Date().toISOString();
    } else if (payload.ownerApprovalStatus === "rejected") {
      PROPERTIES[idx].approvalTimestamp = null;
    }

    return NextResponse.json({ success: true, property: PROPERTIES[idx] });
  } catch (err: any) {
    console.error("PUT /api/properties/[id] error:", err);
    return NextResponse.json({ success: false, message: String(err?.message ?? "Error") }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  const idx = findIndexById(id);
  if (idx === -1) return NextResponse.json({ message: "Not found" }, { status: 404 });

  // Optionally remove files from disk (photos + agreement) — keep simple: do not delete files to avoid accidental removal
  PROPERTIES.splice(idx, 1);
  return NextResponse.json({ success: true });
}
