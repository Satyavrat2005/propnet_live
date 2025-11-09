// app/add-property/page.tsx
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import FileUpload from "@/components/ui/file-upload";

type FormState = {
  title: string;
  propertyType: string;
  price: string;
  size: string;
  location: string;
  description: string;
  bhk: string;
  listingType: "exclusive" | "colisting" | string;
};

export default function AddPropertyPage() {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<FormState>({
    title: "",
    propertyType: "",
    price: "",
    size: "",
    location: "",
    description: "",
    bhk: "",
    listingType: "exclusive",
  });

  const [photos, setPhotos] = useState<File[]>([]);

  const propertyTypes = ["Apartment", "Villa", "Commercial", "Plot"];

  const addPropertyMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await fetch("/api/properties", {
        method: "POST",
        body: data,
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to create property");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
      toast({
        title: "Success",
        description: "Property added successfully!",
      });
      router.push("/feed");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add property. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formDataToSend = new FormData();
    formDataToSend.append(
      "data",
      JSON.stringify({
        ...formData,
        bhk: formData.bhk ? parseInt(formData.bhk, 10) : null,
      })
    );

    photos.forEach((photo) => {
      formDataToSend.append("photos", photo);
    });

    addPropertyMutation.mutate(formDataToSend);
  };

  const handleInputChange = (field: keyof FormState, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const isFormValid =
    formData.title.trim() &&
    formData.propertyType.trim() &&
    formData.price.trim() &&
    formData.size.trim() &&
    formData.location.trim() &&
    formData.listingType.trim();

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-neutral-100 z-10">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center">
            <button
              type="button"
              className="text-primary mr-4"
              onClick={() => router.push("/feed")}
              aria-label="Back to feed"
            >
              <ArrowLeft size={24} />
            </button>
            <h2 className="text-lg font-semibold text-neutral-900">Add Property</h2>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/bulk-upload")}
            className="flex items-center space-x-2"
          >
            <Upload size={16} />
            <span>Bulk Upload</span>
          </Button>
        </div>
      </div>

      <div className="flex-1 px-6 py-6 pb-20">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label className="block text-sm font-medium text-neutral-700 mb-2">
              Property Title
            </Label>
            <Input
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              placeholder="e.g., 2BHK in Bandra West"
              required
            />
          </div>

          <div>
            <Label className="block text-sm font-medium text-neutral-700 mb-2">
              Property Type
            </Label>
            <Select
              onValueChange={(value) => handleInputChange("propertyType", value)}
              value={formData.propertyType}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select property type" />
              </SelectTrigger>
              <SelectContent>
                {propertyTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="block text-sm font-medium text-neutral-700 mb-2">Price</Label>
              <Input
                type="text"
                value={formData.price}
                onChange={(e) => handleInputChange("price", e.target.value)}
                placeholder="₹ 2.5 Cr"
                required
              />
            </div>
            <div>
              <Label className="block text-sm font-medium text-neutral-700 mb-2">Size (sq ft)</Label>
              <Input
                type="text"
                value={formData.size}
                onChange={(e) => handleInputChange("size", e.target.value)}
                placeholder="1,200"
                required
              />
            </div>
          </div>

          <div>
            <Label className="block text-sm font-medium text-neutral-700 mb-2">BHK (Optional)</Label>
            <Input
              type="number"
              value={formData.bhk}
              onChange={(e) => handleInputChange("bhk", e.target.value)}
              placeholder="3"
              min={1}
              max={10}
            />
          </div>

          <div>
            <Label className="block text-sm font-medium text-neutral-700 mb-2">Location</Label>
            <Input
              type="text"
              value={formData.location}
              onChange={(e) => handleInputChange("location", e.target.value)}
              placeholder="Area, City"
              required
            />
          </div>

          <div>
            <Label className="block text-sm font-medium text-neutral-700 mb-2">Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Describe the property features..."
              rows={4}
            />
          </div>

          {/* Photo Upload */}
          <div>
            <Label className="block text-sm font-medium text-neutral-700 mb-2">Property Photos</Label>
            <FileUpload onFilesChange={setPhotos} />
          </div>

          {/* Listing Type */}
          <div>
            <Label className="block text-sm font-medium text-neutral-700 mb-3">Listing Type</Label>
            <RadioGroup
              value={formData.listingType}
              onValueChange={(value) => handleInputChange("listingType", value)}
              className="space-y-3"
            >
              <div className="flex items-center space-x-3">
                <RadioGroupItem value="exclusive" id="exclusive" />
                <div>
                  <label htmlFor="exclusive" className="font-medium text-neutral-900 cursor-pointer">
                    Exclusive Listing
                  </label>
                  <div className="text-sm text-neutral-500">Only you can share this property</div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <RadioGroupItem value="colisting" id="colisting" />
                <div>
                  <label htmlFor="colisting" className="font-medium text-neutral-900 cursor-pointer">
                    Allow Co-listing
                  </label>
                  <div className="text-sm text-neutral-500">Other agents can request to co-list</div>
                </div>
              </div>
            </RadioGroup>
          </div>

          <Button
            type="submit"
            disabled={!Boolean(isFormValid) || addPropertyMutation.isPending}
            className="w-full bg-primary text-white py-3 rounded-lg font-medium"
          >
            {addPropertyMutation.isPending ? <div className="loading-spinner" /> : "Add Property"}
          </Button>
        </form>
      </div>
    </div>
  );
}
