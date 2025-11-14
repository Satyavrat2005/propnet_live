// app/quickpost/page.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  Wand2,
  FileText,
  Edit3,
  Trash2,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import MobileNavigation from "@/components/layout/mobile-navigation";
import GooglePlacesAutocomplete from "@/components/ui/google-places-autocomplete";
import { Checkbox } from "@/components/ui/checkbox";
import { z } from "zod";

type ExtractedProperty = {
  title?: string;
  propertyType?: string;
  transactionType?: "sale" | "rent";
  price?: string;
  rentFrequency?: "monthly" | "yearly";
  size?: string;
  sizeUnit?: string;
  location?: string;
  fullAddress?: string;
  ownerName?: string;
  ownerPhone?: string;
  commissionTerms?: string;
  bhk?: number;
  flatNumber?: string;
  floorNumber?: string;
  buildingSociety?: string;
  description?: string;
  confidence?: number;
  listingType?: "exclusive" | "shared" | "co-listing";
  isPubliclyVisible?: boolean;
  scopeOfWork?: string[];
};

const propertyFormSchema = z
  .object({
    title: z.string().min(1, "Title is required"),
    propertyType: z.string().min(1, "Property type is required"),
    transactionType: z.enum(["sale", "rent"]),
    price: z.string().min(1, "Price is required"),
    rentFrequency: z.enum(["monthly", "yearly"]).optional(),
    size: z.string().min(1, "Size is required"),
    sizeUnit: z.string().min(1, "Size unit is required"),
    location: z.string().min(1, "Location is required"),
    fullAddress: z.string().min(1, "Full address is required"),
    bhk: z.number().min(0),
    flatNumber: z.string().min(1, "Flat/Unit number is required"),
    buildingSociety: z.string().min(1, "Building/Society name is required"),
    floorNumber: z.string().optional(),
    description: z.string().optional(),
    listingType: z.enum(["exclusive", "shared", "co-listing"]),
    isPubliclyVisible: z.boolean().optional(),
    ownerName: z.string().optional(),
    ownerPhone: z.string().optional(),
    commissionTerms: z.string().optional(),
    scopeOfWork: z.array(z.string()).optional(),
  })
  .refine(
    (data) => {
      if (data.listingType === "exclusive" || data.listingType === "co-listing") {
        return Boolean(data.ownerName && data.ownerPhone && data.commissionTerms);
      }
      return true;
    },
    {
      message:
        "Owner details and commission terms required for exclusive/co-listing",
      path: ["ownerName"],
    }
  );

export default function QuickPostPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

  // Redirect to login if not authenticated

  const [inputText, setInputText] = useState("");
  const [extractedProperties, setExtractedProperties] = useState<
    ExtractedProperty[]
  >([]);
  const [selectedProperty, setSelectedProperty] =
    useState<ExtractedProperty | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Stable options (prevents re-renders that cause input "zapping")
  const scopeOfWorkOptions = useMemo(
    () => [
      "Property Viewing Coordination",
      "Marketing & Promotion",
      "Documentation Support",
      "Negotiation Assistance",
      "Legal Compliance Check",
      "Market Analysis",
    ],
    []
  );

  const form = useForm<z.infer<typeof propertyFormSchema>>({
    resolver: zodResolver(propertyFormSchema),
    defaultValues: {
      title: "",
      propertyType: "",
      transactionType: "sale",
      price: "",
      rentFrequency: "monthly",
      size: "",
      sizeUnit: "sq.ft",
      location: "",
      fullAddress: "",
      flatNumber: "",
      floorNumber: "",
      buildingSociety: "",
      description: "",
      bhk: 0,
      listingType: "shared",
      isPubliclyVisible: true,
      ownerName: "",
      ownerPhone: "",
      commissionTerms: "",
      scopeOfWork: [],
    },
  });

  // ---- AI Extraction ----
  const extractMutation = useMutation({
    mutationFn: async (text: string) => {
      const res = await fetch("/api/quickpost/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const json = await res.json();
      if (!res.ok) throw { response: { data: json } };
      return json as { properties: ExtractedProperty[]; count: number };
    },
    onSuccess: (data) => {
      setExtractedProperties(data.properties || []);
      toast({
        title: "Properties Extracted",
        description: `Found ${data.count ?? (data.properties || []).length} properties from your text.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Extraction Failed",
        description:
          error?.response?.data?.message ||
          "Failed to extract properties from text.",
        variant: "destructive",
      });
    },
  });

  // ---- Create listings by reusing /api/my-properties (FormData) ----
  const createAllMutation = useMutation({
    mutationFn: async (props: ExtractedProperty[]) => {
      // sequential (safe) — you can parallelize if you want
      let created = 0;
      const failed: { index: number; error: string }[] = [];

      for (let i = 0; i < props.length; i++) {
        const p = props[i];
        try {
          const fd = new FormData();
          // map fields to server field names expected by /api/my-properties
          if (p.title) fd.append("title", p.title);
          if (p.propertyType) fd.append("propertyType", p.propertyType);
          if (p.transactionType) fd.append("transactionType", p.transactionType);
          if (p.price) fd.append("price", p.price);
          if (p.rentFrequency) fd.append("rentFrequency", p.rentFrequency);
          if (p.size) fd.append("size", p.size);
          if (p.sizeUnit) fd.append("sizeUnit", p.sizeUnit);
          if (p.location) fd.append("location", p.location);
          if (p.fullAddress) fd.append("fullAddress", p.fullAddress);
          if (p.flatNumber) fd.append("flatNumber", p.flatNumber);
          if (p.floorNumber) fd.append("floorNumber", p.floorNumber);
          if (p.buildingSociety) fd.append("buildingSociety", p.buildingSociety);
          if (p.description) fd.append("description", p.description);
          if (typeof p.bhk === "number") fd.append("bhk", String(p.bhk));
          if (p.listingType) fd.append("listingType", p.listingType);
          fd.append(
            "isPubliclyVisible",
            String(p.isPubliclyVisible ?? p.listingType !== "exclusive")
          );
          if (p.ownerName) fd.append("ownerName", p.ownerName);
          if (p.ownerPhone) fd.append("ownerPhone", p.ownerPhone);
          if (p.commissionTerms) fd.append("commissionTerms", p.commissionTerms);
          if (p.scopeOfWork?.length)
            fd.append("scopeOfWork", JSON.stringify(p.scopeOfWork));

          const res = await fetch("/api/my-properties", {
            method: "POST",
            body: fd,
            credentials: "same-origin",
          });
          const json = await res.json();
          if (!res.ok) {
            throw new Error(json?.message || "Insert failed");
          }
          created++;
        } catch (e: any) {
          failed.push({ index: i, error: e?.message || "Unknown error" });
        }
      }
      return { created, failed };
    },
    onSuccess: ({ created, failed }) => {
      if (created > 0) {
        toast({
          title: "Listings Created",
          description: `${created} properties created successfully.`,
        });
      }
      if (failed.length > 0) {
        toast({
          title: "Some Failed",
          description: `${failed.length} properties need correction. Check fields and try again.`,
          variant: "destructive",
        });
        // keep only failed ones for user to edit
        setExtractedProperties((prev) =>
          prev.filter((_, idx) => failed.some((f) => f.index === idx))
        );
        return;
      }
      // all good
      setInputText("");
      setExtractedProperties([]);
      router.push("/my-listings");
    },
    onError: () => {
      toast({
        title: "Creation Failed",
        description: "Failed to create properties. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleExtract = () => {
    if (!inputText.trim()) {
      toast({
        title: "Input Required",
        description: "Please enter property text to extract listings.",
        variant: "destructive",
      });
      return;
    }
    extractMutation.mutate(inputText);
  };

  const handleEditInline = (
    property: ExtractedProperty,
    patch: Partial<ExtractedProperty>
  ) => {
    const updated = { ...property, ...patch };
    setExtractedProperties((prev) =>
      prev.map((p) => (p === property ? updated : p))
    );
  };

  const handleEditDialog = (property: ExtractedProperty) => {
    setSelectedProperty(property);
    form.reset({
      title: property.title || "",
      propertyType: property.propertyType || "",
      transactionType: property.transactionType || "sale",
      price: property.price || "",
      rentFrequency: property.rentFrequency || "monthly",
      size: property.size || "",
      sizeUnit: property.sizeUnit || "sq.ft",
      location: property.location || "",
      fullAddress: property.fullAddress || "",
      flatNumber: property.flatNumber || "",
      floorNumber: property.floorNumber || "",
      buildingSociety: property.buildingSociety || "",
      description: property.description || "",
      bhk: property.bhk || 0,
      listingType: property.listingType || "shared",
      isPubliclyVisible:
        property.isPubliclyVisible ?? property.listingType !== "exclusive",
      ownerName: property.ownerName || "",
      ownerPhone: property.ownerPhone || "",
      commissionTerms: property.commissionTerms || "",
      scopeOfWork: property.scopeOfWork || [],
    });
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = (values: z.infer<typeof propertyFormSchema>) => {
    if (!selectedProperty) return;
    handleEditInline(selectedProperty, values);
    setIsEditDialogOpen(false);
    setSelectedProperty(null);
    toast({
      title: "Property Updated",
      description: "Property details have been updated.",
    });
  };

  const handleRemove = (property: ExtractedProperty) => {
    setExtractedProperties((prev) => prev.filter((p) => p !== property));
    toast({ title: "Removed", description: "Property removed from the list." });
  };

  const getValidationStatus = (property: ExtractedProperty) => {
    const required: (keyof ExtractedProperty)[] = [
      "title",
      "propertyType",
      "transactionType",
      "price",
      "size",
      "location",
      "bhk",
      "flatNumber",
      "buildingSociety",
      "fullAddress",
    ];
    const missing = required.filter((k) => !property[k]);
    const lt = property.listingType || "shared";
    if (lt === "exclusive" || lt === "co-listing") {
      if (!property.ownerName) missing.push("ownerName");
      if (!property.ownerPhone) missing.push("ownerPhone");
      if (!property.commissionTerms) missing.push("commissionTerms");
    }
    return { isValid: missing.length === 0, missingFields: missing, missingCount: missing.length };
  };

  const getConfidenceBadge = (confidence?: number) => {
    if (!confidence && confidence !== 0) return null;
    const pct = Math.round(confidence * 100);
    const color =
      pct < 60 ? "bg-red-100 text-red-800" : pct < 80 ? "bg-yellow-100 text-yellow-800" : "bg-green-100 text-green-800";
    return (
      <Badge className={color}>
        {pct}% confidence
      </Badge>
    );
  };

  const handleCreateAll = () => {
    if (extractedProperties.length === 0) {
      toast({
        title: "No Properties",
        description: "Please extract properties first.",
        variant: "destructive",
      });
      return;
    }
    createAllMutation.mutate(extractedProperties);
  };

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) router.back();
    else router.push("/dashboard");
  };

  return (
    <div className="flex flex-col min-h-screen pb-20">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-neutral-100 z-10">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center">
            <button
              className="text-primary mr-4 hover:opacity-80"
              onClick={handleBack}
              type="button"
              aria-label="Go back"
            >
              <ArrowLeft size={24} />
            </button>
            <div>
              <h2 className="text-lg font-semibold text-neutral-900">
                QuickPost
              </h2>
              <p className="text-xs text-neutral-500">
                AI-powered property extraction
              </p>
            </div>
          </div>
          <Sparkles size={20} className="text-primary" />
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 px-6 py-6 space-y-6">
        {/* Input */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-base">
              <FileText size={16} className="mr-2" />
              Paste Property Text
            </CardTitle>
            <p className="text-sm text-neutral-600">
              Paste raw property listings from WhatsApp, emails, or documents. Our AI will extract structured data automatically.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder={`Paste your property text here...`}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              rows={8}
              className="resize-none"
            />

            <div className="flex space-x-2">
              <Button
                onClick={handleExtract}
                disabled={extractMutation.isPending || !inputText.trim()}
                className="flex-1"
                type="button"
              >
                {extractMutation.isPending ? (
                  <>
                    <Wand2 size={16} className="mr-2 animate-spin" />
                    Extracting...
                  </>
                ) : (
                  <>
                    <Wand2 size={16} className="mr-2" />
                    Extract Properties
                  </>
                )}
              </Button>

              <Button variant="outline" onClick={() => setInputText("")} type="button">
                Clear
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Extracted Properties */}
        {extractedProperties.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">
                  Extracted Properties ({extractedProperties.length})
                </CardTitle>
                <Button
                  onClick={handleCreateAll}
                  disabled={createAllMutation.isPending}
                  size="sm"
                  type="button"
                >
                  {createAllMutation.isPending ? "Creating..." : "Create All Listings"}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {extractedProperties.map((property, index) => {
                const validation = getValidationStatus(property);
                return (
                  <Card
                    key={index}
                    className={`border ${
                      validation.isValid
                        ? "border-green-200 bg-green-50"
                        : "border-red-200 bg-red-50"
                    }`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="font-semibold text-neutral-900">
                              {property.title || `Property ${index + 1}`}
                            </h3>
                            {!validation.isValid ? (
                              <Badge variant="destructive" className="text-xs">
                                {validation.missingCount} fields missing
                              </Badge>
                            ) : (
                              <Badge className="bg-green-100 text-green-800 text-xs">
                                Ready to create
                              </Badge>
                            )}
                            {getConfidenceBadge(property.confidence)}
                          </div>

                          {!validation.isValid && (
                            <p className="text-xs text-red-600 mb-2">
                              Missing: {validation.missingFields.join(", ")}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center space-x-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditDialog(property)}
                            type="button"
                          >
                            <Edit3 size={14} />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemove(property)}
                            type="button"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </div>

                      {/* Quick inline fixes for missing fields */}
                      {validation.missingFields.length > 0 && (
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          {validation.missingFields.includes("title") && (
                            <div className="col-span-2">
                              <label className="text-xs text-neutral-600">
                                Property Title
                              </label>
                              <Input
                                defaultValue={property.title || ""}
                                className="h-8 text-xs"
                                onBlur={(e) =>
                                  handleEditInline(property, {
                                    title: e.target.value,
                                  })
                                }
                              />
                            </div>
                          )}

                          {validation.missingFields.includes("propertyType") && (
                            <div>
                              <label className="text-xs text-neutral-600">
                                Property Type
                              </label>
                              <Select
                                onValueChange={(v) =>
                                  handleEditInline(property, {
                                    propertyType: v as ExtractedProperty["propertyType"],
                                  })
                                }
                              >
                                <SelectTrigger className="h-8 text-xs">
                                  <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Apartment">Apartment</SelectItem>
                                  <SelectItem value="Villa">Villa</SelectItem>
                                  <SelectItem value="Commercial">Commercial</SelectItem>
                                  <SelectItem value="Plot">Plot</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          )}

                          {validation.missingFields.includes("transactionType") && (
                            <div>
                              <label className="text-xs text-neutral-600">
                                Transaction Type
                              </label>
                              <Select
                                onValueChange={(v) =>
                                  handleEditInline(property, {
                                    transactionType: v as "sale" | "rent",
                                  })
                                }
                              >
                                <SelectTrigger className="h-8 text-xs">
                                  <SelectValue placeholder="Select transaction" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="sale">Sale</SelectItem>
                                  <SelectItem value="rent">Rent</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          )}

                          {validation.missingFields.includes("price") && (
                            <div>
                              <label className="text-xs text-neutral-600">Price</label>
                              <Input
                                defaultValue={property.price || ""}
                                className="h-8 text-xs"
                                onBlur={(e) =>
                                  handleEditInline(property, {
                                    price: e.target.value,
                                  })
                                }
                              />
                            </div>
                          )}

                          {validation.missingFields.includes("size") && (
                            <div>
                              <label className="text-xs text-neutral-600">Size</label>
                              <Input
                                defaultValue={property.size || ""}
                                className="h-8 text-xs"
                                onBlur={(e) =>
                                  handleEditInline(property, { size: e.target.value })
                                }
                              />
                            </div>
                          )}

                          {validation.missingFields.includes("location") && (
                            <div className="col-span-2">
                              <label className="text-xs text-neutral-600">
                                Location
                              </label>
                              <Input
                                defaultValue={property.location || ""}
                                className="h-8 text-xs"
                                onBlur={(e) =>
                                  handleEditInline(property, {
                                    location: e.target.value,
                                  })
                                }
                              />
                            </div>
                          )}

                          {validation.missingFields.includes("bhk") && (
                            <div>
                              <label className="text-xs text-neutral-600">BHK</label>
                              <Input
                                type="number"
                                defaultValue={
                                  typeof property.bhk === "number"
                                    ? String(property.bhk)
                                    : ""
                                }
                                className="h-8 text-xs"
                                onBlur={(e) =>
                                  handleEditInline(property, {
                                    bhk: parseInt(e.target.value) || 0,
                                  })
                                }
                              />
                            </div>
                          )}

                          {validation.missingFields.includes("flatNumber") && (
                            <div>
                              <label className="text-xs text-neutral-600">
                                Flat/Unit Number
                              </label>
                              <Input
                                defaultValue={property.flatNumber || ""}
                                className="h-8 text-xs"
                                onBlur={(e) =>
                                  handleEditInline(property, {
                                    flatNumber: e.target.value,
                                  })
                                }
                              />
                            </div>
                          )}

                          {validation.missingFields.includes("buildingSociety") && (
                            <div className="col-span-2">
                              <label className="text-xs text-neutral-600">
                                Building/Society
                              </label>
                              <GooglePlacesAutocomplete
                                value={property.buildingSociety || ""}
                                onChange={(v) =>
                                  handleEditInline(property, {
                                    buildingSociety: v,
                                  })
                                }
                                placeholder="Search building..."
                                types={["establishment"]}
                                className="text-xs"
                              />
                            </div>
                          )}

                          {validation.missingFields.includes("fullAddress") && (
                            <div className="col-span-2">
                              <label className="text-xs text-neutral-600">
                                Full Address
                              </label>
                              <Input
                                defaultValue={property.fullAddress || ""}
                                className="h-8 text-xs"
                                onBlur={(e) =>
                                  handleEditInline(property, {
                                    fullAddress: e.target.value,
                                  })
                                }
                              />
                            </div>
                          )}

                          {validation.missingFields.includes("ownerName") && (
                            <div>
                              <label className="text-xs text-neutral-600">
                                Owner Name
                              </label>
                              <Input
                                defaultValue={property.ownerName || ""}
                                className="h-8 text-xs"
                                onBlur={(e) =>
                                  handleEditInline(property, {
                                    ownerName: e.target.value,
                                  })
                                }
                              />
                            </div>
                          )}

                          {validation.missingFields.includes("ownerPhone") && (
                            <div>
                              <label className="text-xs text-neutral-600">
                                Owner Phone
                              </label>
                              <Input
                                defaultValue={property.ownerPhone || ""}
                                className="h-8 text-xs"
                                onBlur={(e) =>
                                  handleEditInline(property, {
                                    ownerPhone: e.target.value,
                                  })
                                }
                              />
                            </div>
                          )}

                          {validation.missingFields.includes("commissionTerms") && (
                            <div className="col-span-2">
                              <label className="text-xs text-neutral-600">
                                Commission Terms
                              </label>
                              <Input
                                defaultValue={property.commissionTerms || ""}
                                className="h-8 text-xs"
                                onBlur={(e) =>
                                  handleEditInline(property, {
                                    commissionTerms: e.target.value,
                                  })
                                }
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* Edit Dialog (full form) */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto bg-white">
            <DialogHeader>
              <DialogTitle>Edit Property Details</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSaveEdit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Property Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Beautiful 2 BHK Apartment..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="propertyType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Property Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Apartment">Apartment</SelectItem>
                            <SelectItem value="Villa">Villa</SelectItem>
                            <SelectItem value="Commercial">Commercial</SelectItem>
                            <SelectItem value="Plot">Plot</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="transactionType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Transaction Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select transaction" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="sale">Sale</SelectItem>
                            <SelectItem value="rent">Rent</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price</FormLabel>
                        <FormControl>
                          <Input placeholder="₹ 50,00,000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="size"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Size</FormLabel>
                        <FormControl>
                          <Input placeholder="1200" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location</FormLabel>
                        <FormControl>
                          <Input placeholder="Bandra West, Mumbai" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="bhk"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>BHK</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="2"
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseInt(e.target.value) || 0)
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="flatNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Flat/Unit Number</FormLabel>
                        <FormControl>
                          <Input placeholder="A-101" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="buildingSociety"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Building/Society Name</FormLabel>
                        <FormControl>
                          <GooglePlacesAutocomplete
                            value={field.value || ""}
                            onChange={(v) => field.onChange(v)}
                            placeholder="Search for building or society..."
                            types={["establishment"]}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="floorNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Floor Number</FormLabel>
                        <FormControl>
                          <Input placeholder="5th Floor" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="fullAddress"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Full Address</FormLabel>
                        <FormControl>
                          <Input placeholder="Complete address" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="listingType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Listing Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select listing type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="shared">Shared</SelectItem>
                            <SelectItem value="exclusive">Exclusive</SelectItem>
                            <SelectItem value="co-listing">Co-listing</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="ownerName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Owner Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="ownerPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Owner Phone</FormLabel>
                        <FormControl>
                          <Input placeholder="9876543210" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="commissionTerms"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Commission Terms</FormLabel>
                        <FormControl>
                          <Input placeholder="2% of sale value" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="scopeOfWork"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Scope of Work</FormLabel>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {scopeOfWorkOptions.map((opt) => (
                            <div
                              key={opt}
                              className="flex items-center space-x-2 p-2 border border-gray-200 rounded-md bg-white"
                            >
                              <Checkbox
                                checked={field.value?.includes(opt) || false}
                                onCheckedChange={(checked) => {
                                  const current = field.value || [];
                                  field.onChange(
                                    checked
                                      ? [...current, opt]
                                      : current.filter((x: string) => x !== opt)
                                  );
                                }}
                              />
                              <span className="text-sm">{opt}</span>
                            </div>
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditDialogOpen(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1">
                    Save Changes
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <MobileNavigation />
    </div>
  );
}
