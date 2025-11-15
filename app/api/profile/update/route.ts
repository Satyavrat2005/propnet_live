// app/api/profile/update/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifySession } from "@/lib/auth/session";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const IMGBB_API_KEY = process.env.IMGBB_API_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Supabase env vars missing!");
}

// server-side supabase (service role)
const supabaseServer = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

async function fileToBase64(file: Blob): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  return buffer.toString("base64");
}

async function uploadProfilePhoto(file: File): Promise<string> {
  if (!IMGBB_API_KEY) {
    throw new Error("Image upload not configured");
  }

  const uploadForm = new FormData();
  uploadForm.append("key", IMGBB_API_KEY);
  uploadForm.append("image", await fileToBase64(file));

  const response = await fetch("https://api.imgbb.com/1/upload", {
    method: "POST",
    body: uploadForm,
  });

  const payload = await response.json();
  if (!response.ok || !payload?.data?.url) {
    console.error("imgbb upload failed", payload);
    throw new Error("Failed to upload image");
  }

  return payload.data.url as string;
}

function normalizeStringArray(value: unknown): string[] | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === "string") {
    if (!value.trim()) return null;
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.filter(Boolean);
      }
    } catch {
      // fall through to comma parsing
    }
    return value
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return undefined;
}

export async function POST(req: NextRequest) {
  try {
    const sessionCookie = req.cookies.get("session")?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    let userId: string;
    try {
      const payload = await verifySession(sessionCookie);
      userId = String(payload.sub);
    } catch {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const contentType = req.headers.get("content-type") || "";
    const isMultipart = contentType.includes("multipart/form-data");

    let parsedBody: Record<string, unknown> = {};
    let profilePhotoFile: File | null = null;

    if (isMultipart) {
      const formData = await req.formData();
      for (const [key, value] of formData.entries()) {
        if (key === "profilePhoto" && value instanceof File) {
          profilePhotoFile = value;
          continue;
        }
        parsedBody[key] = value;
      }
    } else {
      parsedBody = await req.json();
    }

    const {
      name,
      email,
      agencyName,
      reraId,
      website,
      city,
      experience,
      bio,
      areaOfExpertise,
      workingRegions,
      profilePhotoUrl,
      profilePhoto,
    } = parsedBody;

    // Build update object
    const updateObj: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (name !== undefined) updateObj.name = name;
    if (email !== undefined) updateObj.email = email;
    if (agencyName !== undefined) updateObj.agency_name = agencyName;
    if (reraId !== undefined) updateObj.rera_id = reraId;
    if (website !== undefined) updateObj.website = website;
    if (city !== undefined) updateObj.city = city;
    if (experience !== undefined) updateObj.experience = experience;
    if (bio !== undefined) updateObj.bio = bio;
    const normalizedExpertise = normalizeStringArray(areaOfExpertise);
    if (normalizedExpertise !== undefined) {
      updateObj.area_of_expertise = normalizedExpertise?.length ? normalizedExpertise : null;
    }

    const normalizedRegions = normalizeStringArray(workingRegions);
    if (normalizedRegions !== undefined) {
      updateObj.working_regions = normalizedRegions?.length ? normalizedRegions : null;
    }

    let normalizedPhotoUrl: string | null | undefined = undefined;
    if (profilePhotoUrl !== undefined) {
      if (typeof profilePhotoUrl === "string" && profilePhotoUrl.trim()) {
        normalizedPhotoUrl = profilePhotoUrl.trim();
      } else if (profilePhotoUrl === null || profilePhotoUrl === "") {
        normalizedPhotoUrl = null;
      }
    } else if (profilePhoto !== undefined) {
      if (typeof profilePhoto === "string" && profilePhoto.trim()) {
        normalizedPhotoUrl = profilePhoto.trim();
      } else if (profilePhoto === null || profilePhoto === "") {
        normalizedPhotoUrl = null;
      }
    }

    if (profilePhotoFile && profilePhotoFile.size > 0) {
      normalizedPhotoUrl = await uploadProfilePhoto(profilePhotoFile);
    }

    if (normalizedPhotoUrl !== undefined) {
      updateObj.profile_photo_url = normalizedPhotoUrl;
    }

    // update row where id == user.id
    const { data, error } = await supabaseServer
      .from("profiles")
      .update(updateObj)
      .eq("id", userId)
      .select()
      .single();

    if (error) {
      console.error("update profiles error", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const responseUser = data ? { ...data, profilePhoto: data.profile_photo_url } : data;
    return NextResponse.json({ user: responseUser }, { status: 200 });
  } catch (err) {
    console.error("profile update route error", err);
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
