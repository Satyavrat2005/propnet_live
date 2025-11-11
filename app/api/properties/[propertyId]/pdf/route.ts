import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifySession } from "@/lib/auth/session";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { Buffer } from "node:buffer";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const adminSupabase = process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  : supabase;

async function getUserFromCookie(req: NextRequest) {
  const cookie = req.headers.get("cookie") || "";
  const part = cookie.split(";").find((c) => c.trim().startsWith("session="));
  if (!part) return null;
  try {
    const token = part.split("=")[1];
    const session = await verifySession(token);
    return session.sub as string;
  } catch {
    return null;
  }
}

function parseScopeOfWork(value: any): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  try {
    const parsed = JSON.parse(String(value));
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch {
    if (typeof value === "string") {
      return value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    }
    return [];
  }
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ propertyId: string }> }
) {
  const params = await context.params;
  const propertyId = params?.propertyId;
  if (!propertyId) {
    return NextResponse.json({ message: "Property id missing" }, { status: 400 });
  }

  const userId = await getUserFromCookie(req);
  if (!userId) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  }

  const { data, error } = await adminSupabase
    .from("properties")
    .select(
      `property_id, id, property_title, property_type, transaction_type, sale_price, area, area_unit, bhk, location, full_address, description, listing_type, commission_terms, scope_of_work, approval_status, owner_name, owner_phone, created_at`
    )
    .eq("property_id", propertyId)
    .maybeSingle();

  if (error) {
    console.error("[GET /api/properties/:id/pdf] Supabase error:", error);
    return NextResponse.json({ message: "Failed to load property" }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ message: "Property not found" }, { status: 404 });
  }

  if (data.id !== userId) {
    return NextResponse.json({ message: "You do not have permission to access this property." }, { status: 403 });
  }

  try {
    const doc = await PDFDocument.create();
    const page = doc.addPage();
    const { width, height } = page.getSize();

    const regularFont = await doc.embedFont(StandardFonts.Helvetica);
    const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);

    let cursorY = height - 50;

    const writeLine = (text: string, options: { bold?: boolean; size?: number } = {}) => {
      const font = options.bold ? boldFont : regularFont;
      const fontSize = options.size ?? 12;
      page.drawText(text, {
        x: 40,
        y: cursorY,
        size: fontSize,
        font,
        color: undefined,
      });
      cursorY -= fontSize + 8;
    };

    writeLine("PropNet Property Summary", { bold: true, size: 18 });
    writeLine(`Generated on ${new Date().toLocaleString()}`, { size: 10 });
    cursorY -= 8;

    writeLine("Property Overview", { bold: true, size: 14 });
    writeLine(`Title: ${data.property_title || "Not specified"}`);
    writeLine(`Type: ${data.property_type || "Not specified"}`);
    writeLine(`Listing: ${data.listing_type || "Not specified"}`);
    writeLine(`Transaction: ${data.transaction_type || "Not specified"}`);
    writeLine(`Price: ${data.sale_price || "Not specified"}`);
    writeLine(
      `Size: ${data.area ? `${data.area}${data.area_unit ? ` ${data.area_unit}` : ""}` : "Not specified"}`
    );
    if (data.bhk) {
      writeLine(`${data.bhk} BHK`);
    }
    writeLine(`Status: ${data.approval_status || "pending"}`);

    cursorY -= 4;
    writeLine("Location", { bold: true, size: 14 });
    writeLine(`Area: ${data.location || "Not specified"}`);
    writeLine(`Full Address: ${data.full_address || "Not specified"}`);

    if (data.description) {
      cursorY -= 4;
      writeLine("Description", { bold: true, size: 14 });
  const words = data.description.split(" ");
  let line = "";
  words.forEach((word: string) => {
        const testLine = `${line}${line ? " " : ""}${word}`;
        if (regularFont.widthOfTextAtSize(testLine, 12) > width - 80) {
          writeLine(line.trim());
          line = word;
        } else {
          line = testLine;
        }
      });
      if (line) writeLine(line.trim());
    }

    const scopeItems = parseScopeOfWork(data.scope_of_work);
    if (scopeItems.length) {
      cursorY -= 4;
      writeLine("Scope of Work", { bold: true, size: 14 });
      scopeItems.forEach((item) => {
        writeLine(`• ${item}`);
      });
    }

    cursorY -= 4;
    writeLine("Owner Details", { bold: true, size: 14 });
    writeLine(`Name: ${data.owner_name || "Not provided"}`);
    writeLine(`Phone: ${data.owner_phone || "Not provided"}`);

    const pdfBytes = await doc.save();
    const filename = `${(data.property_title || "property")
      .replace(/[^a-zA-Z0-9]/g, "_")
      .slice(0, 40)}.pdf`;

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err: any) {
    console.error("[GET /api/properties/:id/pdf] Unexpected error:", err);
    return NextResponse.json({ message: "Failed to generate PDF" }, { status: 500 });
  }
}
