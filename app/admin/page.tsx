// app/admin/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { CubeLoader } from "@/components/ui/cube-loader";
import { 
  Building2, 
  MapPin, 
  ArrowLeft, 
  Plus, 
  Edit, 
  Trash2, 
  Calendar,
  Ruler,
  Users,
  Home,
  Search,
  TrendingUp,
  Clock
} from "lucide-react";

type PrimaryListing = {
  id: number;
  project_name: string | null;
  project_description: string | null;
  details: string | null;
  end_date: string | null;
  blocks: string | null;
  promoter: string | null;
  site_address: string | null;
  land_area: number | null;
  total_area_of_land: number | null;
  total_carpet_area: number | null;
  latitude: number | null;
  longitude: number | null;
};

export default function AdminPrimaryListings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const router = useRouter();

  // Auth guard
  const [authLoading, setAuthLoading] = useState(true);
  const [adminData, setAdminData] = useState<any | null>(null);

  // UI state
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingListing, setEditingListing] = useState<PrimaryListing | null>(null);
  const [listingToDelete, setListingToDelete] = useState<PrimaryListing | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Form state
  const [formData, setFormData] = useState({
    project_name: "",
    project_description: "",
    details: "",
    end_date: "",
    blocks: "",
    promoter: "",
    site_address: "",
    land_area: "",
    total_area_of_land: "",
    total_carpet_area: "",
    latitude: "",
    longitude: "",
  });

  useEffect(() => {
    let mounted = true;
    (async () => {
      setAuthLoading(true);
      try {
        const res = await fetch("/api/secure-portal/me", { credentials: "include" });
        if (!mounted) return;
        setAdminData(res.ok ? await res.json() : null);
      } catch {
        if (!mounted) return;
        setAdminData(null);
      } finally {
        if (mounted) setAuthLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!authLoading && !adminData) {
      router.push("/admin/login");
    }
  }, [authLoading, adminData, router]);

  const { data: listings, isLoading } = useQuery<PrimaryListing[]>({
    queryKey: ["/api/admin/primary-listings"],
    queryFn: async () => {
      const res = await fetch("/api/admin/primary-listings", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch primary listings");
      return res.json();
    },
    retry: false,
    enabled: !!adminData,
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/admin/primary-listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Failed to create listing");
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/primary-listings"] });
      toast({ title: "Success", description: "Primary listing created successfully." });
      setIsAddDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error?.message || "Failed to create listing", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await fetch(`/api/admin/primary-listings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Failed to update listing");
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/primary-listings"] });
      toast({ title: "Success", description: "Primary listing updated successfully." });
      setIsEditDialogOpen(false);
      setEditingListing(null);
      resetForm();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error?.message || "Failed to update listing", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/primary-listings/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json?.message || "Failed to delete listing");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/primary-listings"] });
      toast({ title: "Success", description: "Primary listing deleted successfully." });
      setIsDeleteDialogOpen(false);
      setListingToDelete(null);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error?.message || "Failed to delete listing", variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({
      project_name: "",
      project_description: "",
      details: "",
      end_date: "",
      blocks: "",
      promoter: "",
      site_address: "",
      land_area: "",
      total_area_of_land: "",
      total_carpet_area: "",
      latitude: "",
      longitude: "",
    });
  };

  const handleEdit = (listing: PrimaryListing) => {
    setEditingListing(listing);
    setFormData({
      project_name: listing.project_name || "",
      project_description: listing.project_description || "",
      details: listing.details || "",
      end_date: listing.end_date || "",
      blocks: listing.blocks || "",
      promoter: listing.promoter || "",
      site_address: listing.site_address || "",
      land_area: listing.land_area?.toString() || "",
      total_area_of_land: listing.total_area_of_land?.toString() || "",
      total_carpet_area: listing.total_carpet_area?.toString() || "",
      latitude: listing.latitude?.toString() || "",
      longitude: listing.longitude?.toString() || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const payload = {
      ...formData,
      land_area: formData.land_area ? parseFloat(formData.land_area) : null,
      total_area_of_land: formData.total_area_of_land ? parseFloat(formData.total_area_of_land) : null,
      total_carpet_area: formData.total_carpet_area ? parseFloat(formData.total_carpet_area) : null,
      latitude: formData.latitude ? parseFloat(formData.latitude) : null,
      longitude: formData.longitude ? parseFloat(formData.longitude) : null,
    };

    if (editingListing) {
      updateMutation.mutate({ id: editingListing.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  // Filter listings based on search query
  const filteredListings = listings?.filter((listing) => {
    const query = searchQuery.toLowerCase();
    return (
      listing.project_name?.toLowerCase().includes(query) ||
      listing.promoter?.toLowerCase().includes(query) ||
      listing.site_address?.toLowerCase().includes(query) ||
      listing.blocks?.toLowerCase().includes(query)
    );
  });

  if (authLoading || !adminData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <CubeLoader message="Verifying authentication..." />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <CubeLoader message="Loading primary listings..." />
      </div>
    );
  }

  const safeFilteredListings = filteredListings || [];
  const total = listings?.length || 0;
  const activeListings = listings?.filter((l) => {
    if (!l.end_date) return true;
    return new Date(l.end_date) >= new Date();
  }).length || 0;
  const expiredListings = listings?.filter((l) => {
    if (!l.end_date) return false;
    return new Date(l.end_date) < new Date();
  }).length || 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Primary Listings Management</h1>
              <p className="text-gray-600 mt-1">Manage all primary property listings and projects</p>
            </div>
            <div className="flex items-center gap-3">
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                    <Plus className="h-4 w-4 mr-2" />
                    Add New Listing
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-gray-900">Add New Primary Listing</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <Label htmlFor="project_name" className="text-gray-700 font-medium">Project Name *</Label>
                        <Input
                          id="project_name"
                          value={formData.project_name}
                          onChange={(e) => setFormData({ ...formData, project_name: e.target.value })}
                          required
                          placeholder="Enter project name"
                          className="mt-1"
                        />
                      </div>
                      
                      <div className="col-span-2">
                        <Label htmlFor="project_description" className="text-gray-700 font-medium">Project Description</Label>
                        <Textarea
                          id="project_description"
                          value={formData.project_description}
                          onChange={(e) => setFormData({ ...formData, project_description: e.target.value })}
                          placeholder="Brief description of the project"
                          rows={3}
                          className="mt-1"
                        />
                      </div>

                      <div className="col-span-2">
                        <Label htmlFor="details" className="text-gray-700 font-medium">Additional Details</Label>
                        <Textarea
                          id="details"
                          value={formData.details}
                          onChange={(e) => setFormData({ ...formData, details: e.target.value })}
                          placeholder="Detailed information about the project"
                          rows={4}
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label htmlFor="promoter" className="text-gray-700 font-medium">Promoter/Developer</Label>
                        <Input
                          id="promoter"
                          value={formData.promoter}
                          onChange={(e) => setFormData({ ...formData, promoter: e.target.value })}
                          placeholder="Developer name"
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label htmlFor="blocks" className="text-gray-700 font-medium">Blocks/Towers</Label>
                        <Input
                          id="blocks"
                          value={formData.blocks}
                          onChange={(e) => setFormData({ ...formData, blocks: e.target.value })}
                          placeholder="e.g., A, B, C"
                          className="mt-1"
                        />
                      </div>

                      <div className="col-span-2">
                        <Label htmlFor="site_address" className="text-gray-700 font-medium">Site Address</Label>
                        <Textarea
                          id="site_address"
                          value={formData.site_address}
                          onChange={(e) => setFormData({ ...formData, site_address: e.target.value })}
                          placeholder="Complete project address"
                          rows={2}
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label htmlFor="land_area" className="text-gray-700 font-medium">Land Area</Label>
                        <Input
                          id="land_area"
                          type="number"
                          step="0.01"
                          value={formData.land_area}
                          onChange={(e) => setFormData({ ...formData, land_area: e.target.value })}
                          placeholder="Land area in sq units"
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label htmlFor="total_area_of_land" className="text-gray-700 font-medium">Total Land Area</Label>
                        <Input
                          id="total_area_of_land"
                          type="number"
                          step="0.01"
                          value={formData.total_area_of_land}
                          onChange={(e) => setFormData({ ...formData, total_area_of_land: e.target.value })}
                          placeholder="Total area"
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label htmlFor="total_carpet_area" className="text-gray-700 font-medium">Total Carpet Area</Label>
                        <Input
                          id="total_carpet_area"
                          type="number"
                          step="0.01"
                          value={formData.total_carpet_area}
                          onChange={(e) => setFormData({ ...formData, total_carpet_area: e.target.value })}
                          placeholder="Carpet area"
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label htmlFor="end_date" className="text-gray-700 font-medium">Project End Date</Label>
                        <Input
                          id="end_date"
                          type="date"
                          value={formData.end_date}
                          onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label htmlFor="latitude" className="text-gray-700 font-medium">Latitude</Label>
                        <Input
                          id="latitude"
                          type="number"
                          step="0.000001"
                          value={formData.latitude}
                          onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                          placeholder="e.g., 19.076090"
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label htmlFor="longitude" className="text-gray-700 font-medium">Longitude</Label>
                        <Input
                          id="longitude"
                          type="number"
                          step="0.000001"
                          value={formData.longitude}
                          onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                          placeholder="e.g., 72.877426"
                          className="mt-1"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setIsAddDialogOpen(false);
                          resetForm();
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={createMutation.isPending}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        {createMutation.isPending ? "Creating..." : "Create Listing"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>

              <Button
                onClick={() => router.push("/admin/dashboard")}
                variant="outline"
                className="border-emerald-600 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-600"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-700 text-sm font-medium">Total Listings</p>
                  <p className="text-3xl font-bold text-emerald-900 mt-2">{total}</p>
                </div>
                <Building2 className="h-12 w-12 text-emerald-600 opacity-70" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-700 text-sm font-medium">Active Projects</p>
                  <p className="text-3xl font-bold text-green-900 mt-2">{activeListings}</p>
                </div>
                <TrendingUp className="h-12 w-12 text-green-600 opacity-70" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-amber-700 text-sm font-medium">Expired Projects</p>
                  <p className="text-3xl font-bold text-amber-900 mt-2">{expiredListings}</p>
                </div>
                <Clock className="h-12 w-12 text-amber-600 opacity-70" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-700 text-sm font-medium">Total Area</p>
                  <p className="text-3xl font-bold text-blue-900 mt-2">
                    {safeFilteredListings.reduce((sum, listing) => {
                      const area = listing.total_carpet_area;
                      return sum + (area ? parseFloat(area.toString()) : 0);
                    }, 0).toFixed(0)}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">sq. units</p>
                </div>
                <MapPin className="h-12 w-12 text-blue-600 opacity-70" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search by project name, promoter, location, or blocks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 py-6 text-base border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Primary Listings Grid */}
        {safeFilteredListings.length === 0 ? (
          <Card className="bg-white border-gray-200">
            <CardContent className="p-12 text-center">
              <Building2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No primary listings found</p>
              <p className="text-gray-400 text-sm mt-2">Click "Add New Listing" to create your first primary listing</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {safeFilteredListings.map((listing) => {
              const isExpired = listing.end_date && new Date(listing.end_date) < new Date();
              
              return (
                <Card 
                  key={listing.id} 
                  className={`bg-white border-2 hover:shadow-xl transition-all ${
                    isExpired ? 'border-amber-300 bg-amber-50' : 'border-emerald-200 hover:border-emerald-400'
                  }`}
                >
                  <CardContent className="p-6">
                    {/* Project Name & Status */}
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-bold text-xl text-gray-900 line-clamp-2 flex-1">
                        {listing.project_name}
                      </h3>
                      <Badge className={isExpired ? 'bg-amber-100 text-amber-800 border-amber-300 ml-2' : 'bg-green-100 text-green-800 border-green-300 ml-2'}>
                        {isExpired ? 'Expired' : 'Active'}
                      </Badge>
                    </div>

                    {/* Promoter */}
                    {listing.promoter && (
                      <div className="flex items-center gap-2 mb-3">
                        <Building2 className="h-4 w-4 text-emerald-600" />
                        <p className="text-sm font-medium text-gray-700">{listing.promoter}</p>
                      </div>
                    )}

                    {/* Location */}
                    {listing.site_address && (
                      <div className="flex items-start gap-2 mb-3">
                        <MapPin className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-gray-600 line-clamp-2">{listing.site_address}</p>
                      </div>
                    )}

                    {/* Description */}
                    {listing.project_description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-3">{listing.project_description}</p>
                    )}

                    {/* Details Grid */}
                    <div className="grid grid-cols-2 gap-3 mb-4 pt-3 border-t border-gray-200">
                      {listing.blocks && (
                        <div>
                          <p className="text-xs text-gray-500">Blocks</p>
                          <p className="text-sm font-semibold text-gray-900">{listing.blocks}</p>
                        </div>
                      )}
                      {listing.total_carpet_area && (
                        <div>
                          <p className="text-xs text-gray-500">Carpet Area</p>
                          <p className="text-sm font-semibold text-gray-900">{Number(listing.total_carpet_area).toFixed(0)} sq.u</p>
                        </div>
                      )}
                      {listing.land_area && (
                        <div>
                          <p className="text-xs text-gray-500">Land Area</p>
                          <p className="text-sm font-semibold text-gray-900">{Number(listing.land_area).toFixed(0)} sq.u</p>
                        </div>
                      )}
                      {listing.end_date && (
                        <div>
                          <p className="text-xs text-gray-500">End Date</p>
                          <p className="text-sm font-semibold text-gray-900">{new Date(listing.end_date).toLocaleDateString()}</p>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-3 border-t border-gray-200">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 border-blue-600 text-blue-600 hover:bg-blue-50"
                        onClick={() => handleEdit(listing)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 border-red-600 text-red-600 hover:bg-red-50"
                        onClick={() => {
                          setListingToDelete(listing);
                          setIsDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-gray-900">Edit Primary Listing</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="edit_project_name" className="text-gray-700 font-medium">Project Name *</Label>
                  <Input
                    id="edit_project_name"
                    value={formData.project_name}
                    onChange={(e) => setFormData({ ...formData, project_name: e.target.value })}
                    required
                    placeholder="Enter project name"
                    className="mt-1"
                  />
                </div>
                
                <div className="col-span-2">
                  <Label htmlFor="edit_project_description" className="text-gray-700 font-medium">Project Description</Label>
                  <Textarea
                    id="edit_project_description"
                    value={formData.project_description}
                    onChange={(e) => setFormData({ ...formData, project_description: e.target.value })}
                    placeholder="Brief description of the project"
                    rows={3}
                    className="mt-1"
                  />
                </div>

                <div className="col-span-2">
                  <Label htmlFor="edit_details" className="text-gray-700 font-medium">Additional Details</Label>
                  <Textarea
                    id="edit_details"
                    value={formData.details}
                    onChange={(e) => setFormData({ ...formData, details: e.target.value })}
                    placeholder="Detailed information about the project"
                    rows={4}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="edit_promoter" className="text-gray-700 font-medium">Promoter/Developer</Label>
                  <Input
                    id="edit_promoter"
                    value={formData.promoter}
                    onChange={(e) => setFormData({ ...formData, promoter: e.target.value })}
                    placeholder="Developer name"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="edit_blocks" className="text-gray-700 font-medium">Blocks/Towers</Label>
                  <Input
                    id="edit_blocks"
                    value={formData.blocks}
                    onChange={(e) => setFormData({ ...formData, blocks: e.target.value })}
                    placeholder="e.g., A, B, C"
                    className="mt-1"
                  />
                </div>

                <div className="col-span-2">
                  <Label htmlFor="edit_site_address" className="text-gray-700 font-medium">Site Address</Label>
                  <Textarea
                    id="edit_site_address"
                    value={formData.site_address}
                    onChange={(e) => setFormData({ ...formData, site_address: e.target.value })}
                    placeholder="Complete project address"
                    rows={2}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="edit_land_area" className="text-gray-700 font-medium">Land Area</Label>
                  <Input
                    id="edit_land_area"
                    type="number"
                    step="0.01"
                    value={formData.land_area}
                    onChange={(e) => setFormData({ ...formData, land_area: e.target.value })}
                    placeholder="Land area in sq units"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="edit_total_area_of_land" className="text-gray-700 font-medium">Total Land Area</Label>
                  <Input
                    id="edit_total_area_of_land"
                    type="number"
                    step="0.01"
                    value={formData.total_area_of_land}
                    onChange={(e) => setFormData({ ...formData, total_area_of_land: e.target.value })}
                    placeholder="Total area"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="edit_total_carpet_area" className="text-gray-700 font-medium">Total Carpet Area</Label>
                  <Input
                    id="edit_total_carpet_area"
                    type="number"
                    step="0.01"
                    value={formData.total_carpet_area}
                    onChange={(e) => setFormData({ ...formData, total_carpet_area: e.target.value })}
                    placeholder="Carpet area"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="edit_end_date" className="text-gray-700 font-medium">Project End Date</Label>
                  <Input
                    id="edit_end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="edit_latitude" className="text-gray-700 font-medium">Latitude</Label>
                  <Input
                    id="edit_latitude"
                    type="number"
                    step="0.000001"
                    value={formData.latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                    placeholder="e.g., 19.076090"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="edit_longitude" className="text-gray-700 font-medium">Longitude</Label>
                  <Input
                    id="edit_longitude"
                    type="number"
                    step="0.000001"
                    value={formData.longitude}
                    onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                    placeholder="e.g., 72.877426"
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditDialogOpen(false);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {updateMutation.isPending ? "Updating..." : "Update Listing"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="text-2xl font-bold text-gray-900">Delete Primary Listing</AlertDialogTitle>
              <AlertDialogDescription className="text-gray-600 text-base">
                Are you sure you want to delete <span className="font-semibold text-gray-900">{listingToDelete?.project_name}</span>? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (listingToDelete) {
                    deleteMutation.mutate(listingToDelete.id);
                  }
                }}
                disabled={deleteMutation.isPending}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {deleteMutation.isPending ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
