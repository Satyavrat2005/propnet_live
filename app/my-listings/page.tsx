"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { useForm, UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ArrowLeft,
  Plus,
  Building2,
  MapPin,
  Clock,
  Shield,
  Eye,
  EyeOff,
  Phone,
  User,
  CheckCircle,
  XCircle,
  AlertCircle,
  Download,
  Edit,
  Trash2,
  MoreVertical
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { safeFetch } from "@/lib/safeFetch";
import { insertPropertySchema } from "@/lib/schema";
import FileUpload from "@/components/ui/file-upload";
import MobileNavigation from "@/components/layout/mobile-navigation";
import GooglePlacesAutocomplete from "@/components/ui/google-places-autocomplete";
import { z } from "zod";

const propertyFormSchema = insertPropertySchema;
type PropertyFormValues = z.infer<typeof propertyFormSchema>;

type PropertyFormProps = {
  form: UseFormReturn<PropertyFormValues>;
  onSubmit: (values: PropertyFormValues) => void;
  selectedFiles: File[];
  setSelectedFiles: (files: File[]) => void;
  agreementFiles: File[];
  setAgreementFiles: (files: File[]) => void;
  editingProperty: any;
  onCancel: () => void;
};

function PropertyForm({
  form,
  onSubmit,
  selectedFiles,
  setSelectedFiles,
  agreementFiles,
  setAgreementFiles,
  editingProperty,
  onCancel,
}: PropertyFormProps) {
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
        <Card className="bg-white border-gray-200">
          <CardHeader className="bg-white border-b border-gray-100">
            <CardTitle className="text-base font-semibold text-gray-900">Property Details</CardTitle>
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
              <label className="text-sm font-medium text-gray-700 block mb-2">Property Photos (Up to 10)</label>
              <FileUpload onFilesChange={setSelectedFiles} maxFiles={10} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-200">
          <CardHeader className="bg-white border-b border-gray-100">
            <CardTitle className="text-base font-semibold text-gray-900">Listing Type</CardTitle>
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
                          id={editingProperty ? "exclusive-edit" : "exclusive"}
                          value="exclusive"
                          checked={field.value === "exclusive"}
                          onChange={() => field.onChange("exclusive")}
                          className="mt-1"
                        />
                        <label htmlFor={editingProperty ? "exclusive-edit" : "exclusive"} className="flex-1 cursor-pointer">
                          <div className="font-medium text-gray-900">Exclusive</div>
                          <div className="text-sm text-gray-600">Only I can list and share it</div>
                        </label>
                      </div>
                      <div className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg hover:border-primary transition-colors">
                        <input
                          type="radio"
                          id={editingProperty ? "colisting-edit" : "colisting"}
                          value="colisting"
                          checked={field.value === "colisting"}
                          onChange={() => field.onChange("colisting")}
                          className="mt-1"
                        />
                        <label htmlFor={editingProperty ? "colisting-edit" : "colisting"} className="flex-1 cursor-pointer">
                          <div className="font-medium text-gray-900">Allow Co-Listing</div>
                          <div className="text-sm text-gray-600">Multiple agents can list with permission</div>
                        </label>
                      </div>
                      <div className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg hover:border-primary transition-colors">
                        <input
                          type="radio"
                          id={editingProperty ? "shared-edit" : "shared"}
                          value="shared"
                          checked={field.value === "shared"}
                          onChange={() => field.onChange("shared")}
                          className="mt-1"
                        />
                        <label htmlFor={editingProperty ? "shared-edit" : "shared"} className="flex-1 cursor-pointer">
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
                {["Property Viewing Coordination", "Marketing & Promotion", "Documentation Support", "Negotiation Assistance", "Legal Compliance Check", "Market Analysis"].map((option) => (
                  <div key={option} className="flex items-center space-x-2 p-2 border border-gray-200 rounded-md bg-white">
                    <Checkbox
                      id={editingProperty ? `${option}-edit` : option}
                      checked={form.watch("scopeOfWork")?.includes(option)}
                      onCheckedChange={(checked) => {
                        const current = form.getValues("scopeOfWork") || [];
                        if (checked) form.setValue("scopeOfWork", [...current, option]);
                        else form.setValue("scopeOfWork", current.filter((item: string) => item !== option));
                      }}
                    />
                    <label htmlFor={editingProperty ? `${option}-edit` : option} className="text-sm text-gray-700 cursor-pointer">
                      {option}
                    </label>
                  </div>
                ))}
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
              onCancel();
            }}
            className="flex-1 bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </Button>
          <Button type="submit" className="flex-1">
            {editingProperty ? "Save Changes" : "Create Listing"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

export default function MyListings() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<any>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [agreementFiles, setAgreementFiles] = useState<File[]>([]);
  const [showOwnerPhone, setShowOwnerPhone] = useState<{ [key: string]: boolean }>({});

  const { data: myProperties = [], isLoading } = useQuery({
    queryKey: ["/api/my-properties"],
    queryFn: () => safeFetch("/api/my-properties", []),
    enabled: !!user,
  });

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
      const res = await fetch("/api/my-properties", { method: "POST", body: data, credentials: "same-origin" });
      const json = await res.json();
      if (!res.ok) throw { response: { data: json } };
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-properties"] });
      setIsAddDialogOpen(false);
      form.reset();
      setSelectedFiles([]);
      setAgreementFiles([]);
      toast({
        title: "Property Listed Successfully",
        description: "Owner approval request has been sent. Property will go live after approval.",
      });
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || "Failed to create property listing. Please try again.";
      toast({ title: "Error", description: msg, variant: "destructive" });
    },
  });

  const updatePropertyMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: FormData }) => {
      console.log('[UPDATE] Updating property with ID:', id);
      const res = await fetch(`/api/properties/${id}`, { method: "PUT", body: data, credentials: "same-origin" });
      const json = await res.json();
      if (!res.ok) {
        console.error('[UPDATE] Failed:', json);
        throw { response: { data: json } };
      }
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-properties"] });
      setIsEditDialogOpen(false);
      setEditingProperty(null);
      form.reset();
      setSelectedFiles([]);
      setAgreementFiles([]);
      toast({ 
        title: "Property Updated Successfully", 
        description: "Owner approval request has been sent. Property will be updated after approval." 
      });
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || "Failed to update property listing. Please try again.";
      toast({ title: "Error", description: msg, variant: "destructive" });
    },
  });

  const deletePropertyMutation = useMutation({
    mutationFn: async (id: string) => {
      console.log('[DELETE] Deleting property with ID:', id);
      const res = await fetch(`/api/properties/${id}`, { method: "DELETE", credentials: "same-origin" });
      const json = await res.json();
      if (!res.ok) {
        console.error('[DELETE] Failed:', json);
        throw { response: { data: json } };
      }
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-properties"] });
      toast({ title: "Property Deleted", description: "Your property listing has been deleted successfully." });
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || "Failed to delete property listing. Please try again.";
      toast({ title: "Error", description: msg, variant: "destructive" });
    },
  });

  const onSubmit = (values: PropertyFormValues) => {
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
    if (editingProperty && selectedFiles.length === 0 && Array.isArray(editingProperty.photos)) {
      formData.append("existingPhotos", JSON.stringify(editingProperty.photos));
    }
    if (agreementFiles.length > 0) formData.append("agreementDocument", agreementFiles[0]);

    if (editingProperty) {
      updatePropertyMutation.mutate({ id: editingProperty.id, data: formData });
    } else {
      createPropertyMutation.mutate(formData);
    }
  };

  const handleEdit = (property: any) => {
    setEditingProperty(property);
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
      listingType: property.listingType || "exclusive",
      isPubliclyVisible: property.isPubliclyVisible || false,
      ownerName: property.ownerName || "",
      ownerPhone: property.ownerPhone || "",
      commissionTerms: property.commissionTerms || "",
      scopeOfWork: property.scopeOfWork || [],
    });
    setSelectedFiles([]);
    setAgreementFiles([]);
    setIsEditDialogOpen(true);
  };

  const handleDelete = (id: string) => deletePropertyMutation.mutate(id);

  const handlePdfDownload = async (propertyId: string, propertyTitle: string) => {
    try {
      console.log('[PDF] Downloading PDF for property:', propertyId);
      const response = await fetch(`/api/properties/${propertyId}/pdf`, {
        credentials: "same-origin",
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[PDF] Failed:', errorText);
        throw new Error("Failed to generate PDF");
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = `${propertyTitle.replace(/[^a-zA-Z0-9]/g, "_")}_listing.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast({ title: "PDF Downloaded", description: "Property listing PDF has been downloaded successfully." });
    } catch (err) {
      console.error('[PDF] Error:', err);
      toast({ title: "Download Failed", description: "Failed to download PDF. Please try again.", variant: "destructive" });
    }
  };

  const toggleOwnerPhone = (propertyId: string) =>
    setShowOwnerPhone((p) => ({ ...p, [propertyId]: !p[propertyId] }));

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/feed");
    }
  };


  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle size={12} className="mr-1" />
            Approved
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-red-100 text-red-800">
            <XCircle size={12} className="mr-1" />
            Rejected
          </Badge>
        );
      default:
        return (
          <Badge className="bg-yellow-100 text-yellow-800">
            <AlertCircle size={12} className="mr-1" />
            Pending Approval
          </Badge>
        );
    }
  };

  return (
    <div className="flex flex-col min-h-screen pb-20 bg-gray-50">
      <div className="sticky top-0 bg-white border-b border-gray-200 z-10">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center">
          <button className="text-primary mr-4 hover:opacity-80" onClick={handleBack} type="button" aria-label="Go back">
              <ArrowLeft size={24} />
            </button>
            <h2 className="text-lg font-semibold text-gray-900">My Listings</h2>
          </div>

          <Dialog
            open={isAddDialogOpen}
            onOpenChange={(open) => {
              setIsAddDialogOpen(open);
              if (!open) {
                setEditingProperty(null);
                form.reset();
                setSelectedFiles([]);
                setAgreementFiles([]);
              }
            }}
          >
            <DialogTrigger asChild>
              <Button size="sm" className="flex items-center space-x-2" onClick={() => setIsAddDialogOpen(true)}>
                <Plus size={16} />
                <span>Add Listing</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="w/[95vw] max-w-2xl max-h-[90vh] overflow-y-auto bg-white">
              <DialogHeader className="bg-white pb-4 border-b border-gray-100">
                <DialogTitle className="text-xl font-semibold text-gray-900">Create New Property Listing</DialogTitle>
                <DialogDescription className="flex items-center text-gray-600">
                  <Shield size={14} className="inline mr-1 text-green-600" />
                  Your data is secure. All sensitive information is stored safely and never displayed without explicit permission.
                </DialogDescription>
              </DialogHeader>

              <PropertyForm
                form={form}
                onSubmit={onSubmit}
                selectedFiles={selectedFiles}
                setSelectedFiles={setSelectedFiles}
                agreementFiles={agreementFiles}
                setAgreementFiles={setAgreementFiles}
                editingProperty={editingProperty}
                onCancel={() => {
                  setIsAddDialogOpen(false);
                  setEditingProperty(null);
                  setSelectedFiles([]);
                  setAgreementFiles([]);
                }}
              />
            </DialogContent>
          </Dialog>

          <Dialog
            open={isEditDialogOpen}
            onOpenChange={(open) => {
              setIsEditDialogOpen(open);
              if (!open) {
                setEditingProperty(null);
                form.reset();
                setSelectedFiles([]);
                setAgreementFiles([]);
              }
            }}
          >
            <DialogContent className="w/[95vw] max-w-2xl max-h-[90vh] overflow-y-auto bg-white">
              <DialogHeader className="bg-white pb-4 border-gray-100">
                <DialogTitle className="text-xl font-semibold text-gray-900">Edit Property Listing</DialogTitle>
                <DialogDescription className="flex items-center text-gray-600">
                  <Shield size={14} className="inline mr-1 text-green-600" />
                  Update your property information. Changes will be saved immediately.
                </DialogDescription>
              </DialogHeader>

              <PropertyForm
                form={form}
                onSubmit={onSubmit}
                selectedFiles={selectedFiles}
                setSelectedFiles={setSelectedFiles}
                agreementFiles={agreementFiles}
                setAgreementFiles={setAgreementFiles}
                editingProperty={editingProperty}
                onCancel={() => {
                  setIsEditDialogOpen(false);
                  setEditingProperty(null);
                  setSelectedFiles([]);
                  setAgreementFiles([]);
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex-1 px-6 py-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : (myProperties as any[])?.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <Building2 size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-700 mb-2">No listings yet</h3>
            <p className="text-gray-500 mb-4">Create your first property listing to get started</p>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus size={16} className="mr-2" />
              Add Your First Listing
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {(myProperties as any[]).map((property: any) => (
              <Card key={property.id} className="p-4 bg-white border-gray-200 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">{property.title}</h3>
                    <div className="flex items-center text-sm text-gray-500 space-x-4 mb-2">
                      <span className="flex items-center">
                        <MapPin size={12} className="mr-1" />
                        {property.location}
                      </span>
                      <span className="flex items-center">
                        <Building2 size={12} className="mr-1" />
                        {property.propertyType}
                      </span>
                      <span className="font-medium text-primary">{property.price}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(property.ownerApprovalStatus)}
                      <Badge variant="outline" className="text-xs border-gray-300 text-gray-700">
                        {property.listingType}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="h-8 w-8 p-0 border-gray-300">
                          <MoreVertical size={16} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-white">
                        <DropdownMenuItem onClick={() => router.push(`/property/${property.id}`)} className="cursor-pointer">
                          <Eye size={14} className="mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEdit(property)} className="cursor-pointer">
                          <Edit size={14} className="mr-2" />
                          Edit Property
                        </DropdownMenuItem>
                        {property.ownerApprovalStatus === "approved" && (
                          <DropdownMenuItem onClick={() => handlePdfDownload(property.id, property.title)} className="cursor-pointer">
                            <Download size={14} className="mr-2" />
                            Download PDF
                          </DropdownMenuItem>
                        )}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="cursor-pointer text-red-600">
                              <Trash2 size={14} className="mr-2" />
                              Delete Property
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="bg-white">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-gray-900">Delete Property Listing</AlertDialogTitle>
                              <AlertDialogDescription className="text-gray-600">
                                Are you sure you want to delete this property listing? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="bg-white border-gray-300 text-gray-700">Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(property.id)}
                                className="bg-red-600 hover:bg-red-700 text-white"
                              >
                                {deletePropertyMutation.isPending ? "Deleting..." : "Delete"}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {property.description && <p className="text-sm text-gray-600 mb-3 line-clamp-2">{property.description}</p>}

                <div className="bg-gray-50 rounded-lg p-3 mb-3 border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-gray-700">Owner Details</h4>
                    <Shield size={14} className="text-green-600" />
                  </div>
                  <div className="text-sm space-y-1">
                    <div className="flex items-center text-gray-600">
                      <User size={12} className="mr-2 text-gray-400" />
                      <span>{property.ownerName}</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Phone size={12} className="mr-2 text-gray-400" />
                      <span>
                        {showOwnerPhone[property.id]
                          ? property.ownerPhone
                          : `${property.ownerPhone?.slice(0, 3)}****${property.ownerPhone?.slice(-2)}`}
                      </span>
                      <button onClick={() => toggleOwnerPhone(property.id)} className="ml-2 text-primary hover:text-primary/80">
                        {showOwnerPhone[property.id] ? <EyeOff size={12} /> : <Eye size={12} />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-400">
                  <div className="flex items-center space-x-4">
                    <span className="flex items-center">
                      <Clock size={12} className="mr-1" />
                      Listed {new Date(property.createdAt).toLocaleDateString()}
                    </span>
                    {property.approvalTimestamp && (
                      <span className="flex items-center">
                        <CheckCircle size={12} className="mr-1" />
                        Approved {new Date(property.approvalTimestamp).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>

                {property.ownerApprovalStatus === "pending" && (
                  <div className="mt-3 p-2 bg-yellow-50 rounded-lg border border-yellow-200">
                    <p className="text-xs text-yellow-800 flex items-center">
                      <AlertCircle size={12} className="mr-1" />
                      {property.updatedAt && new Date(property.updatedAt).getTime() > new Date(property.createdAt).getTime() + 60000
                        ? "Property changes are awaiting owner approval. Owner has been notified via SMS."
                        : "Waiting for owner approval. You'll be notified once the owner responds."}
                    </p>
                  </div>
                )}

                {property.ownerApprovalStatus === "rejected" && (
                  <div className="mt-3 p-2 bg-red-50 rounded-lg border border-red-200">
                    <p className="text-xs text-red-800 flex items-center">
                      <XCircle size={12} className="mr-1" />
                      Owner declined this listing. Please contact the owner directly.
                    </p>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>

      <MobileNavigation />
    </div>
  );
}
