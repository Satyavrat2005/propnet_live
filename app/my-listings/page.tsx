"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Plus, Building2, MapPin, Clock, Shield, Eye, EyeOff, Phone, User, FileText, CheckCircle, XCircle, AlertCircle, Download, Edit, Trash2, MoreVertical } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { safeFetch } from "@/lib/safeFetch";
import { insertPropertySchema } from "@/lib/schema";
import FileUpload from "@/components/ui/file-upload";
import MobileNavigation from "@/components/layout/mobile-navigation";
import GooglePlacesAutocomplete from "@/components/ui/google-places-autocomplete";
import { z } from "zod";

const propertyFormSchema = insertPropertySchema;

export default function MyListings() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/");
    }
  }, [authLoading, user, router]);
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<any>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [agreementFiles, setAgreementFiles] = useState<File[]>([]);
  const [showOwnerPhone, setShowOwnerPhone] = useState<{[key: number]: boolean}>({});

  const { data: myProperties = [], isLoading } = useQuery({
    queryKey: ["/api/my-properties"],
    queryFn: () => safeFetch("/api/my-properties", []),
  });

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
      listingType: "exclusive",
      isPubliclyVisible: false,
      ownerName: "",
      ownerPhone: "",
      commissionTerms: "",
      scopeOfWork: [],
    },
  });

  const createPropertyMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await apiRequest("POST", "/api/properties", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-properties"] });
      queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
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
      let errorMessage = "Failed to create property listing. Please try again.";
      
      if (error?.response?.status === 401) {
        errorMessage = "You need to be logged in to create a property listing.";
      } else if (error?.response?.data?.details) {
        errorMessage = error.response.data.details;
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const updatePropertyMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: FormData }) => {
      const response = await apiRequest("PUT", `/api/properties/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-properties"] });
      queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
      setIsEditDialogOpen(false);
      setEditingProperty(null);
      form.reset();
      setSelectedFiles([]);
      setAgreementFiles([]);
      toast({
        title: "Property Updated Successfully",
        description: "Your property listing has been updated.",
      });
    },
    onError: (error: any) => {
      let errorMessage = "Failed to update property listing. Please try again.";
      
      if (error?.response?.status === 401) {
        errorMessage = "You need to be logged in to update a property listing.";
      } else if (error?.response?.data?.details) {
        errorMessage = error.response.data.details;
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const deletePropertyMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/properties/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-properties"] });
      queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
      toast({
        title: "Property Deleted",
        description: "Your property listing has been deleted successfully.",
      });
    },
    onError: (error: any) => {
      let errorMessage = "Failed to delete property listing. Please try again.";
      
      if (error?.response?.status === 401) {
        errorMessage = "You need to be logged in to delete a property listing.";
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (values: z.infer<typeof propertyFormSchema>) => {
    // Check for form validation errors
    const errors = form.formState.errors;
    if (Object.keys(errors).length > 0) {
      const errorFields = Object.keys(errors).join(', ');
      toast({
        title: "Form Validation Error",
        description: `Please fix the following fields: ${errorFields}`,
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    
    Object.entries(values).forEach(([key, value]) => {
      if (key === 'scopeOfWork' && Array.isArray(value)) {
        formData.append(key, JSON.stringify(value));
      } else if (value !== undefined && value !== null && value !== '') {
        formData.append(key, value.toString());
      }
    });

    selectedFiles.forEach(file => {
      formData.append('photos', file);
    });

    if (agreementFiles.length > 0) {
      formData.append('agreementDocument', agreementFiles[0]);
    }

    if (editingProperty) {
      updatePropertyMutation.mutate({ id: editingProperty.id, data: formData });
    } else {
      createPropertyMutation.mutate(formData);
    }
  };

  const handleEdit = (property: any) => {
    setEditingProperty(property);
    
    // Populate form with existing data
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

  const handleDelete = (id: number) => {
    deletePropertyMutation.mutate(id);
  };

  const handlePdfDownload = async (propertyId: number, propertyTitle: string) => {
    try {
      const response = await fetch(`/api/properties/${propertyId}/pdf`);
      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `${propertyTitle.replace(/[^a-zA-Z0-9]/g, '_')}_listing.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "PDF Downloaded",
        description: "Property listing PDF has been downloaded successfully.",
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Failed to download PDF. Please try again.",
        variant: "destructive",
      });
    }
  };

  const toggleOwnerPhone = (propertyId: number) => {
    setShowOwnerPhone(prev => ({
      ...prev,
      [propertyId]: !prev[propertyId]
    }));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle size={12} className="mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800"><XCircle size={12} className="mr-1" />Rejected</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800"><AlertCircle size={12} className="mr-1" />Pending Approval</Badge>;
    }
  };

  const scopeOfWorkOptions = [
    "Property Viewing Coordination",
    "Marketing & Promotion",
    "Documentation Support",
    "Negotiation Assistance",
    "Legal Compliance Check",
    "Market Analysis",
  ];

  return (
    <div className="flex flex-col min-h-screen pb-20">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-neutral-100 z-10">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center">
            <button 
              className="text-primary mr-4"
              onClick={() => router.push("/feed")}
            >
              <ArrowLeft size={24} />
            </button>
            <h2 className="text-lg font-semibold text-neutral-900">My Listings</h2>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="flex items-center space-x-2">
                <Plus size={16} />
                <span>Add Listing</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Property Listing</DialogTitle>
                <p className="text-sm text-neutral-600">
                  <Shield size={14} className="inline mr-1" />
                  Your data is secure. All sensitive information is stored safely and never displayed without explicit permission.
                </p>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                  {/* Property Details */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Property Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Property Title</FormLabel>
                            <FormControl>
                              <Input placeholder="Beautiful 2 BHK Apartment..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="propertyType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Property Type</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                          name="bhk"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>BHK (Optional)</FormLabel>
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
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="price"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                {form.watch("transactionType") === "rent" ? "Monthly Rent" : "Sale Price"}
                              </FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder={form.watch("transactionType") === "rent" ? "₹25,000/month" : "₹50 Lakhs"} 
                                  {...field} 
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
                                <FormLabel>Rent Frequency</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select frequency" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
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

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="size"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Area</FormLabel>
                              <FormControl>
                                <Input placeholder="1200" {...field} />
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
                              <FormLabel>Area Unit</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select unit" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
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

                      <FormField
                        control={form.control}
                        name="fullAddress"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Address</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Complete address with landmarks..."
                                className="resize-none"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-3 gap-4">
                        <FormField
                          control={form.control}
                          name="flatNumber"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Flat/Unit No.</FormLabel>
                              <FormControl>
                                <Input placeholder="A-101" {...field} />
                              </FormControl>
                              <p className="text-xs text-neutral-500">Encrypted & used only for verification</p>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="floorNumber"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Floor No.</FormLabel>
                              <FormControl>
                                <Input placeholder="3rd Floor" {...field} />
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
                              <FormLabel>Building/Society</FormLabel>
                              <FormControl>
                                <GooglePlacesAutocomplete
                                  value={field.value || ""}
                                  onChange={(value) => field.onChange(value)}
                                  placeholder="Search for building or society..."
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
                        name="location"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Location (Area, City)</FormLabel>
                            <FormControl>
                              <Input placeholder="Bandra West, Mumbai" {...field} />
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
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Property details, amenities, nearby facilities..."
                                className="resize-none"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div>
                        <label className="text-sm font-medium">Property Photos (Up to 10)</label>
                        <FileUpload 
                          onFilesChange={setSelectedFiles}
                          maxFiles={10}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Listing Type */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Listing Type</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <FormField
                        control={form.control}
                        name="listingType"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <div className="space-y-3">
                                <div className="flex items-center space-x-2">
                                  <input
                                    type="radio"
                                    id="exclusive"
                                    value="exclusive"
                                    checked={field.value === "exclusive"}
                                    onChange={() => field.onChange("exclusive")}
                                  />
                                  <label htmlFor="exclusive" className="text-sm font-medium">
                                    Exclusive - Only I can list and share it
                                  </label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <input
                                    type="radio"
                                    id="colisting"
                                    value="colisting"
                                    checked={field.value === "colisting"}
                                    onChange={() => field.onChange("colisting")}
                                  />
                                  <label htmlFor="colisting" className="text-sm font-medium">
                                    Allow Co-Listing - Multiple agents can list with permission
                                  </label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <input
                                    type="radio"
                                    id="shared"
                                    value="shared"
                                    checked={field.value === "shared"}
                                    onChange={() => field.onChange("shared")}
                                  />
                                  <label htmlFor="shared" className="text-sm font-medium">
                                    Shared Within Network - Platform-controlled visibility
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
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 mt-4">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>
                                Allow this property to appear in public agent feed and search?
                              </FormLabel>
                              <p className="text-xs text-muted-foreground">
                                Enable to make this listing visible in general search and feed. Disable for private listing sharing only.
                              </p>
                            </div>
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>

                  {/* Owner Details */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center">
                        <Shield size={16} className="mr-2" />
                        Owner Details (Encrypted & Secure)
                      </CardTitle>
                      <p className="text-xs text-neutral-600">
                        Owner will receive a consent request with clear terms
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <FormField
                        control={form.control}
                        name="ownerName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Owner Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Property owner's full name" {...field} />
                            </FormControl>
                            <p className="text-xs text-neutral-500">This information is encrypted and never shared publicly</p>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="ownerPhone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Owner Phone Number</FormLabel>
                            <FormControl>
                              <Input placeholder="+91 9876543210" {...field} />
                            </FormControl>
                            <p className="text-xs text-neutral-500">Required for verification and trust</p>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="commissionTerms"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Commission Terms</FormLabel>
                            <FormControl>
                              <Input placeholder="2% of sale value" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div>
                        <label className="text-sm font-medium">Scope of Work</label>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          {scopeOfWorkOptions.map((option) => (
                            <div key={option} className="flex items-center space-x-2">
                              <Checkbox
                                id={option}
                                checked={form.watch('scopeOfWork')?.includes(option)}
                                onCheckedChange={(checked) => {
                                  const current = form.getValues('scopeOfWork') || [];
                                  if (checked) {
                                    form.setValue('scopeOfWork', [...current, option]);
                                  } else {
                                    form.setValue('scopeOfWork', current.filter((item: string) => item !== option));
                                  }
                                }}
                              />
                              <label htmlFor={option} className="text-xs">{option}</label>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-medium">Agreement Document (Optional)</label>
                        <FileUpload 
                          onFilesChange={setAgreementFiles}
                          maxFiles={1}
                        />
                        <p className="text-xs text-neutral-500 mt-1">Upload agent agreement or authorization letter</p>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="flex space-x-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsAddDialogOpen(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={createPropertyMutation.isPending}
                      className="flex-1"
                    >
                      {createPropertyMutation.isPending ? "Creating..." : "Create Listing"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
          
          {/* Edit Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit Property Listing</DialogTitle>
                <p className="text-sm text-neutral-600">
                  <Shield size={14} className="inline mr-1" />
                  Update your property information. Changes will be saved immediately.
                </p>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                  {/* Property Details - Same as create form */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Property Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Property Title</FormLabel>
                            <FormControl>
                              <Input placeholder="Beautiful 2 BHK Apartment..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-2 gap-4">
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
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="price"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                {form.watch("transactionType") === "rent" ? "Monthly Rent" : "Sale Price"}
                              </FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder={form.watch("transactionType") === "rent" ? "₹25,000/month" : "₹50 Lakhs"} 
                                  {...field} 
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
                                <FormLabel>Rent Frequency</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select frequency" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
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

                      <div className="grid grid-cols-3 gap-4">
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
                          name="sizeUnit"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Unit</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Unit" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="sq.ft">sq.ft</SelectItem>
                                  <SelectItem value="sq.m">sq.m</SelectItem>
                                  <SelectItem value="sq.yard">sq.yard</SelectItem>
                                  <SelectItem value="acre">acre</SelectItem>
                                </SelectContent>
                              </Select>
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
                      </div>

                      <div className="grid grid-cols-2 gap-4">
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
                          name="fullAddress"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Full Address</FormLabel>
                              <FormControl>
                                <Input placeholder="Complete address" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-4">
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
                          name="buildingSociety"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Building/Society</FormLabel>
                              <FormControl>
                                <GooglePlacesAutocomplete
                                  value={field.value || ""}
                                  onChange={(value) => field.onChange(value)}
                                  placeholder="Search for building or society..."
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
                            <FormLabel>Description (Optional)</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Property details, amenities, nearby facilities..."
                                className="resize-none"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div>
                        <label className="text-sm font-medium">Property Photos (Up to 10)</label>
                        <FileUpload 
                          onFilesChange={setSelectedFiles}
                          maxFiles={10}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Listing Type */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Listing Type</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <FormField
                        control={form.control}
                        name="listingType"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <div className="space-y-3">
                                <div className="flex items-center space-x-2">
                                  <input
                                    type="radio"
                                    id="exclusive-edit"
                                    value="exclusive"
                                    checked={field.value === "exclusive"}
                                    onChange={() => field.onChange("exclusive")}
                                  />
                                  <label htmlFor="exclusive-edit" className="text-sm font-medium">
                                    Exclusive - Only I can list and share it
                                  </label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <input
                                    type="radio"
                                    id="colisting-edit"
                                    value="colisting"
                                    checked={field.value === "colisting"}
                                    onChange={() => field.onChange("colisting")}
                                  />
                                  <label htmlFor="colisting-edit" className="text-sm font-medium">
                                    Allow Co-Listing - Multiple agents can list with permission
                                  </label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <input
                                    type="radio"
                                    id="shared-edit"
                                    value="shared"
                                    checked={field.value === "shared"}
                                    onChange={() => field.onChange("shared")}
                                  />
                                  <label htmlFor="shared-edit" className="text-sm font-medium">
                                    Shared Within Network - Platform-controlled visibility
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
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 mt-4">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>
                                Allow this property to appear in public agent feed and search?
                              </FormLabel>
                              <p className="text-xs text-muted-foreground">
                                Enable to make this listing visible in general search and feed. Disable for private listing sharing only.
                              </p>
                            </div>
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>

                  {/* Owner Details */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center">
                        <Shield size={16} className="mr-2" />
                        Owner Details (Encrypted & Secure)
                      </CardTitle>
                      <p className="text-xs text-neutral-600">
                        Owner will receive a consent request with clear terms
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <FormField
                        control={form.control}
                        name="ownerName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Owner Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Property owner's full name" {...field} />
                            </FormControl>
                            <p className="text-xs text-neutral-500">This information is encrypted and never shared publicly</p>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="ownerPhone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Owner Phone Number</FormLabel>
                            <FormControl>
                              <Input placeholder="+91 9876543210" {...field} />
                            </FormControl>
                            <p className="text-xs text-neutral-500">Required for verification and trust</p>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="commissionTerms"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Commission Terms</FormLabel>
                            <FormControl>
                              <Input placeholder="2% of sale value" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div>
                        <label className="text-sm font-medium">Scope of Work</label>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          {scopeOfWorkOptions.map((option) => (
                            <div key={option} className="flex items-center space-x-2">
                              <Checkbox
                                id={`${option}-edit`}
                                checked={form.watch('scopeOfWork')?.includes(option)}
                                onCheckedChange={(checked) => {
                                  const current = form.getValues('scopeOfWork') || [];
                                  if (checked) {
                                    form.setValue('scopeOfWork', [...current, option]);
                                  } else {
                                    form.setValue('scopeOfWork', current.filter((item: string) => item !== option));
                                  }
                                }}
                              />
                              <label htmlFor={`${option}-edit`} className="text-xs">{option}</label>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-medium">Agreement Document (Optional)</label>
                        <FileUpload 
                          onFilesChange={setAgreementFiles}
                          maxFiles={1}
                        />
                        <p className="text-xs text-neutral-500 mt-1">Upload agent agreement or authorization letter</p>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="flex space-x-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        setIsEditDialogOpen(false);
                        setEditingProperty(null);
                        form.reset();
                      }}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={updatePropertyMutation.isPending}
                      className="flex-1"
                    >
                      {updatePropertyMutation.isPending ? "Updating..." : "Update Listing"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-6 py-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : (myProperties as any[])?.length === 0 ? (
          <div className="text-center py-12">
            <Building2 size={48} className="mx-auto text-neutral-400 mb-4" />
            <h3 className="text-lg font-medium text-neutral-700 mb-2">No listings yet</h3>
            <p className="text-neutral-500 mb-4">Create your first property listing to get started</p>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus size={16} className="mr-2" />
              Add Your First Listing
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {(myProperties as any[]).map((property: any) => (
              <Card key={property.id} className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-neutral-900 mb-1">{property.title}</h3>
                    <div className="flex items-center text-sm text-neutral-500 space-x-4 mb-2">
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
                      <Badge variant="outline" className="text-xs">
                        {property.listingType}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical size={16} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => router.push(`/property/${property.id}`)}>
                          <Eye size={14} className="mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEdit(property)}>
                          <Edit size={14} className="mr-2" />
                          Edit Property
                        </DropdownMenuItem>
                        {property.ownerApprovalStatus === 'approved' && (
                          <DropdownMenuItem onClick={() => handlePdfDownload(property.id, property.title)}>
                            <Download size={14} className="mr-2" />
                            Download PDF
                          </DropdownMenuItem>
                        )}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                              <Trash2 size={14} className="mr-2" />
                              Delete Property
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Property Listing</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this property listing? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleDelete(property.id)}
                                className="bg-red-600 hover:bg-red-700"
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

                {property.description && (
                  <p className="text-sm text-neutral-600 mb-3">{property.description}</p>
                )}

                {/* Owner Details (Masked) */}
                <div className="bg-neutral-50 rounded-lg p-3 mb-3">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-neutral-700">Owner Details</h4>
                    <Shield size={14} className="text-green-600" />
                  </div>
                  <div className="text-sm space-y-1">
                    <div className="flex items-center">
                      <User size={12} className="mr-2 text-neutral-400" />
                      <span>{property.ownerName}</span>
                    </div>
                    <div className="flex items-center">
                      <Phone size={12} className="mr-2 text-neutral-400" />
                      <span>
                        {showOwnerPhone[property.id] 
                          ? property.ownerPhone 
                          : `${property.ownerPhone?.slice(0, 3)}****${property.ownerPhone?.slice(-2)}`
                        }
                      </span>
                      <button
                        onClick={() => toggleOwnerPhone(property.id)}
                        className="ml-2 text-primary hover:text-primary/80"
                      >
                        {showOwnerPhone[property.id] ? <EyeOff size={12} /> : <Eye size={12} />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-neutral-400">
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

                {property.ownerApprovalStatus === 'pending' && (
                  <div className="mt-3 p-2 bg-yellow-50 rounded-lg">
                    <p className="text-xs text-yellow-800 flex items-center">
                      <AlertCircle size={12} className="mr-1" />
                      Waiting for owner approval. You'll be notified once the owner responds.
                    </p>
                  </div>
                )}

                {property.ownerApprovalStatus === 'rejected' && (
                  <div className="mt-3 p-2 bg-red-50 rounded-lg">
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