// app/edit-profile/page.tsx
"use client";

import { useEffect, useState, FormEvent, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import FileUpload from "@/components/ui/file-upload";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

/**
 * Uses NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY on client side.
 */
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
  const { updateUser } = useAuth();
  const updateUserRef = useRef(updateUser);

  useEffect(() => {
    updateUserRef.current = updateUser;
  }, [updateUser]);

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

  const [profilePhotoData, setProfilePhotoData] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const initialFormRef = useRef(form);
  const initialPhotoRef = useRef<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const response = await fetch("/api/auth/me", { credentials: "include" });
        if (!response.ok) {
          if (active) {
            setProfile(null);
            setUserId(null);
          }
          return;
        }
        const payload = await response.json();
        if (!active) return;
        const profData = payload.user as ProfileRow;
        setProfile(profData);
        setUserId(profData.id);
        const nextForm = {
          name: profData.name ?? "",
          email: profData.email ?? "",
          agencyName: profData.agency_name ?? "",
          reraId: profData.rera_id ?? "",
          website: profData.website ?? "",
          city: profData.city ?? "",
          experience: profData.experience ?? "",
          bio: profData.bio ?? "",
          areaOfExpertise: Array.isArray(profData.area_of_expertise)
            ? profData.area_of_expertise.join(", ")
            : (profData.area_of_expertise ?? "").toString(),
          workingRegions: Array.isArray(profData.working_regions)
            ? profData.working_regions.join(", ")
            : (profData.working_regions ?? "").toString(),
        };
        setForm(nextForm);
        initialFormRef.current = nextForm;
        updateUserRef.current(payload.user);
        const initialPhoto = profData.profile_photo_url ?? "";
        setProfilePhotoData(initialPhoto);
        initialPhotoRef.current = initialPhoto;
      } catch (err) {
        console.error(err);
      } finally {
        if (active) {
          setInitialLoaded(true);
        }
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const handleInput = (field: string, value: string) => setForm((p) => ({ ...p, [field]: value }));

  const fileToDataUrl = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handlePhotoChange = async (files: File[]) => {
    const file = files[0];
    if (!file) {
      const fallback = initialPhotoRef.current;
      setProfilePhotoData(fallback);
      return;
    }
    try {
      const dataUrl = await fileToDataUrl(file);
      setProfilePhotoData(dataUrl);
    } catch (err) {
      console.error("Failed to encode profile photo", err);
      toast({ title: "Upload failed", description: "Unable to process the selected photo." });
    }
  };

  const handleSubmit = async (e?: FormEvent) => {
    e?.preventDefault();
    setSaving(true);

    try {
      const diffPayload: Record<string, unknown> = {};

      const pushIfChanged = (field: keyof typeof form, value: string) => {
        if ((initialFormRef.current?.[field] ?? "") !== value) {
          diffPayload[field === "agencyName" ? "agencyName" : field] = value;
        }
      };

      pushIfChanged("name", form.name);
      pushIfChanged("email", form.email);
      pushIfChanged("agencyName", form.agencyName);
      pushIfChanged("reraId", form.reraId);
      pushIfChanged("website", form.website);
      pushIfChanged("city", form.city);
      pushIfChanged("experience", form.experience);
      pushIfChanged("bio", form.bio);

      if ((initialFormRef.current?.areaOfExpertise ?? "") !== form.areaOfExpertise) {
        diffPayload.areaOfExpertise = form.areaOfExpertise
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      }

      if ((initialFormRef.current?.workingRegions ?? "") !== form.workingRegions) {
        diffPayload.workingRegions = form.workingRegions
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      }

      if (profilePhotoData !== undefined && profilePhotoData !== initialPhotoRef.current) {
        diffPayload.profilePhotoUrl = profilePhotoData;
      }

      if (Object.keys(diffPayload).length === 0) {
        toast({ title: "No changes", description: "Update a field before saving." });
        setSaving(false);
        return;
      }

      // get current session to retrieve access token for server verification
      if (!userId) {
        throw new Error("Not authenticated");
      }

      const res = await fetch("/api/profile/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(diffPayload),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to update profile");
      }

      const data = await res.json();
      if (data?.user) {
        setProfile(data.user);
        updateUser(data.user);
        initialFormRef.current = form;
      }

      toast({ title: "Profile updated", description: "Your profile has been saved." });
      router.push("/profile");
    } catch (error) {
      console.error(error);
      toast({
        title: "Update failed",
        description: error instanceof Error ? error.message : "Failed to update",
        variant: "destructive",
      });
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
        {!initialLoaded && (
          <div className="text-center py-8 text-sm text-neutral-500">Loading profile…</div>
        )}

        {initialLoaded && !profile && (
          <Card>
            <CardContent className="py-6 text-center space-y-3">
              <p className="text-sm text-neutral-600">Sign in to populate your profile details.</p>
              <Button variant="outline" onClick={() => router.push("/login")}>
                Go to login
              </Button>
            </CardContent>
          </Card>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label>Profile Photo</Label>
                  <FileUpload onFilesChange={handlePhotoChange} maxFiles={1} />
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
