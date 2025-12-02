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
  lat?: number | null;
  lng?: number | null;
  createdAt: string;
}

export default function RequirementsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRequirement, setEditingRequirement] = useState<Requirement | null>(null);

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

  // Helper function to parse price text to number (in lakhs)
  const parsePriceToLakhs = (priceStr: string | null | undefined): number | null => {
    if (!priceStr) return null;
    const str = priceStr.toLowerCase().trim();
    
    // Match patterns like "50 lakh", "1.2 cr", "50L", "1.2Cr", etc.
    const croreMatch = str.match(/([\d.]+)\s*(cr|crore)/i);
    if (croreMatch) {
      return parseFloat(croreMatch[1]) * 100; // Convert crores to lakhs
    }
    
    const lakhMatch = str.match(/([\d.]+)\s*(l|lakh|lac)/i);
    if (lakhMatch) {
      return parseFloat(lakhMatch[1]);
    }
    
    // If just a number, assume it's in lakhs
    const numMatch = str.match(/[\d.]+/);
    if (numMatch) {
      return parseFloat(numMatch[0]);
    }
    
    return null;
  };

  // Helper function to calculate distance between two points (Haversine formula)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in km
  };

  // Helper function to geocode address using Google Maps API
  const geocodeAddress = async (address: string): Promise<{ lat: number; lng: number } | null> => {
    try {
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      if (!apiKey) {
        console.warn('[Geocode] Google Maps API key not found');
        return null;
      }

      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`
      );
      const data = await response.json();

      if (data.status === 'OK' && data.results && data.results.length > 0) {
        const location = data.results[0].geometry.location;
        return { lat: location.lat, lng: location.lng };
      }
      
      console.warn(`[Geocode] Failed to geocode: ${address}`, data.status);
      return null;
    } catch (error) {
      console.error('[Geocode] Error:', error);
      return null;
    }
  };

  // Filter network properties based on intelligent matching with requirements
  const matchingProperties = useMemo(() => {
    if (!networkProperties.length) return [];
    if (!requirements.length) return [];

    console.log('[Requirements Matching] Starting match process...');
    console.log('[Requirements Matching] Total requirements:', requirements.length);
    console.log('[Requirements Matching] Requirements data:', requirements.map(r => ({
      location: r.location,
      hasCoords: !!(r.lat && r.lng),
      lat: r.lat,
      lng: r.lng
    })));

    // Filter out "Deal Done" properties
    const availableProperties = networkProperties.filter(property => 
      property.listingType !== "Deal Done" && property.listing_type !== "Deal Done"
    );

    console.log('[Requirements Matching] Available properties:', availableProperties.length);
    console.log('[Requirements Matching] Properties data:', availableProperties.map(p => ({
      title: p.property_title || p.title,
      location: p.location,
      price: p.sale_price || p.price,
      bhk: p.bhk,
      type: p.propertyType || p.property_type,
      hasCoords: !!(p.latitude && p.longitude),
      lat: p.latitude,
      lng: p.longitude
    })));

    // Match properties against all requirements
    const matched = availableProperties.filter(property => {
      const propertyName = property.property_title || property.title || 'Unknown';
      
      // Check if property matches ANY of the user's requirements
      const isMatch = requirements.some(req => {
        console.log(`\n[Match Check] ${propertyName} vs ${req.location}`);
        
        // 1. Property Type Match (exact)
        const propType = property.propertyType || property.property_type;
        console.log(`  - Type: ${propType} === ${req.propertyType}?`, propType === req.propertyType);
        if (propType !== req.propertyType) {
          return false;
        }

        // 2. Transaction Type Match (exact)
        const transType = property.transactionType || property.transaction_type;
        console.log(`  - Transaction: ${transType} === ${req.transactionType}?`, transType === req.transactionType);
        if (transType !== req.transactionType) {
          return false;
        }

        // 3. BHK Match (if requirement specifies BHK)
        console.log(`  - BHK: ${property.bhk} === ${req.bhk}?`, !req.bhk || property.bhk === req.bhk);
        if (req.bhk && property.bhk !== req.bhk) {
          return false;
        }

        // 4. Price Range Match (with ±10 lakh buffer for flexibility)
        const propertyPrice = parsePriceToLakhs(property.sale_price || property.price);
        const reqMinPrice = parsePriceToLakhs(req.minPrice);
        const reqMaxPrice = parsePriceToLakhs(req.maxPrice);
        
        console.log(`  - Price: ${propertyPrice}L vs ${reqMinPrice}-${reqMaxPrice}L (±10L buffer)`);
        
        if (propertyPrice !== null && (reqMinPrice !== null || reqMaxPrice !== null)) {
          const buffer = 10; // ±10 lakhs buffer for more flexibility
          
          // If requirement has both min and max price
          if (reqMinPrice !== null && reqMaxPrice !== null) {
            const priceMatch = propertyPrice >= (reqMinPrice - buffer) && propertyPrice <= (reqMaxPrice + buffer);
            console.log(`    Price range check: ${priceMatch} (${reqMinPrice - buffer}L - ${reqMaxPrice + buffer}L)`);
            if (!priceMatch) {
              return false;
            }
          }
          // If requirement has only min price
          else if (reqMinPrice !== null) {
            const priceMatch = propertyPrice >= (reqMinPrice - buffer);
            console.log(`    Min price check: ${priceMatch} (>= ${reqMinPrice - buffer}L)`);
            if (!priceMatch) {
              return false;
            }
          }
          // If requirement has only max price
          else if (reqMaxPrice !== null) {
            const priceMatch = propertyPrice <= (reqMaxPrice + buffer);
            console.log(`    Max price check: ${priceMatch} (<= ${reqMaxPrice + buffer}L)`);
            if (!priceMatch) {
              return false;
            }
          }
        }

        // 5. Location Proximity Match (5 km radius)
        // Only match if both property and requirement have stored coordinates
        console.log(`  - Coordinates: Property(${property.latitude}, ${property.longitude}) vs Req(${req.lat}, ${req.lng})`);
        
        const propLat = property.latitude;
        const propLng = property.longitude;
        const reqLat = req.lat;
        const reqLng = req.lng;

        // Skip if coordinates are missing (they should be geocoded when creating the property/requirement)
        if (!propLat || !propLng || !reqLat || !reqLng) {
          console.log('    ❌ Missing coordinates - SKIPPED');
          return false;
        }
        
        const distance = calculateDistance(propLat, propLng, reqLat, reqLng);
        
        console.log(`    Distance: ${distance.toFixed(2)} km (max 5 km)`);
        
        // Strict 5km radius requirement using real geographic distance
        if (distance > 5) {
          console.log('    ❌ Too far - REJECTED');
          return false;
        }

        console.log('    ✅ ALL CRITERIA MATCHED!');
        // All criteria matched
        return true;
      });
      
      return isMatch;
    });

    console.log(`[Requirements Matching] Final matched properties: ${matched.length}`);
    console.log('[Requirements Matching] Matched:', matched.map(p => p.property_title || p.title));

    return matched;
  }, [networkProperties, requirements]);

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
        </div>

        {matchingProperties.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Building className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No matching properties</h3>
              <p className="text-gray-600">
                No properties match your requirements. Properties must have all of: matching type, transaction, BHK, price within ±10L, and location within 5km radius.
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Distance is calculated using Google Maps API for accurate proximity matching.
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