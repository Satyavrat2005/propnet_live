// app/add-property/page.tsx
"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { Shield, Upload, Home, Building2, FileText, CheckCircle2 } from "lucide-react";

import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { UseFormReturn, useForm } from "react-hook-form";

import FileUpload from "@/components/ui/file-upload";
import { AppLayout } from "@/components/layout/app-layout";

import GooglePlacesAutocomplete from "@/components/ui/google-places-autocomplete";
import { insertPropertySchema } from "@/lib/schema";

// Use the exact same schema as your my-listings modal
const propertyFormSchema = insertPropertySchema;
type PropertyFormValues = z.infer<typeof propertyFormSchema>;

type PropertyFormProps = {
  form: UseFormReturn<PropertyFormValues>;
  onSubmit: (values: PropertyFormValues) => void;
  selectedFiles: File[];
  setSelectedFiles: (files: File[]) => void;
  agreementFiles: File[];
  setAgreementFiles: (files: File[]) => void;
  isPending?: boolean;
};

function PropertyForm({
  form,
  onSubmit,
  selectedFiles,
  setSelectedFiles,
  agreementFiles,
  setAgreementFiles,
  isPending = false,
}: PropertyFormProps) {
  // memoized to keep the same reference across renders (prevents re-renders affecting focus)
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

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("[FORM] Form submit triggered");
    console.log("[FORM] Form values:", form.getValues());
    console.log("[FORM] Form errors:", form.formState.errors);
    console.log("[FORM] Form isValid:", form.formState.isValid);
    
    const result = await form.trigger(); // Manually trigger validation
    console.log("[FORM] Validation result:", result);
    console.log("[FORM] Errors after validation:", form.formState.errors);
    
    if (result) {
      console.log("[FORM] Calling onSubmit...");
      onSubmit(form.getValues());
    } else {
      console.log("[FORM] Validation failed, not submitting");
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={handleFormSubmit} className="space-y-6" autoComplete="off">
        {/* Property Details */}
        <Card className="card-modern group hover:shadow-lg transition-all duration-300 hover:border-blue-500/40">
          <CardHeader className="border-b bg-linear-to-r from-blue-500/5 to-blue-500/10">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg group-hover:bg-blue-500/20 transition-colors">
                <Home className="w-5 h-5 text-blue-600" />
              </div>
              <CardTitle className="text-base font-semibold text-foreground">
                Property Details
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-muted-foreground">Property Title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Beautiful 2 BHK Apartment..."
                      {...field}
                      autoComplete="off"
                      className="input-modern"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="propertyType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-muted-foreground">Property Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="input-modern">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-white">
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
                    <FormLabel className="text-sm font-medium text-muted-foreground">Transaction Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="input-modern">
                          <SelectValue placeholder="Select transaction" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-white">
                        <SelectItem value="sale">Sale</SelectItem>
                        <SelectItem value="rent">Rent</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="bhk"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-muted-foreground">BHK (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="2"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        autoComplete="off"
                        className="input-modern"
                      />
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
                    <FormLabel className="text-sm font-medium text-muted-foreground">Area</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="1200"
                        {...field}
                        autoComplete="off"
                        className="input-modern"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sizeUnit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-muted-foreground">Area Unit</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="input-modern">
                          <SelectValue placeholder="Select unit" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-white">
                        <SelectItem value="sq.ft">Square Feet (sq.ft)</SelectItem>
                        <SelectItem value="sq.m">Square Meters (sq.m)</SelectItem>
                        <SelectItem value="sq.yd">Square Yards (sq.yd)</SelectItem>
                        <SelectItem value="acre">Acres</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-muted-foreground">
                      {form.watch("transactionType") === "rent" ? "Monthly Rent" : "Sale Price"}
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={form.watch("transactionType") === "rent" ? "₹25,000/month" : "₹50 Lakhs"}
                        {...field}
                        autoComplete="off"
                        className="input-modern"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {form.watch("transactionType") === "rent" && (
                <FormField
                  control={form.control}
                  name="rentFrequency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-muted-foreground">Rent Frequency</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="input-modern">
                            <SelectValue placeholder="Select frequency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-white">
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="yearly">Yearly</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="flatNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-muted-foreground">Flat/Unit Number</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Flat 301"
                        {...field}
                        autoComplete="off"
                        className="input-modern"
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
                    <FormLabel className="text-sm font-medium text-muted-foreground">Floor Number</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="8"
                        {...field}
                        autoComplete="off"
                        className="input-modern"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="buildingSociety"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-muted-foreground">Building / Society</FormLabel>
                  <FormControl>
                    <GooglePlacesAutocomplete
                      value={field.value || ""}
                      onChange={(value) => field.onChange(value)}
                      placeholder="Search building or society"
                      types={["establishment"]}
                      extractValue={(suggestion) => suggestion.structured_formatting.main_text || suggestion.description}
                      inputClassName="input-modern"
                      className="w-full"
                    />
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
                  <FormLabel className="text-sm font-medium text-muted-foreground">Location</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Andheri West, Mumbai"
                      {...field}
                      autoComplete="off"
                      className="input-modern"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-muted-foreground">Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Property details, amenities, nearby facilities..."
                      className="resize-none input-modern"
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <label className="text-sm font-medium text-muted-foreground block mb-2">
                Property Photos (Up to 10)
              </label>
              <FileUpload onFilesChange={setSelectedFiles} maxFiles={10} />
            </div>
          </CardContent>
        </Card>

        {/* Listing Type */}
        <Card className="card-modern group hover:shadow-lg transition-all duration-300 hover:border-blue-500/40">
          <CardHeader className="border-b bg-linear-to-r from-blue-500/5 to-blue-500/10">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg group-hover:bg-blue-500/20 transition-colors">
                <Building2 className="w-5 h-5 text-blue-600" />
              </div>
              <CardTitle className="text-base font-semibold text-foreground">
                Listing Type
              </CardTitle>
            </div>
          </CardHeader>
        <CardContent className="pt-6">
          <FormField
            control={form.control}
            name="listingType"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3 p-4 bento-card group hover:border-blue-500/40">
                      <Checkbox
                        id="exclusive"
                        checked={field.value === "exclusive"}
                        onCheckedChange={(checked) => field.onChange(checked ? "exclusive" : "shared")}
                        className="mt-1"
                      />
                      <label htmlFor="exclusive" className="flex-1 cursor-pointer">
                        <div className="font-semibold text-foreground group-hover:text-blue-600 transition-colors">Exclusive</div>
                        <div className="text-sm text-muted-foreground">Only I can list and share it</div>
                      </label>
                    </div>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="isPubliclyVisible"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 bento-card p-4 mt-4 hover:border-blue-500/40">
                <FormControl>
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} className="mt-1" />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel className="text-foreground font-semibold cursor-pointer">
                    Allow this property to appear in public agent feed and search?
                  </FormLabel>
                  <p className="text-sm text-muted-foreground">
                    Enable to make this listing visible in general search and feed. Disable for private listing sharing only.
                  </p>
                </div>
              </FormItem>
            )}
          />
        </CardContent>
        </Card>

        {/* Owner Details */}
        <Card className="card-modern group hover:shadow-lg transition-all duration-300 hover:border-blue-500/40">
          <CardHeader className="border-b bg-linear-to-r from-blue-500/5 to-blue-500/10">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg group-hover:bg-blue-500/20 transition-colors">
                <Shield className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-base font-semibold text-foreground flex items-center">
                  Owner Details (Encrypted & Secure)
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  Owner will receive a consent request with clear terms
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <FormField
              control={form.control}
              name="ownerName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-muted-foreground">Owner Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Property owner's full name"
                      {...field}
                      autoComplete="off"
                      className="input-modern"
                    />
                  </FormControl>
                  <p className="text-xs text-gray-500">This information is encrypted and never shared publicly</p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="ownerPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-muted-foreground">Owner Phone Number</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="+91 9876543210"
                      {...field}
                      autoComplete="off"
                      className="input-modern"
                    />
                  </FormControl>
                  <p className="text-xs text-gray-500">Required for verification and trust</p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="commissionTerms"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-muted-foreground">Commission Terms</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="2% of sale value"
                      {...field}
                      autoComplete="off"
                      className="input-modern"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <label className="text-sm font-medium text-muted-foreground block mb-3">Scope of Work</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {scopeOfWorkOptions.map((option) => {
                  const checked = form.watch("scopeOfWork")?.includes(option);
                  return (
                    <div key={option} className="flex items-center space-x-2 p-3 bento-card cursor-pointer hover:border-blue-500/40">
                      <Checkbox
                        id={option}
                        checked={!!checked}
                        onCheckedChange={(isChecked) => {
                          const current = form.getValues("scopeOfWork") || [];
                          if (isChecked) {
                            form.setValue("scopeOfWork", [...current, option]);
                          } else {
                            form.setValue(
                              "scopeOfWork",
                              current.filter((i: string) => i !== option)
                            );
                          }
                        }}
                      />
                      <label htmlFor={option} className="text-sm text-foreground cursor-pointer font-medium">
                        {option}
                      </label>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              form.reset();
              window.history.length > 1 ? window.history.back() : null;
            }}
            className="flex-1 border-gray-300 hover:border-blue-500/40 hover:bg-blue-50 hover:text-blue-700 transition-all"
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={isPending}
            className="flex-1 bg-linear-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white relative overflow-hidden group"
          >
            {isPending ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Creating...
              </div>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                Create Listing
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}

export default function AddPropertyPage() {
  const router = useRouter();
  const { toast } = useToast();

  // local uploads (align with my-listings modal)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [agreementFiles, setAgreementFiles] = useState<File[]>([]);

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/dashboard");
    }
  };


  const form = useForm<PropertyFormValues>({
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

  // IMPORTANT: send FormData via native fetch (no JSON headers)
  const createPropertyMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const res = await fetch("/api/my-properties", {
        method: "POST",
        body: data,
        credentials: "same-origin",
      });
      const json = await res.json();
      if (!res.ok) throw { response: { data: json } };
      return json;
    },
    onSuccess: () => {
      form.reset();
      setSelectedFiles([]);
      setAgreementFiles([]);
      toast({
        title: "Property Listed Successfully",
        description:
          "Owner approval request has been sent. Property will go live after approval. Note: Your listing will expire in 30 days and can be renewed for another 30 days period.",
      });
      router.push("/my-listings");
    },
    onError: (error: any) => {
      const msg =
        error?.response?.data?.message ||
        "Failed to create property listing. Please try again.";
      toast({ title: "Error", description: msg, variant: "destructive" });
    },
  });

  const handleSubmit = (values: PropertyFormValues) => {
    console.log("[ADD-PROPERTY] Form submitted with values:", values);
    const errors = form.formState.errors;
    console.log("[ADD-PROPERTY] Form errors:", errors);
    
    if (Object.keys(errors).length > 0) {
      const errorFields = Object.keys(errors).join(", ");
      toast({
        title: "Form Validation Error",
        description: `Please fix the following fields: ${errorFields}`,
        variant: "destructive",
      });
      return;
    }
    
    console.log("[ADD-PROPERTY] Creating FormData...");
    const formData = new FormData();

    Object.entries(values).forEach(([key, value]) => {
      if (key === "scopeOfWork" && Array.isArray(value)) {
        formData.append(key, JSON.stringify(value));
      } else if (value !== undefined && value !== null && value !== "") {
        formData.append(key, value.toString());
      }
    });

    selectedFiles.forEach((file) => formData.append("photos", file));
    if (agreementFiles.length > 0)
      formData.append("agreementDocument", agreementFiles[0]);

    console.log("[ADD-PROPERTY] Submitting mutation...");
    createPropertyMutation.mutate(formData);
  };

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto w-full">
        {/* Page Header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground">Add Property</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Create a new property listing with owner consent
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/bulk-upload")}
              className="flex items-center gap-2 border-gray-300 hover:border-blue-500/40 hover:bg-blue-50 hover:text-blue-700 transition-all"
            >
              <Upload size={16} />
              <span>Bulk Upload</span>
            </Button>
          </div>
        </div>

        {/* Form */}
        <PropertyForm
          form={form}
          onSubmit={handleSubmit}
          selectedFiles={selectedFiles}
          setSelectedFiles={setSelectedFiles}
          agreementFiles={agreementFiles}
          setAgreementFiles={setAgreementFiles}
          isPending={createPropertyMutation.isPending}
        />
      </div>
    </AppLayout>
  );
}
