// app/api/profile/update/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Supabase env vars missing!");
}

// server-side supabase (service role)
const supabaseServer = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

export async function POST(req: Request) {
  try {
    // read auth header
    const auth = req.headers.get("authorization") || "";
    const token = auth.startsWith("Bearer ") ? auth.split(" ")[1] : null;
    if (!token) {
      return NextResponse.json({ error: "Missing Authorization token" }, { status: 401 });
    }

    // verify token and get user
    const {
      data: { user },
      error: userErr,
    } = await supabaseServer.auth.getUser(token);
    if (userErr || !user) {
      console.error("auth.getUser error", userErr);
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
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
      agencyLogoUrl,
    } = body;

    // Build update object
    const updateObj: any = {
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
    if (agencyLogoUrl !== undefined) updateObj.agency_logo_url = agencyLogoUrl;

    // update row where id == user.id
    const { data, error } = await supabaseServer
      .from("profiles")
      .update(updateObj)
      .eq("id", user.id)
      .select()
      .single();

    if (error) {
      console.error("update profiles error", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // return cleaned row
    return NextResponse.json({ user: data }, { status: 200 });
  } catch (err: any) {
    console.error("profile update route error", err);
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}
