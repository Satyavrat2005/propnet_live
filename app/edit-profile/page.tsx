// app/edit-profile/page.tsx
"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { ArrowLeft, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import FileUpload from "@/components/ui/file-upload";
import { useToast } from "@/hooks/use-toast";

/**
 * Uses NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY on client side.
 */
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type ProfileRow = {
  id: string;
  name?: string;
  email?: string;
  agency_name?: string;
  rera_id?: string;
  website?: string;
  city?: string;
  experience?: string;
  bio?: string;
  area_of_expertise?: string[] | null;
  working_regions?: string[] | null;
  profile_photo_url?: string | null;
  created_at?: string;
  updated_at?: string;
};

export default function EditProfile() {
  const router = useRouter();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [initialLoaded, setInitialLoaded] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<ProfileRow | null>(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    agencyName: "",
    reraId: "",
    website: "",
    city: "",
    experience: "",
    bio: "",
    areaOfExpertise: "",
    workingRegions: "",
  });

  const [profilePhotoFile, setProfilePhotoFile] = useState<File | null>(null);
  const [agencyLogoFile, setAgencyLogoFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.access_token) {
          toast({ title: "Not signed in", description: "Please login to edit profile", variant: "destructive" });
          router.push("/login");
          return;
        }
        const uid = session.user.id;
        if (!mounted) return;
        setUserId(uid);

        const { data: profData, error: profErr } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", uid)
          .limit(1)
          .single();

        if (profErr && profErr.code !== "PGRST116") {
          console.error("profile fetch error:", profErr);
        }
        if (mounted && profData) {
          setProfile(profData as ProfileRow);
          setForm({
            name: profData.name ?? "",
            email: profData.email ?? "",
            agencyName: profData.agency_name ?? "",
            reraId: profData.rera_id ?? "",
            website: profData.website ?? "",
            city: profData.city ?? "",
            experience: profData.experience ?? "",
            bio: profData.bio ?? "",
            areaOfExpertise: Array.isArray(profData.area_of_expertise) ? profData.area_of_expertise.join(", ") : (profData.area_of_expertise ?? "").toString(),
            workingRegions: Array.isArray(profData.working_regions) ? profData.working_regions.join(", ") : (profData.working_regions ?? "").toString(),
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (mounted) {
          setLoading(false);
          setInitialLoaded(true);
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const handleInput = (field: string, value: string) => setForm((p) => ({ ...p, [field]: value }));

  // upload file to Supabase Storage `profiles` bucket and return public URL
  const uploadFileToStorage = async (file: File | null, path: string) => {
    if (!file) return null;
    try {
      // ensure bucket exists and is public (you should create it manually in Supabase or use Settings)
      const fileExt = file.name.split(".").pop();
      const filePath = `${path}.${fileExt}`;
      const { data, error } = await supabase.storage.from("profiles").upload(filePath, file, {
        cacheControl: "3600",
        upsert: true,
      });
      if (error) {
        console.error("upload error", error);
        throw error;
      }
      // get public URL
      const { data: urlData } = supabase.storage.from("profiles").getPublicUrl(data.path);
      return urlData.publicUrl;
    } catch (err) {
      console.error("upload exception", err);
      return null;
    }
  };

  const handleSubmit = async (e?: FormEvent) => {
    e?.preventDefault();
    if (!userId) {
      toast({ title: "Not signed in", description: "Please login", variant: "destructive" });
      router.push("/login");
      return;
    }
    setSaving(true);

    try {
      let profilePhotoUrl = profile?.profile_photo_url ?? null;
      let agencyLogoUrl = (profile as any)?.agency_logo_url ?? null;

      // upload files if present
      if (profilePhotoFile) {
        const uploaded = await uploadFileToStorage(profilePhotoFile, `profile-photos/${userId}/profile-photo`);
        if (uploaded) profilePhotoUrl = uploaded;
      }
      if (agencyLogoFile) {
        const uploaded = await uploadFileToStorage(agencyLogoFile, `agency-logos/${userId}/agency-logo`);
        if (uploaded) agencyLogoUrl = uploaded;
      }

      // Prepare payload
      const payload = {
        name: form.name,
        email: form.email,
        agencyName: form.agencyName,
        reraId: form.reraId,
        website: form.website,
        city: form.city,
        experience: form.experience,
        bio: form.bio,
        areaOfExpertise: form.areaOfExpertise.split(",").map((s) => s.trim()).filter(Boolean),
        workingRegions: form.workingRegions.split(",").map((s) => s.trim()).filter(Boolean),
        profilePhotoUrl,
        agencyLogoUrl,
      };

      // get current session to retrieve access token for server verification
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("No session token found");

      const res = await fetch("/api/profile/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to update profile");
      }

      toast({ title: "Profile updated", description: "Your profile has been saved." });
      router.push("/profile");
    } catch (err: any) {
      console.error(err);
      toast({ title: "Update failed", description: err?.message || "Failed to update", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen pb-20">
      <div className="sticky top-0 bg-white border-b border-neutral-100 z-10">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center">
            <button className="text-primary mr-4" onClick={() => router.push("/profile")} type="button">
              <ArrowLeft size={24} />
            </button>
            <h2 className="text-lg font-semibold text-neutral-900">Edit Profile</h2>
          </div>
          <Button onClick={handleSubmit} disabled={saving || !initialLoaded} size="sm" className="flex items-center space-x-2">
            <Save size={16} />
            <span>{saving ? "Saving..." : "Save"}</span>
          </Button>
        </div>
      </div>

      <div className="flex-1 px-6 py-6 space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label>Profile Photo</Label>
                  <FileUpload onFilesChange={(files) => setProfilePhotoFile(files[0] ?? null)} maxFiles={1} />
                  <p className="text-xs text-neutral-500 mt-1">Upload your profile photo (optional)</p>
                </div>
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" value={form.name} onChange={(e) => handleInput("name", e.target.value)} placeholder="Enter your full name" />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" value={form.email} onChange={(e) => handleInput("email", e.target.value)} placeholder="Enter your email address" />
                </div>
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input id="city" value={form.city} onChange={(e) => handleInput("city", e.target.value)} placeholder="Enter your city" />
                </div>
                <div>
                  <Label htmlFor="experience">Experience</Label>
                  <Input id="experience" value={form.experience} onChange={(e) => handleInput("experience", e.target.value)} placeholder="e.g., 5 years" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Agency Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="agencyName">Agency Name</Label>
                <Input id="agencyName" value={form.agencyName} onChange={(e) => handleInput("agencyName", e.target.value)} placeholder="Enter your agency name" />
              </div>
              <div>
                <Label htmlFor="reraId">RERA ID</Label>
                <Input id="reraId" value={form.reraId} onChange={(e) => handleInput("reraId", e.target.value)} placeholder="Enter your RERA registration number" />
              </div>
              <div>
                <Label htmlFor="website">Website</Label>
                <Input id="website" value={form.website} onChange={(e) => handleInput("website", e.target.value)} placeholder="https://yourwebsite.com" />
              </div>
              <div>
                <Label htmlFor="agencyLogo">Agency Logo</Label>
                <FileUpload onFilesChange={(files) => setAgencyLogoFile(files[0] ?? null)} maxFiles={1} />
                <p className="text-xs text-neutral-500 mt-1">Upload your agency logo for property reports and listings</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Professional Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="areaOfExpertise">Area of Expertise</Label>
                <Input id="areaOfExpertise" value={form.areaOfExpertise} onChange={(e) => handleInput("areaOfExpertise", e.target.value)} placeholder="e.g., Residential, Commercial, Luxury Properties" />
                <p className="text-xs text-neutral-500 mt-1">Separate multiple areas with commas</p>
              </div>
              <div>
                <Label htmlFor="workingRegions">Working Regions</Label>
                <Input id="workingRegions" value={form.workingRegions} onChange={(e) => handleInput("workingRegions", e.target.value)} placeholder="e.g., Mumbai, Pune, Delhi" />
                <p className="text-xs text-neutral-500 mt-1">Separate multiple regions with commas</p>
              </div>
              <div>
                <Label htmlFor="bio">Bio</Label>
                <Textarea id="bio" value={form.bio} onChange={(e) => handleInput("bio", e.target.value)} placeholder="Tell us about yourself and your expertise..." rows={4} />
              </div>
            </CardContent>
          </Card>

          <Button type="submit" disabled={saving || !initialLoaded} className="w-full flex items-center justify-center space-x-2" size="lg">
            {saving ? <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> : <Save size={20} />}
            <span>{saving ? "Saving..." : "Save Changes"}</span>
          </Button>
        </form>
      </div>
    </div>
  );
}
