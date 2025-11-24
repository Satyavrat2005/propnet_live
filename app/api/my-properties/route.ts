export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";
import { verifySession, getUserIdFromSession } from "@/lib/auth/session";
import { sendSms } from "@/lib/twilio";
import { buildOwnerConsentSms } from "@/lib/ownerConsentSms";
import { parseAddressWithGemini } from "@/lib/gemini-address-parser";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const adminSupabase = process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  : supabase;

function normalizePhone(raw: FormDataEntryValue | null): string | null {
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

function normalizePhoneList(raw: FormDataEntryValue | null): string[] {
  if (!raw) return [];
  const sanitized = String(raw).replace(/[\r\n;/|]+/g, ",");
  const parts = sanitized
    .split(",")
    .map((part) => normalizePhone(part))
    .filter((value): value is string => Boolean(value));

  return Array.from(new Set(parts));
}

function parseScopeOfWork(value: any): string[] | null {
  if (!value) return null;
  if (Array.isArray(value)) return value.filter(Boolean);
  try {
    const parsed = JSON.parse(String(value));
    return Array.isArray(parsed) ? parsed.filter(Boolean) : null;
  } catch {
    if (typeof value === "string") {
      return value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    }
    return null;
  }
}

function escapeForILike(value: string): string {
  return value.replace(/([\\%_])/g, "\\$1");
}

function buildContainsPattern(value: string): string {
  return `%${escapeForILike(value)}%`;
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

async function geocodeAddress(input: string) {
  const res = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
      input
    )}&key=${process.env.GOOGLE_MAPS_API_KEY}`,
    { cache: "no-store" }
  );
  const data = await res.json();
  if (data.status !== "OK" || !data.results?.length) {
    throw new Error("Geocoding failed");
  }
  const best = data.results[0];
  return {
    lat: best.geometry.location.lat as number,
    lng: best.geometry.location.lng as number,
    formatted_address: best.formatted_address as string,
  };
}

async function fileToBase64(file: File): Promise<string> {
  const ab = await file.arrayBuffer();
  // @ts-ignore
  if (typeof Buffer !== "undefined") {
    // @ts-ignore
    return Buffer.from(ab).toString("base64");
  }
  let binary = "";
  const chunk = 0x8000;
  const bytes = new Uint8Array(ab);
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk) as any);
  }
  // @ts-ignore
  return btoa(binary);
}

async function uploadToImgBB(file: File): Promise<string> {
  const apiKey = process.env.IMGBB_API_KEY;
  if (!apiKey) throw new Error("IMGBB_API_KEY is missing");
  const base64 = await fileToBase64(file);

  const body = new FormData();
  body.append("key", apiKey);
  body.append("image", base64);
  const filename = (file as any).name || `property_${Date.now()}`;
  body.append("name", filename);

  const res = await fetch("https://api.imgbb.com/1/upload", { method: "POST", body });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`ImgBB upload failed (${res.status}): ${text}`);
  }
  const json = await res.json();
  const url: string = json?.data?.display_url || json?.data?.url;
  if (!url) throw new Error("ImgBB did not return a URL");
  return url;
}

export async function GET(req: NextRequest) {
  try {
    const userId = await getUserFromCookie(req);
    if (!userId) return NextResponse.json([], { status: 200 });

    const { data, error } = await supabase
      .from("properties")
      .select(`
        property_id,
        id,
        property_title,
        property_type,
        transaction_type,
        bhk,
        area,
        area_unit,
        sale_price,
        location,
        full_address,
        flat_number,
        floor,
        building_society,
        description,
        property_photos,
        listing_type,
        public_property,
        latitude,
        longitude,
        owner_name,
        owner_phone,
        commission_terms,
        scope_of_work,
        agreement_document,
        approval_status,
        created_at,
        updated_at,
        expires_at
      `)
      .eq("id", userId)
      .gte("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false });

    if (error) return NextResponse.json({ message: error.message }, { status: 500 });

    const mapped = (data || []).map((r) => ({
      id: r.property_id,
      userId: r.id,
      title: r.property_title,
      propertyType: r.property_type,
      transactionType: r.transaction_type,
      bhk: r.bhk,
      size: r.area,
      sizeUnit: r.area_unit,
      price: r.sale_price,
      location: r.location,
      fullAddress: r.full_address,
      flatNumber: r.flat_number,
      floorNumber: r.floor,
      buildingSociety: r.building_society,
      description: r.description,
      photos: r.property_photos,
      listingType: r.listing_type,
      isPubliclyVisible: r.public_property,
      lat: r.latitude,
      lng: r.longitude,
      ownerName: r.owner_name,
      ownerPhone: r.owner_phone,
      commissionTerms: r.commission_terms,
    scopeOfWork: parseScopeOfWork(r.scope_of_work),
      agreementDocument: r.agreement_document,
      ownerApprovalStatus: r.approval_status,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      expiresAt: r.expires_at,
    }));

    return NextResponse.json(mapped, { status: 200 });
  } catch (e: any) {
    console.error("[GET /api/my-properties] ", e);
    return NextResponse.json({ message: e?.message || "Unexpected error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserFromCookie(req);
    if (!userId) return NextResponse.json({ message: "Not authenticated" }, { status: 401 });

    const form = await req.formData();
    const scopeOfWorkRaw = form.get("scopeOfWork");
    const ownerPhoneInput = form.get("ownerPhone");
    const ownerPhoneStored = ownerPhoneInput ? String(ownerPhoneInput).trim() : null;
    const ownerPhonesE164 = normalizePhoneList(ownerPhoneInput);

    const photoFiles: File[] = form.getAll("photos").filter(Boolean) as File[];
    if (photoFiles.length > 10) {
      return NextResponse.json({ message: "You can upload a maximum of 10 photos." }, { status: 400 });
    }

    const fullAddress = (form.get("fullAddress") || "").toString().trim();
    const ownerName = (form.get("ownerName") || "").toString().trim();
    const listingTypeInput = (form.get("listingType") || "").toString().trim();

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

    const addressForGeocode = fullAddress || [buildingSociety, location].filter(Boolean).join(", ");

    const hasDuplicateKeyValues = Boolean(
      flatNumber &&
        floorNumber &&
        buildingSociety &&
        ownerName &&
        ownerPhoneStored
    );

    if (hasDuplicateKeyValues) {
      const { data: duplicateCandidates, error: duplicateError } = await supabase
        .from("properties")
        .select("property_id")
        .eq("id", userId)
        .eq("owner_phone", ownerPhoneStored!)
        .ilike("flat_number", escapeForILike(flatNumber))
        .ilike("floor", escapeForILike(floorNumber))
        .ilike("building_society", escapeForILike(buildingSociety))
        .ilike("owner_name", escapeForILike(ownerName))
        .limit(1);

      if (duplicateError) {
        console.error("Duplicate property lookup failed", duplicateError);
        return NextResponse.json({ message: "Unable to validate property uniqueness." }, { status: 500 });
      }

      if (duplicateCandidates && duplicateCandidates.length > 0) {
        return NextResponse.json(
          {
            message: "You have already added this property. Please update the existing listing instead.",
          },
          { status: 409 }
        );
      }
    }

    const exclusivePatterns: Array<{ column: string; pattern: string }> = [];
    if (fullAddress) exclusivePatterns.push({ column: "full_address", pattern: buildContainsPattern(fullAddress) });
    if (buildingSociety) exclusivePatterns.push({ column: "building_society", pattern: buildContainsPattern(buildingSociety) });
    if (!fullAddress && location)
      exclusivePatterns.push({ column: "location", pattern: buildContainsPattern(location) });

    let exclusiveConflictDetected = false;
    for (const { column, pattern } of exclusivePatterns) {
      const { data: exclusiveMatches, error: exclusiveError } = await supabase
        .from("properties")
        .select("property_id, id")
        .eq("listing_type", "exclusive")
        .ilike(column, pattern)
        .limit(5);

      if (exclusiveError) {
        console.error("Exclusive listing lookup failed", exclusiveError);
        return NextResponse.json({ message: "Unable to verify exclusive listings." }, { status: 500 });
      }

      if (exclusiveMatches?.length) {
        const conflictingRow = exclusiveMatches.find((row) => !row.id || row.id !== userId);
        if (conflictingRow) {
          exclusiveConflictDetected = true;
          break;
        }
      }
    }

    if (exclusiveConflictDetected) {
      return NextResponse.json(
        {
          message:
            "This address is already listed exclusively by another broker. Please collaborate instead of creating a new listing.",
        },
        { status: 409 }
      );
    }

    let lat: number | null = null;
    let lng: number | null = null;
    let formatted: string | null = fullAddress || null;

    if (addressForGeocode) {
      try {
        const g = await geocodeAddress(addressForGeocode);
        lat = g.lat;
        lng = g.lng;
        formatted = g.formatted_address;
      } catch (geErr: any) {
        console.warn("Geocoding warning:", geErr?.message || geErr);
      }
    }

    const photoUrls: string[] = [];
    for (const file of photoFiles) {
      if (!file || file.size === 0) continue;
      const url = await uploadToImgBB(file);
      photoUrls.push(url);
    }

    const payload: any = {
      id: userId,
      property_title: form.get("title"),
      property_type: form.get("propertyType"),
      transaction_type: form.get("transactionType"),
      bhk: form.get("bhk") ? Number(form.get("bhk")) : null,
      area: form.get("size") ? Number(form.get("size")) : null,
      area_unit: form.get("sizeUnit"),
      sale_price: form.get("price"),
      location,
      full_address: formatted || fullAddress || null,
      flat_number: flatNumber || null,
      floor: floorNumber || null,
      building_society: buildingSociety || null,
      description: form.get("description"),
      property_photos: photoUrls.length ? photoUrls : null,
      listing_type: listingTypeInput || null,
      public_property: String(form.get("isPubliclyVisible")) === "true",
      latitude: lat,
      longitude: lng,
      owner_name: ownerName || null,
      owner_phone: ownerPhoneStored,
      commission_terms: form.get("commissionTerms"),
      scope_of_work: scopeOfWorkRaw ? String(scopeOfWorkRaw) : null,
      agreement_document: null,
      approval_status: "pending",
    };

    const { data, error } = await supabase
      .from("properties")
      .insert([payload])
      .select(`
        property_id,
        id,
        property_title,
        property_type,
        transaction_type,
        bhk,
        area,
        area_unit,
        sale_price,
        location,
        full_address,
        flat_number,
        floor,
        building_society,
        description,
        property_photos,
        listing_type,
        public_property,
        latitude,
        longitude,
        owner_name,
        owner_phone,
        commission_terms,
        scope_of_work,
        agreement_document,
        approval_status,
        created_at,
        updated_at,
        expires_at
      `)
      .single();

    if (error) {
      console.error("Supabase insert error:", error);
      return NextResponse.json({ message: `Database error: ${error.message}` }, { status: 500 });
    }

    const mapped: Record<string, any> = {
      id: data.property_id,
      userId: data.id,
      title: data.property_title,
      propertyType: data.property_type,
      transactionType: data.transaction_type,
      bhk: data.bhk,
      size: data.area,
      sizeUnit: data.area_unit,
      price: data.sale_price,
      location: data.location,
      fullAddress: data.full_address,
      flatNumber: data.flat_number,
      floorNumber: data.floor,
      buildingSociety: data.building_society,
      description: data.description,
      photos: data.property_photos,
      listingType: data.listing_type,
      isPubliclyVisible: data.public_property,
      lat: data.latitude,
      lng: data.longitude,
      ownerName: data.owner_name,
      ownerPhone: data.owner_phone,
      commissionTerms: data.commission_terms,
  scopeOfWork: parseScopeOfWork(data.scope_of_work),
      agreementDocument: data.agreement_document,
      ownerApprovalStatus: data.approval_status,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      expiresAt: data.expires_at,
    };

    let ownerConsentToken: string | null = null;
    let ownerConsentUrl: string | null = null;
    let smsStatus: "sent" | "failed" | "skipped" = "skipped";
    let smsError: string | null = null;

    try {
      const nowIso = new Date().toISOString();
      const generatedToken = randomUUID();

      const { data: consentRow, error: consentError } = await adminSupabase
        .from("properties")
        .update({
          owner_consent_token: generatedToken,
          owner_consent_sent_at: nowIso,
        })
        .eq("property_id", data.property_id)
        .select("owner_consent_token, owner_consent_sent_at, approval_status")
        .single();

      if (consentError) {
        console.error("Consent token update error:", consentError);
        ownerConsentToken = generatedToken;
      } else {
        ownerConsentToken = consentRow?.owner_consent_token ?? generatedToken;
        mapped.ownerApprovalStatus = consentRow?.approval_status ?? mapped.ownerApprovalStatus;
        mapped.ownerConsentSentAt = consentRow?.owner_consent_sent_at ?? nowIso;
      }

      if (ownerConsentToken) {
        ownerConsentUrl = `${getAppBaseUrl(req)}/consent/${ownerConsentToken}`;

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
            .select("name, agency_name, phone")
            .eq("id", userId)
            .single();

          const agentName = agentProfile?.name || "Your agent";
          const smsBody = buildOwnerConsentSms({
            ownerName: mapped.ownerName,
            agentName,
            propertyTitle: mapped.title,
            location: mapped.location,
            propertyType: mapped.propertyType,
            bhk: mapped.bhk,
            size: mapped.size,
            sizeUnit: mapped.sizeUnit,
            price: mapped.price,
            listingType: mapped.listingType ? mapped.listingType.toString() : undefined,
            ownerConsentUrl,
          });

          try {
            await sendSms({ to: ownerPhonesE164, body: smsBody });
            smsStatus = "sent";
          } catch (smsErr: any) {
            smsStatus = "failed";
            smsError = smsErr?.message || "Failed to send SMS";
            console.error("Twilio SMS error:", smsErr);
          }
        }
      }
    } catch (consentErr: any) {
      console.error("Owner consent setup error:", consentErr);
      smsStatus = "failed";
      if (!smsError) smsError = consentErr?.message || "Failed to prepare owner consent";
    }

    const responsePayload = {
      ...mapped,
      ownerConsent: {
        token: ownerConsentToken,
        url: ownerConsentUrl,
        smsStatus,
        smsError,
      },
    };

    return NextResponse.json(responsePayload, { status: 201 });
  } catch (e: any) {
    console.error("[POST /api/my-properties] ", e);
    return NextResponse.json({ message: e?.message || "Unexpected error" }, { status: 500 });
  }
}