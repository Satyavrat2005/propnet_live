"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Save } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import FileUpload from "@/components/ui/file-upload";

export default function EditProfile() {
  const router = useRouter();
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    agencyName: user?.agencyName || "",
    reraId: user?.reraId || "",
    city: user?.city || "",
    experience: user?.experience || "",
    bio: user?.bio || "",
    website: user?.website || "",
    areaOfExpertise: user?.areaOfExpertise?.join(", ") || "",
    workingRegions: user?.workingRegions?.join(", ") || "",
  });

  const [logoFiles, setLogoFiles] = useState<File[]>([]);
  const [profilePhotoFiles, setProfilePhotoFiles] = useState<File[]>([]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await apiRequest("POST", "/api/profile/update", data);
      return response.json();
    },
    onSuccess: (data) => {
      updateUser(data.user);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
      router.push("/profile");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const formDataToSend = new FormData();

    Object.entries(formData).forEach(([key, value]) =>
      formDataToSend.append(key, value)
    );

    if (logoFiles.length > 0) {
      formDataToSend.append("agencyLogo", logoFiles[0]);
    }
    if (profilePhotoFiles.length > 0) {
      formDataToSend.append("profilePhoto", profilePhotoFiles[0]);
    }

    updateProfileMutation.mutate(formDataToSend);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="flex flex-col min-h-screen pb-20">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-neutral-100 z-10">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center">
            <button
              className="text-primary mr-4"
              onClick={() => router.push("/profile")}
              type="button"
            >
              <ArrowLeft size={24} />
            </button>
            <h2 className="text-lg font-semibold text-neutral-900">Edit Profile</h2>
          </div>
          <Button
            onClick={handleSubmit}
            disabled={updateProfileMutation.isPending}
            size="sm"
            className="flex items-center space-x-2"
          >
            <Save size={16} />
            <span>Save</span>
          </Button>
        </div>
      </div>

      {/* Form Content */}
      <div className="flex-1 px-6 py-6 space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label>Profile Photo</Label>
                  <FileUpload onFilesChange={setProfilePhotoFiles} maxFiles={1} />
                  <p className="text-xs text-neutral-500 mt-1">
                    Upload your profile photo (optional)
                  </p>
                </div>
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="Enter your full name"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    placeholder="Enter your email address"
                  />
                </div>
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => handleInputChange("city", e.target.value)}
                    placeholder="Enter your city"
                  />
                </div>
                <div>
                  <Label htmlFor="experience">Experience</Label>
                  <Input
                    id="experience"
                    value={formData.experience}
                    onChange={(e) => handleInputChange("experience", e.target.value)}
                    placeholder="e.g., 5 years"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Agency Information */}
          <Card>
            <CardHeader>
              <CardTitle>Agency Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="agencyName">Agency Name</Label>
                <Input
                  id="agencyName"
                  value={formData.agencyName}
                  onChange={(e) => handleInputChange("agencyName", e.target.value)}
                  placeholder="Enter your agency name"
                />
              </div>
              <div>
                <Label htmlFor="reraId">RERA ID</Label>
                <Input
                  id="reraId"
                  value={formData.reraId}
                  onChange={(e) => handleInputChange("reraId", e.target.value)}
                  placeholder="Enter your RERA registration number"
                />
              </div>
              <div>
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={formData.website}
                  onChange={(e) => handleInputChange("website", e.target.value)}
                  placeholder="https://yourwebsite.com"
                />
              </div>
              <div>
                <Label htmlFor="agencyLogo">Agency Logo</Label>
                <FileUpload onFilesChange={setLogoFiles} maxFiles={1} />
                <p className="text-xs text-neutral-500 mt-1">
                  Upload your agency logo for property reports and listings
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Professional Details */}
          <Card>
            <CardHeader>
              <CardTitle>Professional Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="areaOfExpertise">Area of Expertise</Label>
                <Input
                  id="areaOfExpertise"
                  value={formData.areaOfExpertise}
                  onChange={(e) => handleInputChange("areaOfExpertise", e.target.value)}
                  placeholder="e.g., Residential, Commercial, Luxury Properties"
                />
                <p className="text-xs text-neutral-500 mt-1">
                  Separate multiple areas with commas
                </p>
              </div>
              <div>
                <Label htmlFor="workingRegions">Working Regions</Label>
                <Input
                  id="workingRegions"
                  value={formData.workingRegions}
                  onChange={(e) => handleInputChange("workingRegions", e.target.value)}
                  placeholder="e.g., Mumbai, Pune, Delhi"
                />
                <p className="text-xs text-neutral-500 mt-1">
                  Separate multiple regions with commas
                </p>
              </div>
              <div>
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => handleInputChange("bio", e.target.value)}
                  placeholder="Tell us about yourself and your expertise..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <Button
            type="submit"
            disabled={updateProfileMutation.isPending}
            className="w-full flex items-center justify-center space-x-2"
            size="lg"
          >
            {updateProfileMutation.isPending ? (
              <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <Save size={20} />
            )}
            <span>
              {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
            </span>
          </Button>
        </form>
      </div>
    </div>
  );
}
