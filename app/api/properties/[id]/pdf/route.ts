// app/api/properties/[id]/pdf/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PROPERTIES } from "@/lib/properties-data";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  const prop = PROPERTIES.find(p => p.id === id);
  if (!prop) return NextResponse.json({ message: "Not found" }, { status: 404 });

  // Simple text payload served as a PDF-like file for dev usage (most browsers will download it fine).
  // For production use, generate real PDF (puppeteer / pdf-lib / wkhtmltopdf).
  const content = `
Property Listing
================
Title: ${prop.title}
Type: ${prop.propertyType}
Price: ${prop.price}
Size: ${prop.size} ${prop.sizeUnit ?? ""}
Location: ${prop.location}
BHK: ${prop.bhk ?? "N/A"}
Listing Type: ${prop.listingType}
Description: ${prop.description ?? ""}
Owner: ${prop.ownerName ?? "N/A"} (${prop.ownerPhone ?? "N/A"})
Created At: ${prop.createdAt}
  `.trim();

  const encoder = new TextEncoder();
  const bytes = encoder.encode(content);

  return new NextResponse(bytes, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf", // dev-friendly; file contains plain text
      "Content-Disposition": `attachment; filename="${(prop.title || "property").replace(/[^a-z0-9]/gi, "_")}_listing.pdf"`,
    },
  });
}
