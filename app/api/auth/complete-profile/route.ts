// app/api/auth/complete-profile/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const imgbbApiKey = process.env.IMGBB_API_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.warn("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env");
}
if (!imgbbApiKey) {
  console.warn("Missing IMGBB_API_KEY in env");
}

const supabase = createClient(supabaseUrl ?? "", supabaseServiceRoleKey ?? "");

/**
 * Helper: convert File (formData entry) to base64 string
 */
async function fileToBase64(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  return buffer.toString("base64");
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    // read phone from cookie if present (propnet_phone)
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
    const phone = phoneFromCookie ?? (phoneField ? String(phoneField).replace(/\D/g, "") : null);

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

    // parse arrays (they may be JSON strings)
    try {
      if (areaOfExpertiseRaw) {
        areaOfExpertise = areaOfExpertiseRaw.trim().startsWith("[")
          ? JSON.parse(areaOfExpertiseRaw)
          : JSON.parse(areaOfExpertiseRaw);
      }
    } catch {
      if (areaOfExpertiseRaw) {
        areaOfExpertise = areaOfExpertiseRaw.split(",").map(s => s.trim()).filter(Boolean);
      }
    }

    try {
      if (workingRegionsRaw) {
        workingRegions = workingRegionsRaw.trim().startsWith("[")
          ? JSON.parse(workingRegionsRaw)
          : workingRegionsRaw.split(",").map(s => s.trim()).filter(Boolean);
      }
    } catch {
      if (workingRegionsRaw) {
        workingRegions = workingRegionsRaw.split(",").map(s => s.trim()).filter(Boolean);
      }
    }

    // handle profile photo - upload to imgbb if provided
    let profilePhotoUrl: string | null = null;
    const profilePhotoFile = formData.get("profilePhoto") as File | null;

    if (profilePhotoFile && profilePhotoFile.size > 0) {
      if (!imgbbApiKey) {
        return NextResponse.json({ error: "Image upload not configured (missing IMGBB_API_KEY)" }, { status: 500 });
      }

      // convert file to base64
      const base64 = await fileToBase64(profilePhotoFile);

      // upload to imgbb
      const uploadForm = new FormData();
      uploadForm.append("key", imgbbApiKey);
      uploadForm.append("image", base64);

      const imgbbRes = await fetch("https://api.imgbb.com/1/upload", {
        method: "POST",
        body: uploadForm,
      });

      const imgbbJson = await imgbbRes.json();
      if (!imgbbRes.ok || !imgbbJson || !imgbbJson.data || !imgbbJson.data.url) {
        console.error("imgbb upload failed", imgbbJson);
        return NextResponse.json({ error: "Failed to upload image to imgbb" }, { status: 500 });
      }

      profilePhotoUrl = imgbbJson.data.url;
    }

    // Prepare payload to upsert into profiles
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
      area_of_expertise: areaOfExpertise.length ? areaOfExpertise : null,
      working_regions: workingRegions.length ? workingRegions : null,
      profile_photo_url: profilePhotoUrl,
      profile_complete: true,
      updated_at: new Date().toISOString(),
    };

    if (!supabase) {
      return NextResponse.json({ error: "Server misconfiguration: missing Supabase credentials" }, { status: 500 });
    }

    if (row.phone) {
      // upsert by phone
      const { data: upserted, error: upsertErr } = await supabase
        .from("profiles")
        .upsert(row, { onConflict: "phone" })
        .select()
        .single();

      if (upsertErr) {
        console.error("Supabase upsert error in complete-profile:", upsertErr);
        return NextResponse.json({ error: "Failed to save profile" }, { status: 500 });
      }

      return NextResponse.json({ success: true, profile: upserted });
    } else {
      // insert new
      const { data: inserted, error: insertErr } = await supabase
        .from("profiles")
        .insert(row)
        .select()
        .single();

      if (insertErr) {
        console.error("Supabase insert error in complete-profile:", insertErr);
        return NextResponse.json({ error: "Failed to save profile" }, { status: 500 });
      }

      return NextResponse.json({ success: true, profile: inserted });
    }
  } catch (err: any) {
    console.error("Unexpected error in /api/auth/complete-profile:", err);
    return NextResponse.json({ error: err?.message || "Failed to complete profile" }, { status: 500 });
  }
}
