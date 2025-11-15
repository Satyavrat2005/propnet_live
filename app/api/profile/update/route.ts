// app/api/profile/update/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifySession } from "@/lib/auth/session";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Supabase env vars missing!");
}

// server-side supabase (service role)
const supabaseServer = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

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

    const body = await req.json();

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
    } = body;

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
    if (Array.isArray(areaOfExpertise)) updateObj.area_of_expertise = areaOfExpertise;
    if (Array.isArray(workingRegions)) updateObj.working_regions = workingRegions;
    if (profilePhotoUrl !== undefined) updateObj.profile_photo_url = profilePhotoUrl;

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

    // return cleaned row
    return NextResponse.json({ user: data }, { status: 200 });
  } catch (err) {
    console.error("profile update route error", err);
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
