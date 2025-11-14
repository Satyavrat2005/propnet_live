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

import { ArrowLeft, Shield, Upload } from "lucide-react";

import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { UseFormReturn, useForm } from "react-hook-form";

import FileUpload from "@/components/ui/file-upload";
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
};

function PropertyForm({
  form,
  onSubmit,
  selectedFiles,
  setSelectedFiles,
  agreementFiles,
  setAgreementFiles,
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

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" autoComplete="off">
        {/* Property Details */}
        <Card className="bg-white border-gray-200">
          <CardHeader className="bg-white border-b border-gray-100">
            <CardTitle className="text-base font-semibold text-gray-900">
              Property Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-6 bg-white">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700 font-medium">Property Title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Beautiful 2 BHK Apartment..."
                      {...field}
                      autoComplete="off"
                      className="bg-white border-gray-300 focus:border-primary focus:ring-primary"
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
                    <FormLabel className="text-gray-700 font-medium">Property Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-white border-gray-300">
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
                    <FormLabel className="text-gray-700 font-medium">Transaction Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-white border-gray-300">
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
                    <FormLabel className="text-gray-700 font-medium">BHK (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="2"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        autoComplete="off"
                        className="bg-white border-gray-300 focus:border-primary focus:ring-primary"
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
                    <FormLabel className="text-gray-700 font-medium">Area</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="1200"
                        {...field}
                        autoComplete="off"
                        className="bg-white border-gray-300 focus:border-primary focus:ring-primary"
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
                    <FormLabel className="text-gray-700 font-medium">Area Unit</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-white border-gray-300">
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
                    <FormLabel className="text-gray-700 font-medium">
                      {form.watch("transactionType") === "rent" ? "Monthly Rent" : "Sale Price"}
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={form.watch("transactionType") === "rent" ? "₹25,000/month" : "₹50 Lakhs"}
                        {...field}
                        autoComplete="off"
                        className="bg-white border-gray-300 focus:border-primary focus:ring-primary"
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
                      <FormLabel className="text-gray-700 font-medium">Rent Frequency</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-white border-gray-300">
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

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700 font-medium">Location (Area, City)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Bandra West, Mumbai"
                      {...field}
                      autoComplete="off"
                      className="bg-white border-gray-300 focus:border-primary focus:ring-primary"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="fullAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700 font-medium">Full Address</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Complete address with landmarks..."
                      className="resize-none bg-white border-gray-300 focus:border-primary focus:ring-primary"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="flatNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-medium">Flat/Unit No.</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="A-101"
                        {...field}
                        autoComplete="off"
                        className="bg-white border-gray-300 focus:border-primary focus:ring-primary"
                      />
                    </FormControl>
                    <p className="text-xs text-gray-500 mt-1">Encrypted & used only for verification</p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="floorNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-medium">Floor No.</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="3rd Floor"
                        {...field}
                        autoComplete="off"
                        className="bg-white border-gray-300 focus:border-primary focus:ring-primary"
                      />
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
                    <FormLabel className="text-gray-700 font-medium">Building/Society</FormLabel>
                    <FormControl>
                      <GooglePlacesAutocomplete
                        value={field.value || ""}
                        onChange={(value) => field.onChange(value)}
                        placeholder="Search building..."
                        types={["establishment"]}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700 font-medium">Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Property details, amenities, nearby facilities..."
                      className="resize-none bg-white border-gray-300 focus:border-primary focus:ring-primary"
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">
                Property Photos (Up to 10)
              </label>
              <FileUpload onFilesChange={setSelectedFiles} maxFiles={10} />
            </div>
          </CardContent>
        </Card>

        {/* Listing Type */}
        <Card className="bg-white border-gray-200">
          <CardHeader className="bg-white border-b border-gray-100">
            <CardTitle className="text-base font-semibold text-gray-900">
              Listing Type
            </CardTitle>
          </CardHeader>
        <CardContent className="pt-6 bg-white">
          <FormField
            control={form.control}
            name="listingType"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg hover:border-primary transition-colors">
                      <input
                        type="radio"
                        id="exclusive"
                        value="exclusive"
                        checked={field.value === "exclusive"}
                        onChange={() => field.onChange("exclusive")}
                        className="mt-1"
                      />
                      <label htmlFor="exclusive" className="flex-1 cursor-pointer">
                        <div className="font-medium text-gray-900">Exclusive</div>
                        <div className="text-sm text-gray-600">Only I can list and share it</div>
                      </label>
                    </div>
                    <div className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg hover:border-primary transition-colors">
                      <input
                        type="radio"
                        id="colisting"
                        value="colisting"
                        checked={field.value === "colisting"}
                        onChange={() => field.onChange("colisting")}
                        className="mt-1"
                      />
                      <label htmlFor="colisting" className="flex-1 cursor-pointer">
                        <div className="font-medium text-gray-900">Allow Co-Listing</div>
                        <div className="text-sm text-gray-600">Multiple agents can list with permission</div>
                      </label>
                    </div>
                    <div className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg hover:border-primary transition-colors">
                      <input
                        type="radio"
                        id="shared"
                        value="shared"
                        checked={field.value === "shared"}
                        onChange={() => field.onChange("shared")}
                        className="mt-1"
                      />
                      <label htmlFor="shared" className="flex-1 cursor-pointer">
                        <div className="font-medium text-gray-900">Shared Within Network</div>
                        <div className="text-sm text-gray-600">Platform-controlled visibility</div>
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
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-lg border border-gray-200 p-4 mt-4 bg-white">
                <FormControl>
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel className="text-gray-900 font-medium">
                    Allow this property to appear in public agent feed and search?
                  </FormLabel>
                  <p className="text-xs text-gray-600">
                    Enable to make this listing visible in general search and feed. Disable for private listing sharing only.
                  </p>
                </div>
              </FormItem>
            )}
          />
        </CardContent>
        </Card>

        {/* Owner Details */}
        <Card className="bg-white border-gray-200">
          <CardHeader className="bg-white border-b border-gray-100">
            <CardTitle className="text-base font-semibold text-gray-900 flex items-center">
              <Shield size={16} className="mr-2 text-green-600" />
              Owner Details (Encrypted & Secure)
            </CardTitle>
            <p className="text-xs text-gray-600 mt-1">
              Owner will receive a consent request with clear terms
            </p>
          </CardHeader>
          <CardContent className="space-y-4 pt-6 bg-white">
            <FormField
              control={form.control}
              name="ownerName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700 font-medium">Owner Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Property owner's full name"
                      {...field}
                      autoComplete="off"
                      className="bg-white border-gray-300 focus:border-primary focus:ring-primary"
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
                  <FormLabel className="text-gray-700 font-medium">Owner Phone Number</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="+91 9876543210"
                      {...field}
                      autoComplete="off"
                      className="bg-white border-gray-300 focus:border-primary focus:ring-primary"
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
                  <FormLabel className="text-gray-700 font-medium">Commission Terms</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="2% of sale value"
                      {...field}
                      autoComplete="off"
                      className="bg-white border-gray-300 focus:border-primary focus:ring-primary"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">Scope of Work</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {scopeOfWorkOptions.map((option) => {
                  const checked = form.watch("scopeOfWork")?.includes(option);
                  return (
                    <div key={option} className="flex items-center space-x-2 p-2 border border-gray-200 rounded-md bg-white">
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
                      <label htmlFor={option} className="text-sm text-gray-700 cursor-pointer">
                        {option}
                      </label>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">Agreement Document (Optional)</label>
              <FileUpload onFilesChange={setAgreementFiles} maxFiles={1} />
              <p className="text-xs text-gray-500 mt-1">Upload agent agreement or authorization letter</p>
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
            className="flex-1 bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </Button>
          <Button type="submit" className="flex-1">
            Create Listing
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
      listingType: "exclusive",
      isPubliclyVisible: false,
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
          "Owner approval request has been sent. Property will go live after approval.",
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
    const errors = form.formState.errors;
    if (Object.keys(errors).length > 0) {
      const errorFields = Object.keys(errors).join(", ");
      toast({
        title: "Form Validation Error",
        description: `Please fix the following fields: ${errorFields}`,
        variant: "destructive",
      });
      return;
    }
    
    
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

    createPropertyMutation.mutate(formData);
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header (unchanged) */}
      <div className="sticky top-0 bg-white border-b border-neutral-100 z-10">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center">
            <button className="text-primary mr-4 hover:opacity-80" onClick={handleBack} type="button" aria-label="Go back">
              <ArrowLeft size={24} />
            </button>
            <h2 className="text-lg font-semibold text-neutral-900">
              Add Property
            </h2>
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

      {/* Body (same UI/content as my-listings form) */}
      <div className="flex-1 px-6 py-6 pb-20">
        <PropertyForm
          form={form}
          onSubmit={handleSubmit}
          selectedFiles={selectedFiles}
          setSelectedFiles={setSelectedFiles}
          agreementFiles={agreementFiles}
          setAgreementFiles={setAgreementFiles}
        />
      </div>
    </div>
  );
}
