// app/edit-profile/page.tsx
"use client";

import { useEffect, useState, FormEvent, useRef } from "react";
import { useRouter } from "next/navigation";
import { Save, User, Building2, Briefcase, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import {AppLayout} from "@/components/layout/app-layout";
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

  const [profilePhotoPreview, setProfilePhotoPreview] = useState<string | null>(null);
  const [profilePhotoFile, setProfilePhotoFile] = useState<File | null>(null);
  const [fileUploadKey, setFileUploadKey] = useState(0);
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
        const normalizedInitialPhoto = initialPhoto || null;
        setProfilePhotoPreview(normalizedInitialPhoto);
        initialPhotoRef.current = normalizedInitialPhoto;
        setProfilePhotoFile(null);
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
      setProfilePhotoFile(null);
      setProfilePhotoPreview(fallback);
      return;
    }
    try {
      const dataUrl = await fileToDataUrl(file);
      setProfilePhotoFile(file);
      setProfilePhotoPreview(dataUrl);
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

      const photoChanged = !!profilePhotoFile;

      if (Object.keys(diffPayload).length === 0 && !photoChanged) {
        toast({ title: "No changes", description: "Update a field before saving." });
        setSaving(false);
        return;
      }

      // get current session to retrieve access token for server verification
      if (!userId) {
        throw new Error("Not authenticated");
      }

      let res: Response;

      if (photoChanged) {
        const formData = new FormData();
        Object.entries(diffPayload).forEach(([key, value]) => {
          if (value === undefined) return;
          if (Array.isArray(value)) {
            formData.append(key, JSON.stringify(value));
          } else if (value === null) {
            formData.append(key, "");
          } else {
            formData.append(key, String(value));
          }
        });
        if (!profilePhotoFile) {
          throw new Error("Missing profile photo file");
        }
        formData.append("profilePhoto", profilePhotoFile);

        res = await fetch("/api/profile/update", {
          method: "POST",
          body: formData,
        });
      } else {
        res = await fetch("/api/profile/update", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(diffPayload),
        });
      }

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to update profile");
      }

      const data = await res.json();
      if (data?.user) {
        setProfile(data.user);
        updateUser(data.user);
        initialFormRef.current = form;
        const latestPhoto = data.user.profile_photo_url ?? null;
        initialPhotoRef.current = latestPhoto;
        setProfilePhotoPreview(latestPhoto);
        setProfilePhotoFile(null);
          setFileUploadKey((prev) => prev + 1);
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
    <AppLayout>
      <div className="max-w-4xl mx-auto w-full">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">Edit Profile</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Update your personal and professional information
            </p>
          </div>
          <Button 
            onClick={handleSubmit} 
            disabled={saving || !initialLoaded} 
            size="sm" 
            className="btn-primary group"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save size={16} className="mr-2 group-hover:scale-110 transition-transform" />
                <span>Save</span>
              </>
            )}
          </Button>
        </div>
        {!initialLoaded && (
          <Card className="card-modern">
            <CardContent className="py-16 text-center">
              <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-sm text-muted-foreground">Loading profile…</p>
            </CardContent>
          </Card>
        )}

        {initialLoaded && !profile && (
          <Card className="card-modern">
            <CardContent className="py-16 text-center space-y-4">
              <div className="flex items-center justify-center mb-4">
                <div className="p-4 bg-muted rounded-full">
                  <User className="w-12 h-12 text-muted-foreground" />
                </div>
              </div>
              <p className="text-foreground font-medium">Please sign in to access your profile</p>
              <Button variant="outline" onClick={() => router.push("/login")} className="btn-secondary">
                Go to login
              </Button>
            </CardContent>
          </Card>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="card-modern group hover:shadow-lg transition-all duration-300">
            <CardHeader className="border-b bg-linear-to-r from-primary/5 to-primary/10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <CardTitle className="text-base font-semibold text-foreground">Personal Information</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Camera className="w-4 h-4" />
                    Profile Photo
                  </Label>
                  <FileUpload key={fileUploadKey} onFilesChange={handlePhotoChange} maxFiles={1} />
                  <p className="text-xs text-muted-foreground mt-1">Upload your profile photo (optional)</p>
                  {profilePhotoPreview ? (
                    <div className="mt-4 flex items-center gap-4 p-4 bento-card">
                      <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-primary/20 ring-2 ring-primary/10">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={profilePhotoPreview} alt="Profile preview" className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">Profile Preview</p>
                        <p className="text-xs text-muted-foreground mt-1">This will be your profile picture</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground mt-3">No profile photo uploaded yet.</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="name" className="text-sm font-medium text-muted-foreground">Full Name</Label>
                  <Input id="name" value={form.name} onChange={(e) => handleInput("name", e.target.value)} placeholder="Enter your full name" className="input-modern" />
                </div>
                <div>
                  <Label htmlFor="email" className="text-sm font-medium text-muted-foreground">Email</Label>
                  <Input id="email" value={form.email} onChange={(e) => handleInput("email", e.target.value)} placeholder="Enter your email address" className="input-modern" />
                </div>
                <div>
                  <Label htmlFor="city" className="text-sm font-medium text-muted-foreground">City</Label>
                  <Input id="city" value={form.city} onChange={(e) => handleInput("city", e.target.value)} placeholder="Enter your city" className="input-modern" />
                </div>
                <div>
                  <Label htmlFor="experience" className="text-sm font-medium text-muted-foreground">Experience</Label>
                  <Input id="experience" value={form.experience} onChange={(e) => handleInput("experience", e.target.value)} placeholder="e.g., 5 years" className="input-modern" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-modern group hover:shadow-lg transition-all duration-300">
            <CardHeader className="border-b bg-linear-to-r from-blue-500/5 to-blue-500/10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg group-hover:bg-blue-500/20 transition-colors">
                  <Building2 className="w-5 h-5 text-blue-600" />
                </div>
                <CardTitle className="text-base font-semibold text-foreground">Agency Information</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div>
                <Label htmlFor="agencyName" className="text-sm font-medium text-muted-foreground">Agency Name</Label>
                <Input id="agencyName" value={form.agencyName} onChange={(e) => handleInput("agencyName", e.target.value)} placeholder="Enter your agency name" className="input-modern" />
              </div>
              <div>
                <Label htmlFor="reraId" className="text-sm font-medium text-muted-foreground">RERA ID</Label>
                <Input id="reraId" value={form.reraId} onChange={(e) => handleInput("reraId", e.target.value)} placeholder="Enter your RERA registration number" className="input-modern" />
              </div>
              <div>
                <Label htmlFor="website" className="text-sm font-medium text-muted-foreground">Website</Label>
                <Input id="website" value={form.website} onChange={(e) => handleInput("website", e.target.value)} placeholder="https://yourwebsite.com" className="input-modern" />
              </div>
            </CardContent>
          </Card>

          <Card className="card-modern group hover:shadow-lg transition-all duration-300">
            <CardHeader className="border-b bg-linear-to-r from-purple-500/5 to-purple-500/10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/10 rounded-lg group-hover:bg-purple-500/20 transition-colors">
                  <Briefcase className="w-5 h-5 text-purple-600" />
                </div>
                <CardTitle className="text-base font-semibold text-foreground">Professional Details</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div>
                <Label htmlFor="areaOfExpertise" className="text-sm font-medium text-muted-foreground">Area of Expertise</Label>
                <Input id="areaOfExpertise" value={form.areaOfExpertise} onChange={(e) => handleInput("areaOfExpertise", e.target.value)} placeholder="e.g., Residential, Commercial, Luxury Properties" className="input-modern" />
                <p className="text-xs text-muted-foreground mt-1">Separate multiple areas with commas</p>
              </div>
              <div>
                <Label htmlFor="workingRegions" className="text-sm font-medium text-muted-foreground">Working Regions</Label>
                <Input id="workingRegions" value={form.workingRegions} onChange={(e) => handleInput("workingRegions", e.target.value)} placeholder="e.g., Mumbai, Pune, Delhi" className="input-modern" />
                <p className="text-xs text-muted-foreground mt-1">Separate multiple regions with commas</p>
              </div>
              <div>
                <Label htmlFor="bio" className="text-sm font-medium text-muted-foreground">Bio</Label>
                <Textarea id="bio" value={form.bio} onChange={(e) => handleInput("bio", e.target.value)} placeholder="Tell us about yourself and your expertise..." rows={4} className="input-modern" />
              </div>
            </CardContent>
          </Card>

          <Button type="submit" disabled={saving || !initialLoaded} className="w-full btn-primary group" size="lg">
            {saving ? (
              <>
                <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2" />
                <span>Saving Changes...</span>
              </>
            ) : (
              <>
                <Save size={20} className="mr-2 group-hover:scale-110 transition-transform" />
                <span>Save Changes</span>
              </>
            )}
          </Button>
        </form>
      </div>
    </AppLayout>
  );
}
