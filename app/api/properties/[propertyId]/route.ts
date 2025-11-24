// app/api/properties/[propertyId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifySession, getUserIdFromSession } from "@/lib/auth/session";
import { Buffer } from "node:buffer";
import { sendSms } from "@/lib/twilio";
import { randomUUID } from "crypto";
import { parseAddressWithGemini } from "@/lib/gemini-address-parser";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const adminSupabase = process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  : supabase;

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

function extractBrokerProfile(row: { profiles?: any }) {
  const profileRecord = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
  if (!profileRecord) {
    return null;
  }

  return {
    name: profileRecord.name || null,
    phone: profileRecord.phone || null,
    agencyName: profileRecord.agency_name || null,
    profilePhotoUrl: profileRecord.profile_photo_url || null,
    email: profileRecord.email || null,
  };
}

async function getUserFromCookie(req: NextRequest) {
  const cookie = req.headers.get("cookie") || "";
  const part = cookie.split(";").find((c) => c.trim().startsWith("session="));
  if (!part) return null;
  try {
    const token = part.split("=")[1];
    const session = await verifySession(token);
    return getUserIdFromSession(session);
  } catch {
    return null;
  }
}

async function fileToBase64(file: File): Promise<string> {
  const ab = await file.arrayBuffer();
  if (typeof Buffer !== "undefined") {
    return Buffer.from(ab).toString("base64");
  }
  let binary = "";
  const chunk = 0x8000;
  const bytes = new Uint8Array(ab);
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk) as any);
  }
  return btoa(binary);
}

async function uploadToImgBB(file: File): Promise<string> {
  const apiKey = process.env.IMGBB_API_KEY;
  if (!apiKey) throw new Error("IMGBB_API_KEY missing");

  const base64 = await fileToBase64(file);
  const formData = new FormData();
  formData.append("image", base64);

  const res = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
    method: "POST",
    body: formData,
  });

  const json = await res.json();
  if (!json?.success) {
    throw new Error("Image upload failed");
  }

  return json.data?.url as string;
}

function normalizePhone(raw: string | null): string | null {
  if (!raw) return null;
  const input = String(raw).trim();
  if (!input) return null;

  const hasPlusPrefix = input.startsWith("+");
  const digits = input.replace(/[^\d]/g, "");

  if (!digits) return null;

  if (hasPlusPrefix) {
    return `+${digits}`;
  }

  if (digits.length === 12 && digits.startsWith("91")) {
    return `+${digits}`;
  }

  if (digits.length === 11 && digits.startsWith("0")) {
    return `+91${digits.slice(1)}`;
  }

  if (digits.length === 10) {
    return `+91${digits}`;
  }

  return `+${digits}`;
}

function normalizePhoneList(raw: string | null): string[] {
  if (!raw) return [];
  const sanitized = String(raw).replace(/[\r\n;/|]+/g, ",");
  const parts = sanitized
    .split(",")
    .map((part) => normalizePhone(part))
    .filter((value): value is string => Boolean(value));

  return Array.from(new Set(parts));
}

function getAppBaseUrl(req: NextRequest): string {
  const origin = req.headers.get("origin");
  if (origin) return origin;
  if (process.env.NEXT_PUBLIC_APP_BASE_URL) return process.env.NEXT_PUBLIC_APP_BASE_URL;
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  const vercelUrl = process.env.VERCEL_URL;
  if (vercelUrl) {
    return vercelUrl.startsWith("http") ? vercelUrl : `https://${vercelUrl}`;
  }
  return "https://propnet.live";
}

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ propertyId: string }> }
) {
  const params = await context.params;
  const propertyId = params?.propertyId;
  if (!propertyId) {
    return NextResponse.json({ message: "Property id missing" }, { status: 400 });
  }

  try {
    const { data, error } = await supabase
      .from("properties")
      .select(
        `
        property_id,
        id,
        property_title,
        property_type,
        transaction_type,
        sale_price,
        area,
        area_unit,
        bhk,
        location,
        full_address,
        flat_number,
        floor,
        building_society,
        description,
        listing_type,
        property_photos,
        commission_terms,
        scope_of_work,
        approval_status,
        public_property,
        latitude,
        longitude,
        owner_name,
        owner_phone,
        created_at,
        updated_at
        ,profiles(name, agency_name, profile_photo_url, phone, email)
      `
      )
      .eq("property_id", propertyId)
      .maybeSingle();

    if (error) {
      console.error("[GET /api/properties/:id] Supabase error:", error);
      return NextResponse.json({ message: "Failed to load property" }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ message: "Property not found" }, { status: 404 });
    }

    const broker = extractBrokerProfile(data);

    const payload = {
      id: data.property_id,
      ownerId: data.id,
      title: data.property_title,
      propertyType: data.property_type,
      transactionType: data.transaction_type,
      price: data.sale_price,
      size: data.area,
      sizeUnit: data.area_unit,
      bhk: data.bhk,
      location: data.location,
      fullAddress: data.full_address,
      description: data.description,
      listingType: data.listing_type,
      photos: Array.isArray(data.property_photos) ? data.property_photos : [],
      commissionTerms: data.commission_terms,
      scopeOfWork: parseScopeOfWork(data.scope_of_work),
      owner: {
        name: data.owner_name ?? null,
        phone: data.owner_phone ?? null,
        email: null,
      },
      broker,
      ownerApprovalStatus: data.approval_status,
      isPubliclyVisible: data.public_property,
      lat: data.latitude,
      lng: data.longitude,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      flatNumber: data.flat_number ?? null,
      flat_number: data.flat_number ?? null,
      floor: data.floor ?? null,
      buildingSociety: data.building_society ?? null,
      building_society: data.building_society ?? null,
    };

    return NextResponse.json(payload, { status: 200 });
  } catch (err: any) {
    console.error("[GET /api/properties/:id] Unexpected error:", err);
    return NextResponse.json({ message: err?.message || "Unexpected error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, context: { params: Promise<{ propertyId: string }> }) {
  const params = await context.params;
  const propertyId = params?.propertyId;
  if (!propertyId) {
    return NextResponse.json({ message: "Property id missing" }, { status: 400 });
  }

  const userId = await getUserFromCookie(req);
  if (!userId) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  }

  const { data: existingProperty, error: fetchError } = await adminSupabase
    .from("properties")
    .select("property_id, id, property_photos, approval_status")
    .eq("property_id", propertyId)
    .maybeSingle();

  if (fetchError) {
    console.error("[PUT /api/properties/:id] Supabase fetch error:", fetchError);
    return NextResponse.json({ message: "Failed to load property" }, { status: 500 });
  }

  if (!existingProperty) {
    return NextResponse.json({ message: "Property not found" }, { status: 404 });
  }

  if (existingProperty.id !== userId) {
    return NextResponse.json({ message: "You do not have permission to update this property." }, { status: 403 });
  }

  try {
    const form = await req.formData();
    const scopeOfWorkRaw = form.get("scopeOfWork");
    const existingPhotosRaw = form.get("existingPhotos");
    const photoFiles: File[] = form.getAll("photos").filter(Boolean) as File[];

    let currentPhotos: string[] = [];
    if (typeof existingPhotosRaw === "string" && existingPhotosRaw.trim()) {
      try {
        const parsed = JSON.parse(existingPhotosRaw);
        if (Array.isArray(parsed)) currentPhotos = parsed.filter(Boolean);
      } catch {
        currentPhotos = [];
      }
    } else if (Array.isArray(existingProperty.property_photos)) {
      currentPhotos = existingProperty.property_photos.filter(Boolean);
    }

    const uploadedPhotos: string[] = [];
    for (const file of photoFiles) {
      if (!file || file.size === 0) continue;
      try {
        const url = await uploadToImgBB(file);
        uploadedPhotos.push(url);
      } catch (uploadErr) {
        console.warn("Image upload failed during update:", uploadErr);
      }
    }

    const finalPhotos = [...currentPhotos, ...uploadedPhotos];

    const fullAddress = (form.get("fullAddress") || "").toString().trim();

    // Use Gemini to parse address components from fullAddress
    let location: string | null = null;
    let flatNumber: string | null = null;
    let floorNumber: string | null = null;
    let buildingSociety: string | null = null;

    if (fullAddress) {
      const parsedAddress = await parseAddressWithGemini(fullAddress);
      location = parsedAddress.location;
      flatNumber = parsedAddress.flatNumber;
      floorNumber = parsedAddress.floorNumber;
      buildingSociety = parsedAddress.buildingSociety;
    }

    const normalizedPayload: Record<string, any> = {
      property_title: form.get("title") || null,
      property_type: form.get("propertyType") || null,
      transaction_type: form.get("transactionType") || null,
      bhk: form.get("bhk") ? Number(form.get("bhk")) || null : null,
      area: form.get("size") ? Number(form.get("size")) || null : null,
      area_unit: form.get("sizeUnit") || null,
      sale_price: form.get("price") || null,
      location,
      full_address: fullAddress || null,
      flat_number: flatNumber,
      floor: floorNumber,
      building_society: buildingSociety,
      description: form.get("description") || null,
      listing_type: form.get("listingType") || null,
      public_property: String(form.get("isPubliclyVisible")) === "true",
      owner_name: form.get("ownerName") || null,
      owner_phone: form.get("ownerPhone") || null,
      commission_terms: form.get("commissionTerms") || null,
      scope_of_work: scopeOfWorkRaw ? String(scopeOfWorkRaw) : null,
      property_photos: finalPhotos.length ? finalPhotos : null,
      updated_at: new Date().toISOString(),
      // Reset approval status to pending when property is edited
      approval_status: "pending",
    };

    // Generate new consent token for edited property
    const newConsentToken = randomUUID();
    normalizedPayload.owner_consent_token = newConsentToken;
    normalizedPayload.owner_consent_sent_at = new Date().toISOString();

    const { data: updated, error: updateError } = await adminSupabase
      .from("properties")
      .update(normalizedPayload)
      .eq("property_id", propertyId)
      .select(
        `property_id, id, property_title, property_type, transaction_type, sale_price, area, area_unit, bhk, location, full_address, description, listing_type, property_photos, commission_terms, scope_of_work, approval_status, public_property, latitude, longitude, owner_name, owner_phone, created_at, updated_at, profiles(name, agency_name, profile_photo_url, phone, email)`
      )
      .single();

    if (updateError) {
      console.error("[PUT /api/properties/:id] Supabase update error:", updateError);
      return NextResponse.json({ message: "Failed to update property" }, { status: 500 });
    }

    // Send SMS notification to owner about the edit
    let smsStatus = "not_attempted";
    let smsError: string | null = null;

    try {
      const ownerPhonesE164 = normalizePhoneList(updated.owner_phone);
      const ownerConsentUrl = `${getAppBaseUrl(req)}/consent/${newConsentToken}`;

      const envReady = Boolean(
        process.env.TWILIO_ACCOUNT_SID &&
          process.env.TWILIO_AUTH_TOKEN &&
          (process.env.TWILIO_MESSAGING_SERVICE_SID || process.env.TWILIO_SMS_FROM)
      );

      if (!ownerPhonesE164.length) {
        smsStatus = "skipped";
        smsError = "Owner phone missing or invalid";
      } else if (!envReady) {
        smsStatus = "skipped";
        smsError = "Twilio messaging credentials missing";
      } else {
        const { data: agentProfile } = await supabase
          .from("profiles")
          .select("name")
          .eq("id", userId)
          .single();

        const ownerFirstName = updated.owner_name ? String(updated.owner_name).split(" ")[0] : "Hi";
        const agentName = agentProfile?.name || "Your agent";
        const areaSnippet = updated.area
          ? `${updated.area}${updated.area_unit ? ` ${updated.area_unit}` : ""}`
          : null;
        const priceSnippet = updated.sale_price ? String(updated.sale_price) : "Price on request";

        const smsBodyLines = [
          `${ownerFirstName}, ${agentName} has updated your property listing on PropNet.`,
          `"${updated.property_title}" at ${updated.location}`,
          [updated.property_type, updated.bhk ? `${updated.bhk} BHK` : null, areaSnippet]
            .filter(Boolean)
            .join(" • "),
          `Price: ${priceSnippet}`,
          `Please review and approve the changes: ${ownerConsentUrl}`,
        ].filter(Boolean);

        const smsBody = smsBodyLines.join("\n");

        try {
          await sendSms({ to: ownerPhonesE164, body: smsBody });
          smsStatus = "sent";
          console.log(`[PUT] SMS sent to owner for property ${propertyId}`);
        } catch (smsErr: any) {
          smsStatus = "failed";
          smsError = smsErr?.message || "Failed to send SMS";
          console.error("[PUT] Twilio SMS error:", smsErr);
        }
      }
    } catch (smsSetupErr: any) {
      console.error("[PUT] SMS setup error:", smsSetupErr);
      smsStatus = "failed";
      if (!smsError) smsError = smsSetupErr?.message || "Failed to prepare SMS";
    }

    const broker = extractBrokerProfile(updated);

    const payload = {
      id: updated.property_id,
      ownerId: updated.id,
      title: updated.property_title,
      propertyType: updated.property_type,
      transactionType: updated.transaction_type,
      price: updated.sale_price,
      size: updated.area,
      sizeUnit: updated.area_unit,
      bhk: updated.bhk,
      location: updated.location,
      fullAddress: updated.full_address,
      description: updated.description,
      listingType: updated.listing_type,
      photos: Array.isArray(updated.property_photos) ? updated.property_photos : [],
      commissionTerms: updated.commission_terms,
      scopeOfWork: parseScopeOfWork(updated.scope_of_work),
      owner: {
        name: updated.owner_name ?? null,
        phone: updated.owner_phone ?? null,
        email: null,
      },
      broker,
      ownerApprovalStatus: updated.approval_status,
      isPubliclyVisible: updated.public_property,
      lat: updated.latitude,
      lng: updated.longitude,
      createdAt: updated.created_at,
      updatedAt: updated.updated_at,
      ownerConsentSms: {
        status: smsStatus,
        error: smsError,
      },
    };

    return NextResponse.json(payload, { status: 200 });
  } catch (err: any) {
    console.error("[PUT /api/properties/:id] Unexpected error:", err);
    return NextResponse.json({ message: err?.message || "Unexpected error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ propertyId: string }> }) {
  const params = await context.params;
  const propertyId = params?.propertyId;
  if (!propertyId) {
    return NextResponse.json({ message: "Property id missing" }, { status: 400 });
  }

  const userId = await getUserFromCookie(req);
  if (!userId) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  }

  const { data: existingProperty, error: fetchError } = await adminSupabase
    .from("properties")
    .select("property_id, id")
    .eq("property_id", propertyId)
    .maybeSingle();

  if (fetchError) {
    console.error("[DELETE /api/properties/:id] Supabase fetch error:", fetchError);
    return NextResponse.json({ message: "Failed to load property" }, { status: 500 });
  }

  if (!existingProperty) {
    return NextResponse.json({ message: "Property not found" }, { status: 404 });
  }

  if (existingProperty.id !== userId) {
    return NextResponse.json({ message: "You do not have permission to delete this property." }, { status: 403 });
  }

  const { error: deleteError } = await adminSupabase
    .from("properties")
    .delete()
    .eq("property_id", propertyId);

  if (deleteError) {
    console.error("[DELETE /api/properties/:id] Supabase delete error:", deleteError);
    return NextResponse.json({ message: "Failed to delete property" }, { status: 500 });
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
