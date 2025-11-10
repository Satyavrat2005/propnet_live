export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifySession } from "@/lib/auth/session";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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
        updated_at
      `)
      .eq("id", userId)
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
      scopeOfWork: r.scope_of_work,
      agreementDocument: r.agreement_document,
      ownerApprovalStatus: r.approval_status,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
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

    const photoFiles: File[] = form.getAll("photos").filter(Boolean) as File[];
    if (photoFiles.length > 10) {
      return NextResponse.json({ message: "You can upload a maximum of 10 photos." }, { status: 400 });
    }

    const fullAddress = (form.get("fullAddress") || "").toString().trim();
    const buildingSociety = (form.get("buildingSociety") || "").toString().trim();
    const location = (form.get("location") || "").toString().trim();
    const addressForGeocode = fullAddress || [buildingSociety, location].filter(Boolean).join(", ");

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
      flat_number: form.get("flatNumber"),
      floor: form.get("floorNumber"),
      building_society: buildingSociety || null,
      description: form.get("description"),
      property_photos: photoUrls.length ? photoUrls : null,
      listing_type: form.get("listingType"),
      public_property: String(form.get("isPubliclyVisible")) === "true",
      latitude: lat,
      longitude: lng,
      owner_name: form.get("ownerName"),
      owner_phone: form.get("ownerPhone"),
      commission_terms: form.get("commissionTerms"),
      scope_of_work: form.get("scopeOfWork")?.toString() || null,
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
        updated_at
      `)
      .single();

    if (error) {
      console.error("Supabase insert error:", error);
      return NextResponse.json({ message: `Database error: ${error.message}` }, { status: 500 });
    }

    const mapped = {
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
      scopeOfWork: data.scope_of_work,
      agreementDocument: data.agreement_document,
      ownerApprovalStatus: data.approval_status,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };

    return NextResponse.json(mapped, { status: 201 });
  } catch (e: any) {
    console.error("[POST /api/my-properties] ", e);
    return NextResponse.json({ message: e?.message || "Unexpected error" }, { status: 500 });
  }
}
