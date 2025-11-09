// app/quickpost/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  Wand2,
  FileText,
  Edit3,
  Trash2,
  CheckCircle,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import MobileNavigation from "@/components/layout/mobile-navigation";
import GooglePlacesAutocomplete from "@/components/ui/google-places-autocomplete";
import { z } from "zod";

interface ExtractedProperty {
  title?: string;
  propertyType?: string;
  transactionType?: string;
  price?: string;
  rentFrequency?: string;
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
  listingType?: string;
}

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
    bhk: z.number().min(1, "BHK is required"),
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
      message: "Owner details and commission terms required for exclusive/co-listing",
      path: ["ownerName"],
    }
  );

export default function QuickPostPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Redirect to login if not authenticated (do inside effect)
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/");
    }
  }, [authLoading, user, router]);

  const [inputText, setInputText] = useState<string>("");
  const [extractedProperties, setExtractedProperties] = useState<ExtractedProperty[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<ExtractedProperty | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

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

  const extractMutation = useMutation({
    mutationFn: async (text: string) => {
      const resp = await apiRequest("POST", "/api/quickpost/extract", { text });
      if (resp && typeof (resp as Response).json === "function") return (resp as Response).json();
      return resp;
    },
    onSuccess: (data: any) => {
      setExtractedProperties(data.properties || []);
      toast({
        title: "Properties Extracted",
        description: `Found ${data.count ?? (data.properties || []).length} properties from your text.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Extraction Failed",
        description: error?.response?.data?.message || "Failed to extract properties from text.",
        variant: "destructive",
      });
    },
  });

  const createMutation = useMutation({
    mutationFn: async (properties: ExtractedProperty[]) => {
      const resp = await apiRequest("POST", "/api/quickpost/create", { properties });
      if (resp && typeof (resp as Response).json === "function") return (resp as Response).json();
      return resp;
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-properties"] });
      queryClient.invalidateQueries({ queryKey: ["/api/properties"] });

      if (data.errors && data.errors.length > 0) {
        toast({
          title: "Incomplete Properties Found",
          description: `${data.errors.length} properties need manual completion. Please fill in missing required fields and try again.`,
          variant: "destructive",
        });

        console.log("Property creation errors:", data.errors);

        const failedIndices = data.errors.map((e: any) => e.index);
        const failedProperties = extractedProperties.filter((_, idx) => failedIndices.includes(idx));
        const successfulCount = data.created ?? 0;

        if (successfulCount > 0) {
          toast({
            title: "Partial Success",
            description: `${successfulCount} properties created successfully.`,
          });
        }

        setExtractedProperties(failedProperties);
      } else {
        toast({
          title: "All Properties Created",
          description: `Successfully created ${data.created ?? 0} properties.`,
        });
        setInputText("");
        setExtractedProperties([]);
      }
    },
    onError: (error: any) => {
      toast({
        title: "Creation Failed",
        description: error?.response?.data?.message || "Failed to create properties.",
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

  const handleEdit = (property: ExtractedProperty) => {
    setSelectedProperty(property);

    form.reset({
      title: property.title || "",
      propertyType: property.propertyType || "",
      transactionType: (property.transactionType as "sale" | "rent") || "sale",
      price: property.price || "",
      rentFrequency: (property.rentFrequency as "monthly" | "yearly") || "monthly",
      size: property.size || "",
      sizeUnit: property.sizeUnit || "sq.ft",
      location: property.location || "",
      fullAddress: property.fullAddress || "",
      flatNumber: property.flatNumber || "",
      floorNumber: property.floorNumber || "",
      buildingSociety: property.buildingSociety || "",
      description: property.description || "",
      bhk: property.bhk || 0,
      listingType: (property.listingType as "exclusive" | "shared" | "co-listing") || "shared",
      isPubliclyVisible: property.listingType !== "exclusive",
      ownerName: property.ownerName || "",
      ownerPhone: property.ownerPhone || "",
      commissionTerms: property.commissionTerms || "",
      scopeOfWork: [],
    });

    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = (values: z.infer<typeof propertyFormSchema>) => {
    if (selectedProperty) {
      const updatedProperty = { ...selectedProperty, ...values };
      const updatedProperties = extractedProperties.map((p) => (p === selectedProperty ? updatedProperty : p));
      setExtractedProperties(updatedProperties);
      setIsEditDialogOpen(false);
      setSelectedProperty(null);

      toast({
        title: "Property Updated",
        description: "Property details have been updated successfully.",
      });
    }
  };

  const handleRemove = (property: ExtractedProperty) => {
    setExtractedProperties((prev) => prev.filter((p) => p !== property));
    toast({
      title: "Property Removed",
      description: "Property has been removed from the list.",
    });
  };

  const handleCreateAll = () => {
    if (extractedProperties.length === 0) {
      toast({
        title: "No Properties",
        description: "Please extract properties first before creating listings.",
        variant: "destructive",
      });
      return;
    }
    createMutation.mutate(extractedProperties);
  };

  const getConfidenceBadge = (confidence?: number) => {
    if (!confidence) return null;
    const percentage = Math.round(confidence * 100);
    let variant: "default" | "secondary" | "destructive" | "outline" = "default";
    let color = "bg-green-100 text-green-800";

    if (percentage < 60) {
      variant = "destructive";
      color = "bg-red-100 text-red-800";
    } else if (percentage < 80) {
      variant = "secondary";
      color = "bg-yellow-100 text-yellow-800";
    }

    return (
      <Badge variant={variant} className={color}>
        {percentage}% confidence
      </Badge>
    );
  };

  const getValidationStatus = (property: ExtractedProperty) => {
    const requiredFields = [
      "title",
      "propertyType",
      "transactionType",
      "price",
      "size",
      "location",
      "bhk",
      "flatNumber",
      "buildingSociety",
    ];
    const missingFields = requiredFields.filter((field) => !property[field as keyof ExtractedProperty]);

    const listingType = property.listingType || "shared";
    if (listingType === "exclusive" || listingType === "co-listing") {
      if (!property.ownerName) missingFields.push("ownerName");
      if (!property.ownerPhone) missingFields.push("ownerPhone");
      if (!property.commissionTerms) missingFields.push("commissionTerms");
    }

    return {
      isValid: missingFields.length === 0,
      missingFields,
      missingCount: missingFields.length,
    };
  };

  return (
    <div className="flex flex-col min-h-screen pb-20">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-neutral-100 z-10">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center">
            <button
              className="text-primary mr-4"
              onClick={() => router.push("/feed")}
              type="button"
              aria-label="Back to feed"
            >
              <ArrowLeft size={24} />
            </button>
            <div>
              <h2 className="text-lg font-semibold text-neutral-900">QuickPost</h2>
              <p className="text-xs text-neutral-500">AI-powered property extraction</p>
            </div>
          </div>
          <Sparkles size={20} className="text-primary" />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-6 py-6 space-y-6">
        {/* Input Section */}
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
              placeholder={`Paste your property text here... For example:

2 BHK flat for sale in Bandra West, Mumbai
Price: 2.5 Cr
Area: 1200 sq ft
Contact: Rajesh Kumar - 9876543210
Commission: 2%

3 BHK villa for rent in Koramangala, Bangalore
Monthly rent: 75,000
Size: 2000 sq ft
Owner: Priya Sharma - 9123456789`}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              rows={8}
              className="resize-none"
            />

            <div className="flex space-x-2">
              <Button onClick={handleExtract} disabled={extractMutation.isPending || !inputText.trim()} className="flex-1" type="button">
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
                <CardTitle className="text-base">Extracted Properties ({extractedProperties.length})</CardTitle>
                <Button onClick={handleCreateAll} disabled={createMutation.isPending} size="sm" type="button">
                  {createMutation.isPending ? "Creating..." : "Create All Listings"}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {extractedProperties.map((property, index) => {
                const validationStatus = getValidationStatus(property);
                return (
                  <Card
                    key={index}
                    className={`border ${validationStatus.isValid ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="font-semibold text-neutral-900">{property.title || `Property ${index + 1}`}</h3>
                            {!validationStatus.isValid && (
                              <Badge variant="destructive" className="text-xs">
                                {validationStatus.missingCount} fields missing
                              </Badge>
                            )}
                            {validationStatus.isValid && (
                              <Badge variant="default" className="bg-green-100 text-green-800 text-xs">
                                Ready to create
                              </Badge>
                            )}
                          </div>

                          <div className="flex items-center space-x-2 mb-2">
                            <Badge variant="outline">{property.propertyType || "Not specified"}</Badge>
                            <Badge variant="outline">{property.transactionType || "Not specified"}</Badge>
                            {property.bhk && <Badge variant="outline">{property.bhk} BHK</Badge>}
                            {getConfidenceBadge(property.confidence)}
                          </div>

                          {!validationStatus.isValid && (
                            <p className="text-xs text-red-600 mb-2">Missing: {validationStatus.missingFields.join(", ")}</p>
                          )}
                        </div>

                        <div className="flex items-center space-x-1">
                          <Button variant="outline" size="sm" onClick={() => handleEdit(property)} type="button">
                            <Edit3 size={14} />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleRemove(property)} type="button">
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-neutral-500">Price:</span>
                            <span className="ml-2 font-medium">{property.price || "Not specified"}</span>
                          </div>
                          <div>
                            <span className="text-neutral-500">Size:</span>
                            <span className="ml-2">{property.size ? `${property.size} ${property.sizeUnit || "sq.ft"}` : "Not specified"}</span>
                          </div>
                          <div>
                            <span className="text-neutral-500">Location:</span>
                            <span className="ml-2">{property.location || "Not specified"}</span>
                          </div>
                          <div>
                            <span className="text-neutral-500">BHK:</span>
                            <span className="ml-2">{property.bhk || "Not specified"}</span>
                          </div>
                        </div>

                        {validationStatus.missingFields.length > 0 && (
                          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-xs text-red-600 font-medium mb-2">Please fill the missing required fields:</p>
                            <div className="grid grid-cols-2 gap-2">
                              {validationStatus.missingFields.includes("title") && (
                                <div className="col-span-2">
                                  <label className="text-xs text-neutral-600">Property Title</label>
                                  <Input
                                    placeholder="e.g., Beautiful 2 BHK Apartment"
                                    className="h-8 text-xs"
                                    defaultValue={property.title || ""}
                                    onBlur={(e) => {
                                      const updatedProperty = { ...property, title: e.target.value };
                                      setExtractedProperties((prev) => prev.map((p) => (p === property ? updatedProperty : p)));
                                    }}
                                  />
                                </div>
                              )}

                              {validationStatus.missingFields.includes("propertyType") && (
                                <div>
                                  <label className="text-xs text-neutral-600">Property Type</label>
                                  <Select
                                    onValueChange={(value) => {
                                      const updatedProperty = { ...property, propertyType: value };
                                      setExtractedProperties((prev) => prev.map((p) => (p === property ? updatedProperty : p)));
                                    }}
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

                              {validationStatus.missingFields.includes("transactionType") && (
                                <div>
                                  <label className="text-xs text-neutral-600">Transaction Type</label>
                                  <Select
                                    onValueChange={(value) => {
                                      const updatedProperty = { ...property, transactionType: value };
                                      setExtractedProperties((prev) => prev.map((p) => (p === property ? updatedProperty : p)));
                                    }}
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

                              {validationStatus.missingFields.includes("price") && (
                                <div>
                                  <label className="text-xs text-neutral-600">Price</label>
                                  <Input
                                    placeholder="e.g., 50000"
                                    className="h-8 text-xs"
                                    defaultValue={property.price || ""}
                                    onBlur={(e) => {
                                      const updatedProperty = { ...property, price: e.target.value };
                                      setExtractedProperties((prev) => prev.map((p) => (p === property ? updatedProperty : p)));
                                    }}
                                  />
                                </div>
                              )}

                              {validationStatus.missingFields.includes("size") && (
                                <div>
                                  <label className="text-xs text-neutral-600">Size</label>
                                  <Input
                                    placeholder="e.g., 1200"
                                    className="h-8 text-xs"
                                    defaultValue={property.size || ""}
                                    onBlur={(e) => {
                                      const updatedProperty = { ...property, size: e.target.value };
                                      setExtractedProperties((prev) => prev.map((p) => (p === property ? updatedProperty : p)));
                                    }}
                                  />
                                </div>
                              )}

                              {validationStatus.missingFields.includes("location") && (
                                <div className="col-span-2">
                                  <label className="text-xs text-neutral-600">Location</label>
                                  <Input
                                    placeholder="e.g., Bandra West, Mumbai"
                                    className="h-8 text-xs"
                                    defaultValue={property.location || ""}
                                    onBlur={(e) => {
                                      const updatedProperty = { ...property, location: e.target.value };
                                      setExtractedProperties((prev) => prev.map((p) => (p === property ? updatedProperty : p)));
                                    }}
                                  />
                                </div>
                              )}

                              {validationStatus.missingFields.includes("bhk") && (
                                <div>
                                  <label className="text-xs text-neutral-600">BHK</label>
                                  <Input
                                    type="number"
                                    placeholder="e.g., 2"
                                    className="h-8 text-xs"
                                    defaultValue={property.bhk?.toString() || ""}
                                    onBlur={(e) => {
                                      const updatedProperty = { ...property, bhk: parseInt(e.target.value) || undefined };
                                      setExtractedProperties((prev) => prev.map((p) => (p === property ? updatedProperty : p)));
                                    }}
                                  />
                                </div>
                              )}

                              {validationStatus.missingFields.includes("flatNumber") && (
                                <div>
                                  <label className="text-xs text-neutral-600">Flat/Unit Number</label>
                                  <Input
                                    placeholder="e.g., A-101"
                                    className="h-8 text-xs"
                                    defaultValue={property.flatNumber || ""}
                                    onBlur={(e) => {
                                      const updatedProperty = { ...property, flatNumber: e.target.value };
                                      setExtractedProperties((prev) => prev.map((p) => (p === property ? updatedProperty : p)));
                                    }}
                                  />
                                </div>
                              )}

                              {validationStatus.missingFields.includes("buildingSociety") && (
                                <div className="col-span-2">
                                  <label className="text-xs text-neutral-600">Building/Society Name</label>
                                  <GooglePlacesAutocomplete
                                    value={property.buildingSociety || ""}
                                    onChange={(value) => {
                                      const updatedProperty = { ...property, buildingSociety: value };
                                      setExtractedProperties((prev) => prev.map((p) => (p === property ? updatedProperty : p)));
                                    }}
                                    placeholder="Search for building or society..."
                                    types={["establishment"]}
                                    className="text-xs"
                                  />
                                </div>
                              )}

                              {validationStatus.missingFields.includes("ownerName") && (
                                <div>
                                  <label className="text-xs text-neutral-600">Owner Name</label>
                                  <Input
                                    placeholder="e.g., John Doe"
                                    className="h-8 text-xs"
                                    defaultValue={property.ownerName || ""}
                                    onBlur={(e) => {
                                      const updatedProperty = { ...property, ownerName: e.target.value };
                                      setExtractedProperties((prev) => prev.map((p) => (p === property ? updatedProperty : p)));
                                    }}
                                  />
                                </div>
                              )}

                              {validationStatus.missingFields.includes("ownerPhone") && (
                                <div>
                                  <label className="text-xs text-neutral-600">Owner Phone</label>
                                  <Input
                                    placeholder="e.g., 9999999999"
                                    className="h-8 text-xs"
                                    defaultValue={property.ownerPhone || ""}
                                    onBlur={(e) => {
                                      const updatedProperty = { ...property, ownerPhone: e.target.value };
                                      setExtractedProperties((prev) => prev.map((p) => (p === property ? updatedProperty : p)));
                                    }}
                                  />
                                </div>
                              )}

                              {validationStatus.missingFields.includes("commissionTerms") && (
                                <div className="col-span-2">
                                  <label className="text-xs text-neutral-600">Commission Terms</label>
                                  <Input
                                    placeholder="e.g., 2% of property value"
                                    className="h-8 text-xs"
                                    defaultValue={property.commissionTerms || ""}
                                    onBlur={(e) => {
                                      const updatedProperty = { ...property, commissionTerms: e.target.value };
                                      setExtractedProperties((prev) => prev.map((p) => (p === property ? updatedProperty : p)));
                                    }}
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {property.description && (
                          <p className="text-sm text-neutral-600 mt-3 p-2 bg-neutral-50 rounded">{property.description}</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto">
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
                          <Input placeholder="2500000" {...field} />
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
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
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
                          <GooglePlacesAutocomplete value={field.value || ""} onChange={(v) => field.onChange(v)} placeholder="Search for building or society..." types={["establishment"]} />
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
                </div>

                <div className="flex space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)} className="flex-1">
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
