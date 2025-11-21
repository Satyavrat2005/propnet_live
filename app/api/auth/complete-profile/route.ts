// app/api/auth/complete-profile/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifySession } from "@/lib/auth/session";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const imgbbApiKey = process.env.IMGBB_API_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.warn("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env");
}
if (!imgbbApiKey) {
  console.warn("Missing IMGBB_API_KEY in env");
}

const supabase = (supabaseUrl && supabaseServiceRoleKey)
  ? createClient(supabaseUrl, supabaseServiceRoleKey)
  : null;

/**
 * Helper: convert File (formData entry) to base64 string
 */
async function fileToBase64(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  return buffer.toString("base64");
}

/**
 * Helper: normalize phone to E.164 format (with + prefix)
 */
function normalizePhoneToE164(raw: string): string {
  const s = (raw || "").trim();
  if (!s) return s;
  if (s.startsWith("+")) return s; // already E.164
  const digits = s.replace(/\D/g, "");
  // Default to +91 if no country code provided
  return `+91${digits}`;
}

export async function POST(req: Request) {
  // Return early if Supabase is not configured
  if (!supabase) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 503 }
    );
  }

  try {
    // Read session cookie to get user's phone
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
    const sessionToken = cookies["session"] ?? null;

    if (!sessionToken) {
      return NextResponse.json(
        { error: "Unauthorized - no session found" },
        { status: 401 }
      );
    }

    // Verify session and get user data
    let sessionData;
    try {
      sessionData = await verifySession(sessionToken);
    } catch (err) {
      return NextResponse.json(
        { error: "Invalid or expired session" },
        { status: 401 }
      );
    }

    const phone = sessionData.phone; // Get phone from session
    // Support both old format (id) and new format (sub)
    const userId = (sessionData as any).sub || (sessionData as any).id;

    if (!phone) {
      return NextResponse.json(
        { error: "No phone number found in session" },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: "No user ID found in session" },
        { status: 400 }
      );
    }

    const formData = await req.formData();

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

    // Check existing profile status to avoid overwriting approved status
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("status, password, profile_photo_url")
      .eq("id", userId)
      .maybeSingle();
    
    if (!existingProfile) {
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 }
      );
    }

    // Keep existing status if approved, otherwise set to pending
    const existingStatus = existingProfile.status === "approved" ? "approved" : "pending";

    // Prepare payload to UPDATE the existing profile (using user ID, not phone)
    const updateData: any = {
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
      profile_photo_url: profilePhotoUrl || existingProfile.profile_photo_url || null,
      profile_complete: true,
      status: existingStatus,
      updated_at: new Date().toISOString(),
    };

    if (!supabase) {
      return NextResponse.json({ error: "Server misconfiguration: missing Supabase credentials" }, { status: 500 });
    }

    // UPDATE the existing profile by ID (not upsert, to avoid creating duplicates)
    const { data: updated, error: updateErr } = await supabase
      .from("profiles")
      .update(updateData)
      .eq("id", userId)
      .select()
      .single();

    if (updateErr) {
      console.error("Supabase update error in complete-profile:", updateErr);
      return NextResponse.json({ error: "Failed to save profile" }, { status: 500 });
    }

    const responseProfile = updated
      ? { ...updated, profilePhoto: updated.profile_photo_url }
      : updated;
    return NextResponse.json({ success: true, profile: responseProfile });
  } catch (err: any) {
    console.error("Unexpected error in /api/auth/complete-profile:", err);
    return NextResponse.json({ error: err?.message || "Failed to complete profile" }, { status: 500 });
  }
}
