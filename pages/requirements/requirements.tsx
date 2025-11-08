// app/requirements/page.tsx
"use client";

import React, { useState } from "react";
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
import { Plus, Edit, Trash2, MapPin, Building, DollarSign, Calendar } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import MobileNavigation from "@/components/layout/mobile-navigation";

const requirementSchema = z.object({
  propertyType: z.string().min(1, "Property type is required"),
  transactionType: z.string().min(1, "Transaction type is required"),
  location: z.string().min(1, "Location is required"),
  minPrice: z.string().optional(),
  maxPrice: z.string().optional(),
  minSize: z.string().optional(),
  maxSize: z.string().optional(),
  sizeUnit: z.string().optional(),
  bhk: z.string().optional(),
  description: z.string().optional(),
});

type RequirementFormData = z.infer<typeof requirementSchema>;

interface Requirement {
  id: number;
  propertyType: string;
  transactionType: string;
  location: string;
  minPrice?: number;
  maxPrice?: number;
  minSize?: number;
  maxSize?: number;
  sizeUnit?: string;
  bhk?: string;
  description?: string;
  createdAt: string;
  user?: {
    name: string;
  };
}

export default function RequirementsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRequirement, setEditingRequirement] = useState<any>(null);

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
    enabled: !!user,
  });

  const { data: allRequirements = [] } = useQuery<Requirement[]>({
    queryKey: ["/api/property-requirements"],
    enabled: !!user,
  });

  const createMutation = useMutation({
    mutationFn: async (data: RequirementFormData) => {
      const res = await apiRequest("POST", "/api/property-requirements", data);
      if (res && typeof (res as Response).json === "function") return (res as Response).json();
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-requirements"] });
      queryClient.invalidateQueries({ queryKey: ["/api/property-requirements"] });
      setIsDialogOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "Requirement created successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create requirement",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: RequirementFormData }) => {
      const res = await apiRequest("PATCH", `/api/property-requirements/${id}`, data);
      if (res && typeof (res as Response).json === "function") return (res as Response).json();
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-requirements"] });
      queryClient.invalidateQueries({ queryKey: ["/api/property-requirements"] });
      setIsDialogOpen(false);
      setEditingRequirement(null);
      form.reset();
      toast({
        title: "Success",
        description: "Requirement updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update requirement",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/property-requirements/${id}`);
      if (res && typeof (res as Response).json === "function") return (res as Response).json();
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-requirements"] });
      queryClient.invalidateQueries({ queryKey: ["/api/property-requirements"] });
      toast({
        title: "Success",
        description: "Requirement deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete requirement",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: RequirementFormData) => {
    if (editingRequirement) {
      updateMutation.mutate({ id: editingRequirement.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (requirement: any) => {
    setEditingRequirement(requirement);
    form.reset({
      propertyType: requirement.propertyType,
      transactionType: requirement.transactionType,
      location: requirement.location,
      minPrice: requirement.minPrice?.toString() || "",
      maxPrice: requirement.maxPrice?.toString() || "",
      minSize: requirement.minSize?.toString() || "",
      maxSize: requirement.maxSize?.toString() || "",
      sizeUnit: requirement.sizeUnit || "sq.ft",
      bhk: requirement.bhk?.toString() || "",
      description: requirement.description || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    // native confirm is fine in client component
    if (confirm("Are you sure you want to delete this requirement?")) {
      deleteMutation.mutate(id);
    }
  };

  const formatPrice = (price: string) => {
    const numPrice = parseFloat(String(price || "") || "0");
    if (Number.isNaN(numPrice)) return price;
    if (numPrice >= 10000000) {
      return `₹${(numPrice / 10000000).toFixed(1)} Cr`;
    } else if (numPrice >= 100000) {
      return `₹${(numPrice / 100000).toFixed(1)} L`;
    } else {
      return `₹${numPrice.toLocaleString("en-IN")}`;
    }
  };

  if (!user) {
    return <div className="container mx-auto p-4">Please log in to view requirements</div>;
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl pb-20">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Property Requirements</h1>
          <p className="text-gray-600">Manage your property search requirements</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditingRequirement(null);
                form.reset();
              }}
              className="flex items-center gap-2"
              type="button"
            >
              <Plus size={16} />
              Add Requirement
            </Button>
          </DialogTrigger>

          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingRequirement ? "Edit Requirement" : "Add New Requirement"}</DialogTitle>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                          <SelectContent>
                            <SelectItem value="Apartment">Apartment</SelectItem>
                            <SelectItem value="Villa">Villa</SelectItem>
                            <SelectItem value="House">House</SelectItem>
                            <SelectItem value="Office">Office</SelectItem>
                            <SelectItem value="Shop">Shop</SelectItem>
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
                              <SelectValue placeholder="Buy or Rent" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="sale">Buy</SelectItem>
                            <SelectItem value="rent">Rent</SelectItem>
                          </SelectContent>
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
                        <Input placeholder="Enter location" {...field} />
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
                          <Input type="number" placeholder="Minimum price" {...field} />
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
                          <Input type="number" placeholder="Maximum price" {...field} />
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
                          <Input type="number" placeholder="Min size" {...field} />
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
                          <Input type="number" placeholder="Max size" {...field} />
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
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="sq.ft">Square Feet</SelectItem>
                            <SelectItem value="sq.m">Square Meters</SelectItem>
                            <SelectItem value="sq.yd">Square Yards</SelectItem>
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
                        <SelectContent>
                          <SelectItem value="1">1 BHK</SelectItem>
                          <SelectItem value="2">2 BHK</SelectItem>
                          <SelectItem value="3">3 BHK</SelectItem>
                          <SelectItem value="4">4 BHK</SelectItem>
                          <SelectItem value="5">5+ BHK</SelectItem>
                        </SelectContent>
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
                        <Textarea placeholder="Describe any specific requirements..." className="min-h-20" {...field} />
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
                  >
                    {createMutation.isPending || updateMutation.isPending
                      ? "Saving..."
                      : editingRequirement
                      ? "Update"
                      : "Create"}
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
            {requirements.map((requirement: any) => (
              <Card key={requirement.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline">{requirement.propertyType}</Badge>
                        <Badge variant={requirement.transactionType === "sale" ? "default" : "secondary"}>
                          {requirement.transactionType === "sale" ? "Buy" : "Rent"}
                        </Badge>
                        {requirement.bhk && <Badge variant="outline">{requirement.bhk} BHK</Badge>}
                      </div>

                      <div className="flex items-center text-gray-600 mb-2">
                        <MapPin size={16} className="mr-1" />
                        {requirement.location}
                      </div>

                      {(requirement.minPrice || requirement.maxPrice) && (
                        <div className="flex items-center text-gray-600 mb-2">
                          <DollarSign size={16} className="mr-1" />
                          {requirement.minPrice && requirement.maxPrice
                            ? `${formatPrice(requirement.minPrice)} - ${formatPrice(requirement.maxPrice)}`
                            : requirement.minPrice
                            ? `From ${formatPrice(requirement.minPrice)}`
                            : `Up to ${formatPrice(requirement.maxPrice)}`}
                        </div>
                      )}

                      {(requirement.minSize || requirement.maxSize) && (
                        <div className="flex items-center text-gray-600 mb-2">
                          <Building size={16} className="mr-1" />
                          {requirement.minSize && requirement.maxSize
                            ? `${requirement.minSize} - ${requirement.maxSize} ${requirement.sizeUnit}`
                            : requirement.minSize
                            ? `From ${requirement.minSize} ${requirement.sizeUnit}`
                            : `Up to ${requirement.maxSize} ${requirement.sizeUnit}`}
                        </div>
                      )}

                      {requirement.description && <p className="text-gray-600 text-sm mt-2">{requirement.description}</p>}

                      <div className="flex items-center text-xs text-gray-400 mt-3">
                        <Calendar size={12} className="mr-1" />
                        Created {new Date(requirement.createdAt).toLocaleDateString()}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(requirement)}>
                        <Edit size={14} />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDelete(requirement.id)} className="text-red-600 hover:text-red-700">
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

      {/* Network Requirements */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Network Requirements ({allRequirements.length})</h2>
        {allRequirements.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Building className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No network requirements</h3>
              <p className="text-gray-600">Requirements from other agents in your network will appear here.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {allRequirements.map((requirement: any) => (
              <Card key={requirement.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline">{requirement.propertyType}</Badge>
                        <Badge variant={requirement.transactionType === "sale" ? "default" : "secondary"}>
                          {requirement.transactionType === "sale" ? "Buy" : "Rent"}
                        </Badge>
                        {requirement.bhk && <Badge variant="outline">{requirement.bhk} BHK</Badge>}
                      </div>

                      <div className="flex items-center text-gray-600 mb-2">
                        <MapPin size={16} className="mr-1" />
                        {requirement.location}
                      </div>

                      {(requirement.minPrice || requirement.maxPrice) && (
                        <div className="flex items-center text-gray-600 mb-2">
                          <DollarSign size={16} className="mr-1" />
                          {requirement.minPrice && requirement.maxPrice
                            ? `${formatPrice(requirement.minPrice)} - ${formatPrice(requirement.maxPrice)}`
                            : requirement.minPrice
                            ? `From ${formatPrice(requirement.minPrice)}`
                            : `Up to ${formatPrice(requirement.maxPrice)}`}
                        </div>
                      )}

                      {requirement.description && <p className="text-gray-600 text-sm mt-2">{requirement.description}</p>}

                      <div className="text-xs text-gray-500 mt-3">
                        By {requirement.user?.name} • {new Date(requirement.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <MobileNavigation />
    </div>
  );
}
