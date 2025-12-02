// app/requirements/page.tsx
"use client";

import React, { useMemo, useState, useEffect } from "react";
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
import { Plus, Edit, Trash2, MapPin, Building, IndianRupee, Calendar, Navigation, CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { safeFetch } from "@/lib/safeFetch";
import { AppLayout } from "@/components/layout/app-layout";

// Helper to parse price text to numeric value in Lakhs
function parsePriceToLakhs(priceStr: string | number | null | undefined): number | null {
  if (priceStr == null) return null;
  
  const str = String(priceStr).toLowerCase().trim();
  if (!str) return null;
  
  // Remove currency symbols and commas
  const cleaned = str.replace(/[₹,\s]/g, '');
  
  // Check for Cr/Crore
  const croreMatch = cleaned.match(/^([\d.]+)\s*(cr|crore|crores?)$/i);
  if (croreMatch) {
    return parseFloat(croreMatch[1]) * 100; // Convert to lakhs
  }
  
  // Check for L/Lakh/Lac
  const lakhMatch = cleaned.match(/^([\d.]+)\s*(l|lakh|lakhs?|lac|lacs?)$/i);
  if (lakhMatch) {
    return parseFloat(lakhMatch[1]);
  }
  
  // Check for K/Thousand
  const thousandMatch = cleaned.match(/^([\d.]+)\s*(k|thousand)$/i);
  if (thousandMatch) {
    return parseFloat(thousandMatch[1]) / 100; // Convert to lakhs
  }
  
  // Plain number - assume it's in rupees if large, lakhs if small
  const num = parseFloat(cleaned);
  if (isNaN(num)) return null;
  
  // If number is very large (> 10000), assume it's in rupees
  if (num > 100000) {
    return num / 100000; // Convert to lakhs
  }
  
  // If number is reasonable for lakhs (1-1000), assume lakhs
  if (num >= 1 && num <= 1000) {
    return num;
  }
  
  return num;
}

// Calculate distance between two lat/lng points using Haversine formula (returns km)
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

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
  lat?: number | null;
  lng?: number | null;
  latitude?: number | null;
  longitude?: number | null;
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

  // State for expanded requirements (to show matched properties inline)
  const [expandedRequirements, setExpandedRequirements] = useState<Set<string>>(new Set());

  // Toggle expansion for a requirement
  const toggleExpanded = (requirementId: string) => {
    setExpandedRequirements(prev => {
      const next = new Set(prev);
      if (next.has(requirementId)) {
        next.delete(requirementId);
      } else {
        next.add(requirementId);
      }
      return next;
    });
  };

  const tierOrder: Array<"perfect" | "strong" | "nearby"> = ["perfect", "strong", "nearby"];
  const tierDisplayMeta: Record<"perfect" | "strong" | "nearby", { title: string; note: string; badge: string }> = {
    perfect: {
      title: "Best Matches",
      note: "Exact match on property type, BHK, transaction type + price within budget + within 5 km.",
      badge: "bg-emerald-100 text-emerald-700 border-emerald-200",
    },
    strong: {
      title: "Close Matches",
      note: "Matches core fields (type, BHK, transaction) with price slightly outside budget (±5 Lakh) + within 5 km.",
      badge: "bg-blue-100 text-blue-700 border-blue-200",
    },
    nearby: {
      title: "Other Nearby Properties",
      note: "Matches core criteria within 5-7 km distance or with price outside tolerance.",
      badge: "bg-amber-100 text-amber-700 border-amber-200",
    },
  };

  // Computed: Get matched properties grouped by match strength per requirement
  const matchedPropertiesByRequirement = useMemo(() => {
    if (!networkProperties.length || !requirements.length) {
      return new Map<string, {
        ordered: any[];
        tiers: Record<"perfect" | "strong" | "nearby", any[]>;
        summary: { total: number; perfect: number; strong: number; nearby: number };
      }>();
    }

    const PRICE_TOLERANCE_LAKHS = 5;
    const IDEAL_DISTANCE_KM = 5;  // Perfect/Strong matches within this range
    const MAX_DISTANCE_KM = 7;    // Nearby matches extended up to 7km

    const resultMap = new Map<string, {
      ordered: any[];
      tiers: Record<"perfect" | "strong" | "nearby", any[]>;
      summary: { total: number; perfect: number; strong: number; nearby: number };
    }>();

    // Filter out Deal Done properties
    const availableProperties = networkProperties.filter((property: any) =>
      property.listingType !== "Deal Done" && property.listing_type !== "Deal Done"
    );

    console.log("[Requirements Matching] Available properties:", availableProperties.length);

    const sortByDistance = (a: any, b: any) => {
      if (a._distance == null && b._distance == null) return 0;
      if (a._distance == null) return 1;
      if (b._distance == null) return -1;
      return a._distance - b._distance;
    };

    requirements.forEach((req: any) => {
      const reqPropertyType = (req.propertyType || "").toLowerCase().trim();
      const reqTransactionType = (req.transactionType || "").toLowerCase().trim();
      const reqBhk = req.bhk ? parseInt(String(req.bhk)) : null;
      const reqLocation = (req.location || "").toLowerCase().trim();
      const reqMinPrice = parsePriceToLakhs(req.minPrice);
      const reqMaxPrice = parsePriceToLakhs(req.maxPrice);
      const reqLat = req.lat ?? req.latitude;
      const reqLng = req.lng ?? req.longitude;
      const hasCoordinates = Boolean(reqLat && reqLng);

      console.log("[Requirements Matching] Requirement:", {
        id: req.requirement_id,
        propertyType: reqPropertyType,
        transactionType: reqTransactionType,
        bhk: reqBhk,
        location: reqLocation,
        priceRange: { min: reqMinPrice, max: reqMaxPrice },
        hasCoordinates,
        lat: reqLat,
        lng: reqLng
      });

      const tierBuckets: Record<"perfect" | "strong" | "nearby", any[]> = {
        perfect: [],
        strong: [],
        nearby: [],
      };

      availableProperties.forEach((property: any) => {
        // --- CORE MATCHING: Property Type, Transaction Type, BHK ---
        // These three MUST match exactly (as per user requirement)
        
        const propPropertyType = (property.propertyType || property.property_type || "").toLowerCase().trim();
        const propertyTypeMatches = !reqPropertyType || !propPropertyType || reqPropertyType === propPropertyType;
        
        const propTransactionType = (property.transactionType || property.transaction_type || "").toLowerCase().trim();
        const transactionTypeMatches = !reqTransactionType || !propTransactionType || reqTransactionType === propTransactionType;
        
        const propBhkRaw = property.bhk ?? null;
        const propBhk = propBhkRaw != null ? parseInt(String(propBhkRaw)) : null;
        const bhkMatches = !reqBhk || !propBhk || reqBhk === propBhk;

        // All three core criteria must match
        const coreMatch = propertyTypeMatches && transactionTypeMatches && bhkMatches;
        
        if (!coreMatch) {
          return; // Skip if core criteria don't match
        }

        // --- PRICE MATCHING with ±5 Lakh tolerance ---
        const rawPrice = property.price ?? property.sale_price ?? null;
        const propPriceValue = parsePriceToLakhs(rawPrice);
        
        let priceMatch = true; // Default to true if no price constraints
        let priceWithinTolerance = true;
        
        if ((reqMinPrice !== null || reqMaxPrice !== null) && propPriceValue !== null) {
          // Check exact price match (within budget)
          const withinMin = reqMinPrice === null || propPriceValue >= reqMinPrice;
          const withinMax = reqMaxPrice === null || propPriceValue <= reqMaxPrice;
          priceMatch = withinMin && withinMax;
          
          // Check price with tolerance (±5 Lakh)
          const withinMinTolerance = reqMinPrice === null || propPriceValue >= (reqMinPrice - PRICE_TOLERANCE_LAKHS);
          const withinMaxTolerance = reqMaxPrice === null || propPriceValue <= (reqMaxPrice + PRICE_TOLERANCE_LAKHS);
          priceWithinTolerance = withinMinTolerance && withinMaxTolerance;
        }

        // --- DISTANCE CALCULATION ---
        const propLat = property.lat ?? property.latitude;
        const propLng = property.lng ?? property.longitude;
        let distance: number | null = null;
        let withinIdealDistance = true;  // Within 5km (for perfect/strong)
        let withinMaxDistance = true;    // Within 7km (for nearby)
        
        if (hasCoordinates && propLat && propLng) {
          distance = calculateDistance(reqLat, reqLng, Number(propLat), Number(propLng));
          withinIdealDistance = distance <= IDEAL_DISTANCE_KM;
          withinMaxDistance = distance <= MAX_DISTANCE_KM;
        }

        // --- LOCATION TEXT MATCHING (fallback when no coordinates) ---
        let locationTextMatches = true;
        if (!hasCoordinates && reqLocation) {
          const propLocation = (property.location || property.fullAddress || property.full_address || "").toLowerCase();
          if (propLocation) {
            const reqLocationParts = reqLocation.split(",").map((part: string) => part.trim()).filter(Boolean);
            locationTextMatches = reqLocationParts.length > 0
              ? reqLocationParts.some((part: string) => propLocation.includes(part))
              : propLocation.includes(reqLocation);
          }
        }

        // If using coordinates, must be within max distance (7km); if using text, must match location text
        if (hasCoordinates && !withinMaxDistance) {
          return; // Skip if outside 7km when we have coordinates
        }
        if (!hasCoordinates && !locationTextMatches) {
          return; // Skip if location text doesn't match when we don't have coordinates
        }

        // --- DETERMINE MATCH TIER ---
        // Perfect: Core match + exact price match + within 5km
        // Strong: Core match + price within tolerance (±5 Lakh) + within 5km
        // Nearby: Core match + within 5-7km OR price outside tolerance
        
        let matchTier: "perfect" | "strong" | "nearby";
        
        if (withinIdealDistance && priceMatch) {
          matchTier = "perfect";
        } else if (withinIdealDistance && priceWithinTolerance) {
          matchTier = "strong";
        } else {
          // Either outside ideal distance (5-7km range) or price doesn't match well
          matchTier = "nearby";
        }

        tierBuckets[matchTier].push({
          ...property,
          _distance: distance,
          _matchTier: matchTier,
          _matchesPrice: priceMatch,
          _priceWithinTolerance: priceWithinTolerance,
          _priceValue: propPriceValue,
        });
      });

      // Sort each tier by distance (nearest first)
      Object.values(tierBuckets).forEach((bucket) => bucket.sort(sortByDistance));

      const ordered = [
        ...tierBuckets.perfect,
        ...tierBuckets.strong,
        ...tierBuckets.nearby,
      ];

      const summary = {
        perfect: tierBuckets.perfect.length,
        strong: tierBuckets.strong.length,
        nearby: tierBuckets.nearby.length,
      };

      console.log("[Requirements Matching] Matches for requirement", req.requirement_id, ":", summary);

      resultMap.set(req.requirement_id, {
        ordered,
        tiers: tierBuckets,
        summary: {
          ...summary,
          total: summary.perfect + summary.strong + summary.nearby,
        },
      });
    });

    return resultMap;
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
            {requirements.map((r: any) => {
              const matchResult = matchedPropertiesByRequirement.get(r.requirement_id);
              const matchedProperties = matchResult?.ordered ?? [];
              const tierBuckets = matchResult?.tiers ?? { perfect: [], strong: [], nearby: [] };
              const matchSummary = matchResult?.summary ?? { total: 0, perfect: 0, strong: 0, nearby: 0 };
              const matchCount = matchSummary.total;
              const isExpanded = expandedRequirements.has(r.requirement_id);
              
              return (
              <Card key={r.requirement_id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <Badge variant="outline">{r.propertyType}</Badge>
                        <Badge variant={r.transactionType === "sale" ? "default" : "secondary"}>
                          {r.transactionType === "sale" ? "Buy" : "Rent"}
                        </Badge>
                        {r.bhk && <Badge variant="outline">{r.bhk} BHK</Badge>}
                        {matchCount > 0 && (
                          <Badge className="bg-green-100 text-green-700 border-green-200">
                            <CheckCircle2 size={12} className="mr-1" />
                            {matchCount} match{matchCount !== 1 ? "es" : ""}
                          </Badge>
                        )}
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

                    <div className="flex flex-col items-end gap-2 ml-4">
                      <div className="flex items-center gap-2">
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
                      <Button
                        size="sm"
                        variant={isExpanded ? "default" : "outline"}
                        onClick={() => toggleExpanded(r.requirement_id)}
                        className={`flex items-center gap-1 ${isExpanded ? "bg-blue-600 hover:bg-blue-700 text-white" : ""}`}
                      >
                        {isExpanded ? (
                          <>
                            <ChevronUp size={14} />
                            Hide Matches
                          </>
                        ) : (
                          <>
                            {matchCount > 0 ? `View ${matchCount} Match${matchCount !== 1 ? "es" : ""}` : "View Matches"}
                            <ChevronDown size={14} />
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Expanded Matched Properties Section */}
                  {isExpanded && (
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <h4 className="font-semibold text-sm text-gray-700 mb-4">
                        Matched Properties ({matchSummary.total})
                      </h4>
                      {matchSummary.total === 0 ? (
                        <div className="text-sm text-gray-500">
                          No properties match the current requirement and distance filters.
                        </div>
                      ) : (
                        <div className="space-y-6">
                          {tierOrder.map((tier) => {
                            const tierList = tierBuckets[tier] || [];
                            if (!tierList.length) return null;

                            const tierMeta = tierDisplayMeta[tier];

                            return (
                              <div key={`${r.requirement_id}-${tier}`} className="space-y-3">
                                <div className="flex items-start justify-between gap-4">
                                  <div>
                                    <p className="font-semibold text-sm text-gray-900">{tierMeta.title}</p>
                                    <p className="text-xs text-gray-500">{tierMeta.note}</p>
                                  </div>
                                  <Badge className={`text-xs ${tierMeta.badge}`}>
                                    {tierList.length} {tierList.length === 1 ? "property" : "properties"}
                                  </Badge>
                                </div>

                                <div className="space-y-4">
                                  {tierList.map((property: any) => (
                                    <div 
                                      key={`${tier}-${property.id}`} 
                                      className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors cursor-pointer"
                                      onClick={() => window.location.href = `/property/${property.id}`}
                                    >
                                      <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                          <h5 className="font-medium text-base mb-2">{property.title}</h5>
                                          
                                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                                            <Badge variant="outline" className="text-xs">
                                              {property.propertyType || property.property_type}
                                            </Badge>
                                            <Badge 
                                              variant={(property.transactionType || property.transaction_type) === "sale" ? "default" : "secondary"}
                                              className="text-xs"
                                            >
                                              {(property.transactionType || property.transaction_type) === "sale" ? "Buy" : "Rent"}
                                            </Badge>
                                            {property.bhk && (
                                              <Badge variant="outline" className="text-xs">{property.bhk} BHK</Badge>
                                            )}
                                            {(property.listingType || property.listing_type) && (
                                              <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-xs">
                                                {property.listingType || property.listing_type}
                                              </Badge>
                                            )}
                                            {property._distance !== null && property._distance !== undefined && (
                                              <Badge className="bg-orange-100 text-orange-700 border-orange-200 text-xs">
                                                <Navigation size={10} className="mr-1" />
                                                {property._distance < 1 
                                                  ? `${Math.round(property._distance * 1000)}m away`
                                                  : `${property._distance.toFixed(1)} km away`
                                                }
                                              </Badge>
                                            )}
                                            {!property._matchesPrice && (
                                              <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-xs">
                                                Price outside preferred band
                                              </Badge>
                                            )}
                                          </div>

                                          <div className="flex items-center text-gray-600 text-sm mb-1">
                                            <MapPin size={14} className="mr-1" />
                                            {property.location || property.fullAddress || property.full_address}
                                          </div>

                                          {(property.price || property.sale_price) && (
                                            <div className="flex items-center text-gray-600 text-sm mb-1">
                                              <IndianRupee size={14} className="mr-1" />
                                              <span className="font-semibold">₹{property.price || property.sale_price}</span>
                                            </div>
                                          )}

                                          {(property.size || property.area) && (
                                            <div className="flex items-center text-gray-600 text-sm">
                                              <Building size={14} className="mr-1" />
                                              {property.size || property.area} {property.sizeUnit || property.areaUnit || property.area_unit || 'sq.ft'}
                                            </div>
                                          )}

                                          <div className="text-xs text-gray-500 mt-2">
                                            Listed by: {property.broker?.name || property.owner?.name || "Unknown"}
                                          </div>
                                        </div>
                                        
                                        {property.photos && property.photos.length > 0 && (
                                          <div className="ml-4">
                                            <img 
                                              src={property.photos[0]} 
                                              alt={property.title}
                                              className="w-20 h-20 object-cover rounded-lg"
                                            />
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
              );
            })}
          </div>
        )}
      </div>

      </div>
    </AppLayout>
  );
}