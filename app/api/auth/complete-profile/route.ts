// app/api/auth/complete-profile/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const storageBucket = "profile-photos"; // bucket name - make sure this bucket exists in Supabase Storage

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.warn("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env");
}

const supabase = createClient(supabaseUrl ?? "", supabaseServiceRoleKey ?? "");

/**
 * Helper to convert Blob/ReadableStream to Buffer
 */
async function blobToBuffer(blob: Blob): Promise<Buffer> {
  const arrayBuffer = await blob.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * POST /api/auth/complete-profile
 * Accepts multipart/form-data (FormData) with fields:
 * - phone (optional)       : string
 * - name, email, bio, agencyName, reraId, city, experience, website
 * - areaOfExpertise (JSON string or plain text)
 * - workingRegions (JSON string or plain text)
 * - profilePhoto (file)    : file upload
 *
 * Behavior:
 * - Determine phone in this order: cookie 'propnet_phone' -> form field 'phone' -> null
 * - Upload profilePhoto to Supabase Storage if provided.
 * - Upsert into `profiles` table (match by phone if provided), set profile_complete = true.
 */
export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    // parse cookie for phone
    const cookieHeader = req.headers.get("cookie") || "";
    const cookies = Object.fromEntries(
      cookieHeader
        .split(";")
        .map((c) => c.trim())
        .filter(Boolean)
        .map((c) => {
          const [k, ...v] = c.split("=");
          return [k, decodeURIComponent(v.join("="))];
        })
    );
    const phoneFromCookie = cookies["propnet_phone"] ?? null;

    // form fields
    const phoneField = (formData.get("phone") as string) ?? null;
    const phone = phoneFromCookie ?? (phoneField ? String(phoneField) : null);

    const name = (formData.get("name") as string) ?? null;
    const email = (formData.get("email") as string) ?? null;
    const bio = (formData.get("bio") as string) ?? null;
    const agencyName = (formData.get("agencyName") as string) ?? null;
    const reraId = (formData.get("reraId") as string) ?? null;
    const city = (formData.get("city") as string) ?? null;
    const experience = (formData.get("experience") as string) ?? null;
    const website = (formData.get("website") as string) ?? null;

    const areaOfExpertiseRaw = formData.get("areaOfExpertise") as string | null;
    const workingRegionsRaw = formData.get("workingRegions") as string | null;

    let areaOfExpertise: string[] = [];
    let workingRegions: string[] = [];

    try {
      if (areaOfExpertiseRaw) {
        // It may be JSON string or plain string
        if (areaOfExpertiseRaw.trim().startsWith("[")) {
          areaOfExpertise = JSON.parse(areaOfExpertiseRaw);
        } else {
          // treat as comma-separated or single value
          areaOfExpertise = areaOfExpertiseRaw ? JSON.parse(areaOfExpertiseRaw) : [];
        }
      }
    } catch {
      // fallback: attempt to parse as comma separated
      if (areaOfExpertiseRaw && typeof areaOfExpertiseRaw === "string") {
        areaOfExpertise = areaOfExpertiseRaw.split(",").map(s => s.trim()).filter(Boolean);
      }
    }

    try {
      if (workingRegionsRaw) {
        if (workingRegionsRaw.trim().startsWith("[")) {
          workingRegions = JSON.parse(workingRegionsRaw);
        } else {
          workingRegions = workingRegionsRaw.split(",").map(s => s.trim()).filter(Boolean);
        }
      }
    } catch {
      if (workingRegionsRaw && typeof workingRegionsRaw === "string") {
        workingRegions = workingRegionsRaw.split(",").map(s => s.trim()).filter(Boolean);
      }
    }

    // handle profile photo upload
    let profilePhotoUrl: string | null = null;
    const profilePhotoFile = formData.get("profilePhoto") as File | null;
    if (profilePhotoFile && profilePhotoFile.size > 0) {
      // create filename
      const uniqueId = (typeof crypto !== "undefined" && typeof (crypto as any).randomUUID === "function")
        ? (crypto as any).randomUUID()
        : `${Date.now()}`;

      // determine extension if available
      const fileName = profilePhotoFile.name || `profile-${uniqueId}.jpg`;
      const ext = fileName.includes(".") ? fileName.split(".").pop() : "jpg";
      const filePath = `profiles/${phone ?? uniqueId}.${ext}`;

      // convert blob to buffer
      const buf = await blobToBuffer(profilePhotoFile);

      // upload to Supabase Storage (service role key has permission)
      const { data: uploadData, error: storageError } = await supabase.storage
        .from(storageBucket)
        .upload(filePath, buf, { contentType: profilePhotoFile.type, upsert: true });

      if (storageError) {
        console.error("Supabase storage upload error:", storageError);
        return NextResponse.json({ error: "Failed to upload profile photo" }, { status: 500 });
      }

      // get public URL
      const { data: publicUrlData } = supabase.storage.from(storageBucket).getPublicUrl(filePath);
      profilePhotoUrl = publicUrlData.publicUrl;
    }

    // Prepare row object
    const row: any = {
      phone: phone ? String(phone).replace(/\D/g, "") : null,
      name: name ?? null,
      email: email ?? null,
      bio: bio ?? null,
      agency_name: agencyName ?? null,
      rera_id: reraId ?? null,
      city: city ?? null,
      experience: experience ?? null,
      website: website ?? null,
      area_of_expertise: areaOfExpertise.length > 0 ? areaOfExpertise : null,
      working_regions: workingRegions.length > 0 ? workingRegions : null,
      profile_photo_url: profilePhotoUrl,
      profile_complete: true,
      updated_at: new Date().toISOString(),
    };

    // Upsert logic:
    // If phone is provided, upsert by phone; otherwise insert new row.
    if (row.phone) {
      const { data: upserted, error: upsertErr } = await supabase
        .from("profiles")
        .upsert(row, { onConflict: "phone" })
        .select()
        .single();

      if (upsertErr) {
        console.error("Supabase upsert error:", upsertErr);
        return NextResponse.json({ error: "Failed to save profile" }, { status: 500 });
      }

      return NextResponse.json({ success: true, profile: upserted });
    } else {
      // insert
      const { data: inserted, error: insertErr } = await supabase
        .from("profiles")
        .insert(row)
        .select()
        .single();

      if (insertErr) {
        console.error("Supabase insert error:", insertErr);
        return NextResponse.json({ error: "Failed to save profile" }, { status: 500 });
      }

      return NextResponse.json({ success: true, profile: inserted });
    }
  } catch (err: any) {
    console.error("Unexpected error in /api/auth/complete-profile:", err);
    return NextResponse.json({ error: err?.message || "Failed to complete profile" }, { status: 500 });
  }
}
