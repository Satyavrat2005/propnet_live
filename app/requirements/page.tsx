// app/requirements/page.tsx
"use client";

import React, { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Plus, Edit, Trash2, MapPin, Building, IndianRupee, Calendar, ArrowLeft, Filter } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { safeFetch } from "@/lib/safeFetch";
import { AppLayout } from "@/components/layout/app-layout";

const requirementSchema = z.object({
  propertyType: z.string().min(1, "Property type is required"),
  transactionType: z.string().min(1, "Transaction type is required"),
  location: z.string().min(1, "Location is required"),
  // Prices are TEXT now (accepts "50 Lakh", "1.2 Cr", etc.)
  minPrice: z.string().optional(),
  maxPrice: z.string().optional(),
  // Sizes remain numeric-like but we accept text and send as numbers only for size
  minSize: z.string().optional(),
  maxSize: z.string().optional(),
  sizeUnit: z.string().optional(),
  bhk: z.string().optional(),
  description: z.string().optional(),
});

type RequirementFormData = z.infer<typeof requirementSchema>;

interface Requirement {
  requirement_id: string;
  propertyType: string;
  transactionType: string;
  location: string;
  minPrice?: string | null;
  maxPrice?: string | null;
  minSize?: number | null;
  maxSize?: number | null;
  sizeUnit?: string | null;
  bhk?: number | null;
  description?: string | null;
  createdAt: string;
}

export default function RequirementsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRequirement, setEditingRequirement] = useState<Requirement | null>(null);
  
  // Filter states for matching properties
  const [filterPropertyType, setFilterPropertyType] = useState<string>("all");
  const [filterTransactionType, setFilterTransactionType] = useState<string>("all");
  const [filterBhk, setFilterBhk] = useState<string>("all");
  const [filterMinPrice, setFilterMinPrice] = useState<string>("");
  const [filterMaxPrice, setFilterMaxPrice] = useState<string>("");
  const [filterLocation, setFilterLocation] = useState<string>("");

  const form = useForm<RequirementFormData>({
    resolver: zodResolver(requirementSchema),
    defaultValues: {
      propertyType: "",
      transactionType: "",
      location: "",
      minPrice: "",
      maxPrice: "",
      minSize: "",
      maxSize: "",
      sizeUnit: "sq.ft",
      bhk: "",
      description: "",
    },
  });

  const { data: requirements = [], isLoading } = useQuery<Requirement[]>({
    queryKey: ["/api/my-requirements"],
    queryFn: async () => safeFetch<Requirement[]>("/api/my-requirements", []),
    enabled: !!user,
  });

  // Fetch properties from network
  const { data: networkProperties = [] } = useQuery<any[]>({
    queryKey: ["/api/properties"],
    queryFn: async () => safeFetch<any[]>("/api/properties", []),
    enabled: !!user,
  });

  // Filter network properties based on user's filter selections
  const matchingProperties = useMemo(() => {
    if (!networkProperties.length) return [];

    // First filter out "Deal Done" properties
    let filtered = networkProperties.filter(property => 
      property.listingType !== "Deal Done" && property.listing_type !== "Deal Done"
    );

    // Check if any user filters are active
    const hasActiveFilters = 
      filterPropertyType !== "all" || 
      filterTransactionType !== "all" || 
      filterBhk !== "all" || 
      filterLocation.trim() !== "" || 
      filterMinPrice.trim() !== "" || 
      filterMaxPrice.trim() !== "";

    // If no user filters are active, use requirements locations as default filter
    if (!hasActiveFilters && requirements.length > 0) {
      filtered = filtered.filter(property => {
        // Check if property location matches any requirement location
        return requirements.some(req => {
          const reqLocation = req.location?.toLowerCase() || "";
          const propertyLocation = property.location?.toLowerCase() || "";
          const propertyFullAddress = property.fullAddress?.toLowerCase() || "";
          
          // Split locations into words for matching
          const reqLocationWords = reqLocation.split(/[\s,]+/).filter((w: string) => w.length > 3);
          const propertyLocationWords = propertyLocation.split(/[\s,]+/).filter((w: string) => w.length > 3);
          const propertyFullAddressWords = propertyFullAddress.split(/[\s,]+/).filter((w: string) => w.length > 3);
          
          // Check if any words match
          return reqLocationWords.some((reqWord: string) => 
            propertyLocationWords.some((propWord: string) => 
              propWord.includes(reqWord) || reqWord.includes(propWord)
            ) ||
            propertyFullAddressWords.some((propWord: string) => 
              propWord.includes(reqWord) || reqWord.includes(propWord)
            )
          );
        });
      });
    } else {
      // Apply user filters
      if (filterPropertyType !== "all") {
        filtered = filtered.filter(p => p.propertyType === filterPropertyType);
      }
      
      if (filterTransactionType !== "all") {
        filtered = filtered.filter(p => p.transactionType === filterTransactionType);
      }
      
      if (filterBhk !== "all") {
        filtered = filtered.filter(p => p.bhk === parseInt(filterBhk));
      }
      
      if (filterLocation.trim()) {
        const searchLocation = filterLocation.toLowerCase();
        filtered = filtered.filter(p => 
          p.location?.toLowerCase().includes(searchLocation) ||
          p.fullAddress?.toLowerCase().includes(searchLocation)
        );
      }
      
      // Price filtering (basic string comparison - can be enhanced)
      if (filterMinPrice.trim()) {
        filtered = filtered.filter(p => {
          const price = p.price || "";
          return price >= filterMinPrice;
        });
      }
      
      if (filterMaxPrice.trim()) {
        filtered = filtered.filter(p => {
          const price = p.price || "";
          return price <= filterMaxPrice;
        });
      }
    }

    return filtered;
  }, [networkProperties, filterPropertyType, filterTransactionType, filterBhk, filterLocation, filterMinPrice, filterMaxPrice, requirements]);

  const createMutation = useMutation({
    mutationFn: async (data: RequirementFormData) => {
      const res = await fetch("/api/property-requirements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          propertyType: data.propertyType,
          transactionType: data.transactionType,
          preferredLocation: data.location,
          // send as TEXT (no Number() casting)
          minPrice: data.minPrice?.trim() || null,
          maxPrice: data.maxPrice?.trim() || null,
          // sizes can be numeric if supplied; keep numeric for DB numeric columns
          minSize: data.minSize ? parseFloat(data.minSize) : null,
          maxSize: data.maxSize ? parseFloat(data.maxSize) : null,
          sizeUnit: data.sizeUnit || null,
          bhk: data.bhk ? parseInt(data.bhk) || null : null,
          additionalRequirement: data.description || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Failed to create requirement");
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-requirements"] });
      queryClient.invalidateQueries({ queryKey: ["/api/property-requirements"] });
      setIsDialogOpen(false);
      setEditingRequirement(null);
      form.reset();
      toast({ title: "Success", description: "Requirement created successfully" });
    },
    onError: (e: any) => {
      toast({ title: "Error", description: e?.message || "Failed to create requirement", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: RequirementFormData }) => {
      const res = await fetch(`/api/property-requirements/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          propertyType: data.propertyType,
          transactionType: data.transactionType,
          preferredLocation: data.location,
          // keep TEXT
          minPrice: data.minPrice?.trim() || null,
          maxPrice: data.maxPrice?.trim() || null,
          minSize: data.minSize ? parseFloat(data.minSize) : null,
          maxSize: data.maxSize ? parseFloat(data.maxSize) : null,
          sizeUnit: data.sizeUnit || null,
          bhk: data.bhk ? parseInt(data.bhk) || null : null,
          additionalRequirement: data.description || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Failed to update requirement");
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-requirements"] });
      queryClient.invalidateQueries({ queryKey: ["/api/property-requirements"] });
      setIsDialogOpen(false);
      setEditingRequirement(null);
      form.reset();
      toast({ title: "Success", description: "Requirement updated successfully" });
    },
    onError: (e: any) => {
      toast({ title: "Error", description: e?.message || "Failed to update requirement", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/property-requirements/${id}`, {
        method: "DELETE",
        credentials: "same-origin",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Failed to delete requirement");
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-requirements"] });
      queryClient.invalidateQueries({ queryKey: ["/api/property-requirements"] });
      toast({ title: "Success", description: "Requirement deleted successfully" });
    },
    onError: (e: any) => {
      toast({ title: "Error", description: e?.message || "Failed to delete requirement", variant: "destructive" });
    },
  });

  const onSubmit = (data: RequirementFormData) => {
    if (editingRequirement) {
      updateMutation.mutate({ id: editingRequirement.requirement_id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (r: Requirement) => {
    setEditingRequirement(r);
    form.reset({
      propertyType: r.propertyType,
      transactionType: r.transactionType,
      location: r.location,
      minPrice: r.minPrice ?? "",
      maxPrice: r.maxPrice ?? "",
      minSize: r.minSize?.toString() ?? "",
      maxSize: r.maxSize?.toString() ?? "",
      sizeUnit: r.sizeUnit ?? "sq.ft",
      bhk: r.bhk?.toString() ?? "",
      description: r.description ?? "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this requirement?")) {
      deleteMutation.mutate(id);
    }
  };

  const sizeUnitOptions = useMemo(() => ["sq.ft", "sq.m", "sq.yd", "acre"], []);

  const SelectMenu = ({ children }: { children: React.ReactNode }) => (
    <SelectContent className="bg-white border border-gray-200 shadow-lg">
      {/* Apply consistent white background + emerald hover to all options */}
      <div className="*:data-[state=open]:bg-white">{children}</div>
    </SelectContent>
  );

  const SelectOpt = (props: { value: string; label: string }) => (
    <SelectItem
      value={props.value}
      className="hover:bg-[#2ECC71] focus:bg-[#2ECC71] hover:text-white focus:text-white"
    >
      {props.label}
    </SelectItem>
  );

  const formatPriceDisplay = (txt?: string | null) => (txt ? txt : "");

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto w-full space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">Property Requirements</h1>
            <p className="text-sm text-muted-foreground">Manage your property search requirements</p>
          </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditingRequirement(null);
                form.reset();
              }}
              className="flex items-center gap-2 border-2 border-blue-600 bg-blue-600 hover:bg-blue-700 hover:border-blue-700 text-white transition-all duration-200"
              type="button"
            >
              <Plus size={16} />
              Add Requirement
            </Button>
          </DialogTrigger>

          <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto bg-white">
            <DialogHeader>
              <DialogTitle>{editingRequirement ? "Edit Requirement" : "Add New Requirement"}</DialogTitle>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" autoComplete="off">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                          <SelectMenu>
                            <SelectOpt value="Apartment" label="Apartment" />
                            <SelectOpt value="Villa" label="Villa" />
                            <SelectOpt value="House" label="House" />
                            <SelectOpt value="Office" label="Office" />
                            <SelectOpt value="Shop" label="Shop" />
                            <SelectOpt value="Plot" label="Plot" />
                          </SelectMenu>
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
                              <SelectValue placeholder="Buy or Rent" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectMenu>
                            <SelectOpt value="sale" label="Buy" />
                            <SelectOpt value="rent" label="Rent" />
                          </SelectMenu>
                        </Select>
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
                      <FormLabel>Preferred Location</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Borivali West, Mumbai" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="minPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Min Price (₹)</FormLabel>
                        <FormControl>
                          <Input
                            type="text"
                            placeholder="e.g., 40 Lakh"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="maxPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Max Price (₹)</FormLabel>
                        <FormControl>
                          <Input
                            type="text"
                            placeholder="e.g., 50 Lakh / 1.2 Cr"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="minSize"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Min Size</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="e.g., 500"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="maxSize"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Max Size</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="e.g., 1200"
                            {...field}
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
                        <FormLabel>Size Unit</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select unit" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectMenu>
                            {sizeUnitOptions.map((u) => (
                              <SelectOpt key={u} value={u} label={u} />
                            ))}
                          </SelectMenu>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="bhk"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>BHK (Optional)</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select BHK" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectMenu>
                          <SelectOpt value="1" label="1 BHK" />
                          <SelectOpt value="2" label="2 BHK" />
                          <SelectOpt value="3" label="3 BHK" />
                          <SelectOpt value="4" label="4 BHK" />
                          <SelectOpt value="5" label="5+ BHK" />
                        </SelectMenu>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Additional Requirements (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="e.g., Prefer higher floor, east facing, near metro"
                          className="min-h-20"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    className="border-2 border-blue-600 bg-blue-600 hover:bg-blue-700 hover:border-blue-700 text-white transition-all duration-200"
                  >
                    {createMutation.isPending || updateMutation.isPending ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Saving...
                      </div>
                    ) : (
                      editingRequirement ? "Update" : "Create"
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* My Requirements */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">My Requirements ({requirements.length})</h2>
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : requirements.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Building className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No requirements yet</h3>
              <p className="text-gray-600 mb-4">
                Create your first property requirement to help agents find suitable properties for you.
              </p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus size={16} className="mr-2" />
                Add Your First Requirement
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {requirements.map((r: any) => (
              <Card key={r.requirement_id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline">{r.propertyType}</Badge>
                        <Badge variant={r.transactionType === "sale" ? "default" : "secondary"}>
                          {r.transactionType === "sale" ? "Buy" : "Rent"}
                        </Badge>
                        {r.bhk && <Badge variant="outline">{r.bhk} BHK</Badge>}
                      </div>

                      <div className="flex items-center text-gray-600 mb-2">
                        <MapPin size={16} className="mr-1" />
                        {r.location}
                      </div>

                      {(r.minPrice || r.maxPrice) && (
                        <div className="flex items-center text-gray-600 mb-2">
                          <IndianRupee size={16} className="mr-1" />
                          {r.minPrice && r.maxPrice
                            ? `₹${formatPriceDisplay(r.minPrice)} - ₹${formatPriceDisplay(r.maxPrice)}`
                            : r.minPrice
                            ? `From ₹${formatPriceDisplay(r.minPrice)}`
                            : `Up to ₹${formatPriceDisplay(r.maxPrice)}`}
                        </div>
                      )}

                      {(r.minSize || r.maxSize) && (
                        <div className="flex items-center text-gray-600 mb-2">
                          <Building size={16} className="mr-1" />
                          {r.minSize && r.maxSize
                            ? `${r.minSize} - ${r.maxSize} ${r.sizeUnit}`
                            : r.minSize
                            ? `From ${r.minSize} ${r.sizeUnit}`
                            : `Up to ${r.maxSize} ${r.sizeUnit}`}
                        </div>
                      )}

                      {r.description && <p className="text-gray-600 text-sm mt-2">{r.description}</p>}

                      <div className="flex items-center text-xs text-gray-400 mt-3">
                        <Calendar size={12} className="mr-1" />
                        Created {new Date(r.createdAt).toLocaleDateString()}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(r)}>
                        <Edit size={14} />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(r.requirement_id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Matching Properties from Network */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Matching Properties ({matchingProperties.length})</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setFilterPropertyType("all");
              setFilterTransactionType("all");
              setFilterBhk("all");
              setFilterMinPrice("");
              setFilterMaxPrice("");
              setFilterLocation("");
            }}
            className="text-xs"
          >
            Clear Filters
          </Button>
        </div>

        {/* Filter Section */}
        <Card className="mb-6 bg-gray-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <Filter size={18} className="text-blue-600" />
              <h3 className="font-semibold text-sm">Filter Properties</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Property Type Filter */}
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Property Type</label>
                <Select value={filterPropertyType} onValueChange={setFilterPropertyType}>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectMenu>
                    <SelectOpt value="all" label="All Types" />
                    <SelectOpt value="Apartment" label="Apartment" />
                    <SelectOpt value="Villa" label="Villa" />
                    <SelectOpt value="House" label="House" />
                    <SelectOpt value="Office" label="Office" />
                    <SelectOpt value="Shop" label="Shop" />
                    <SelectOpt value="Plot" label="Plot" />
                  </SelectMenu>
                </Select>
              </div>

              {/* Transaction Type Filter */}
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Transaction Type</label>
                <Select value={filterTransactionType} onValueChange={setFilterTransactionType}>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectMenu>
                    <SelectOpt value="all" label="All" />
                    <SelectOpt value="sale" label="Buy" />
                    <SelectOpt value="rent" label="Rent" />
                  </SelectMenu>
                </Select>
              </div>

              {/* BHK Filter */}
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">BHK</label>
                <Select value={filterBhk} onValueChange={setFilterBhk}>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="All BHK" />
                  </SelectTrigger>
                  <SelectMenu>
                    <SelectOpt value="all" label="All BHK" />
                    <SelectOpt value="1" label="1 BHK" />
                    <SelectOpt value="2" label="2 BHK" />
                    <SelectOpt value="3" label="3 BHK" />
                    <SelectOpt value="4" label="4 BHK" />
                    <SelectOpt value="5" label="5+ BHK" />
                  </SelectMenu>
                </Select>
              </div>

              {/* Location Filter */}
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Location</label>
                <Input
                  type="text"
                  placeholder="Search location..."
                  value={filterLocation}
                  onChange={(e) => setFilterLocation(e.target.value)}
                  className="bg-white"
                />
              </div>

              {/* Min Price Filter */}
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Min Price (₹)</label>
                <Input
                  type="text"
                  placeholder="e.g., 40 Lakh"
                  value={filterMinPrice}
                  onChange={(e) => setFilterMinPrice(e.target.value)}
                  className="bg-white"
                />
              </div>

              {/* Max Price Filter */}
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Max Price (₹)</label>
                <Input
                  type="text"
                  placeholder="e.g., 1 Cr"
                  value={filterMaxPrice}
                  onChange={(e) => setFilterMaxPrice(e.target.value)}
                  className="bg-white"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {matchingProperties.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Building className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No matching properties</h3>
              <p className="text-gray-600">
                No properties from other agents match your current filters.
                {(filterPropertyType !== "all" || filterTransactionType !== "all" || filterBhk !== "all" || filterLocation || filterMinPrice || filterMaxPrice) && (
                  <span className="block mt-2">Try clearing or adjusting your filters.</span>
                )}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {matchingProperties.map((property: any) => (
              <Card key={property.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => window.location.href = `/property/${property.id}`}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-2">{property.title}</h3>
                      
                      <div className="flex items-center gap-2 mb-3">
                        <Badge variant="outline">{property.propertyType}</Badge>
                        <Badge variant={property.transactionType === "sale" ? "default" : "secondary"}>
                          {property.transactionType === "sale" ? "Buy" : "Rent"}
                        </Badge>
                        {property.bhk && <Badge variant="outline">{property.bhk} BHK</Badge>}
                        <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                          {property.listingType}
                        </Badge>
                      </div>

                      <div className="flex items-center text-gray-600 mb-2">
                        <MapPin size={16} className="mr-1" />
                        {property.location}
                      </div>

                      {property.price && (
                        <div className="flex items-center text-gray-600 mb-2">
                          <IndianRupee size={16} className="mr-1" />
                          <span className="font-semibold">₹{property.price}</span>
                        </div>
                      )}

                      {property.size && (
                        <div className="flex items-center text-gray-600 mb-2">
                          <Building size={16} className="mr-1" />
                          {property.size} {property.sizeUnit}
                        </div>
                      )}

                      {property.description && (
                        <p className="text-gray-600 text-sm mt-2 line-clamp-2">{property.description}</p>
                      )}

                      <div className="text-xs text-gray-500 mt-3">
                        Listed by: {property.broker?.name || property.owner?.name || "Unknown"}
                      </div>
                    </div>
                    
                    {property.photos && property.photos.length > 0 && (
                      <div className="ml-4">
                        <img 
                          src={property.photos[0]} 
                          alt={property.title}
                          className="w-24 h-24 object-cover rounded-lg"
                        />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      </div>
    </AppLayout>
  );
}
