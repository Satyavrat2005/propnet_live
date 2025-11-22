// app/admin/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, Clock, Users, MapPin, IndianRupee, ArrowLeft } from "lucide-react";

type Property = {
  property_id: string;
  id: string;
  property_title: string;
  property_type: string | null;
  transaction_type: string | null; // sale | rent
  bhk: number | null;
  area: number | null;
  area_unit: string | null;
  sale_price: string | null;
  location: string | null;
  full_address: string | null;
  building_society: string | null;
  description: string | null;
  property_photos: any[] | null;
  listing_type: string | null;
  public_property: boolean | null;
  owner_name: string | null;
  owner_phone: string | null;
  commission_terms: string | null;
  scope_of_work: string | null;
  agreement_document: string | null;
  approval_status: "pending" | "approved" | "rejected";
  created_at: string;
  updated_at: string;
};

export default function AdminProperties() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const router = useRouter();

  // Auth guard
  const [authLoading, setAuthLoading] = useState(true);
  const [adminData, setAdminData] = useState<any | null>(null);

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

  const { data: properties, isLoading } = useQuery<Property[]>({
    queryKey: ["/api/admin/properties"],
    queryFn: async () => {
      const res = await fetch("/api/admin/properties", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch properties");
      return res.json();
    },
    retry: false,
    enabled: !!adminData,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "approved" | "rejected" }) => {
      const res = await fetch(`/api/admin/properties/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Failed to update");
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/properties"] });
      toast({ title: "Status Updated", description: "Property status updated successfully." });
    },
    onError: (error: any) => {
      toast({ title: "Update Failed", description: error?.message || "Failed to update status", variant: "destructive" });
    },
  });

  const handleStatusUpdate = (id: string, status: "approved" | "rejected") => {
    updateStatusMutation.mutate({ id, status });
  };

  // show verifying spinner while checking auth
  if (authLoading || !adminData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-2 text-gray-700">
          <div className="w-6 h-6 border-2 border-emerald-600/30 border-t-emerald-600 rounded-full animate-spin"></div>
          Verifying authentication...
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading properties…</div>
      </div>
    );
  }

  const list = properties || [];
  const pending = list.filter((p) => p.approval_status === "pending");
  const approved = list.filter((p) => p.approval_status === "approved");
  const rejected = list.filter((p) => p.approval_status === "rejected");
  const total = list.length;

  const Price = ({ value }: { value?: string | null }) =>
    value ? (
      <span className="inline-flex items-center text-sm text-gray-700">
        <IndianRupee className="h-3.5 w-3.5 mr-1" />
        {value}
      </span>
    ) : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Property Approval</h1>
              <p className="text-gray-600 mt-1">Approve or reject property listings submitted by brokers</p>
            </div>
            <Button
              onClick={() => router.push("/admin/dashboard")}
              variant="outline"
              className="border-emerald-600 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-600"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
      <div className="container mx-auto px-4 py-8">

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="bg-white border-gray-200 hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{pending.length}</p>
                <p className="text-sm text-gray-600">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-200 hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{approved.length}</p>
                <p className="text-sm text-gray-600">Approved</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-200 hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-100 rounded-lg">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{rejected.length}</p>
                <p className="text-sm text-gray-600">Rejected</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-200 hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-100 rounded-lg">
                <Users className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{total}</p>
                <p className="text-sm text-gray-600">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Properties */}
      <Card className="mb-8 bg-white border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900">
            <Clock className="h-5 w-5 text-yellow-600" />
            Pending Properties ({pending.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pending.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No pending properties</p>
          ) : (
            <div className="space-y-4">
              {pending.map((p) => (
                <div key={p.property_id} className="border border-yellow-200 rounded-lg p-4 bg-yellow-50 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <div className="pr-4">
                      <h3 className="font-semibold text-lg text-gray-900">{p.property_title}</h3>
                      <div className="flex items-center gap-2 text-sm text-gray-700 mt-1">
                        {p.property_type && <Badge className="bg-emerald-100 text-emerald-700 border-emerald-300">{p.property_type}</Badge>}
                        {p.transaction_type && (
                          <Badge className={p.transaction_type === "sale" ? "bg-blue-100 text-blue-700 border-blue-300" : "bg-purple-100 text-purple-700 border-purple-300"}>
                            {p.transaction_type === "sale" ? "Sale" : "Rent"}
                          </Badge>
                        )}
                        {typeof p.bhk === "number" && p.bhk > 0 && (
                          <Badge className="bg-gray-100 text-gray-700 border-gray-300">{p.bhk} BHK</Badge>
                        )}
                      </div>
                      <div className="flex items-center text-gray-600 mt-2">
                        <MapPin className="h-4 w-4 mr-1" />
                        <span className="text-sm text-gray-900">{p.location || p.full_address}</span>
                      </div>
                      <div className="mt-1">
                        <Price value={p.sale_price} />
                      </div>
                      {p.description && (
                        <p className="text-sm text-gray-600 mt-2 line-clamp-2">{p.description}</p>
                      )}
                      {p.owner_name && (
                        <p className="text-xs text-gray-500 mt-2">
                          Owner: {p.owner_name} {p.owner_phone ? `• ${p.owner_phone}` : ""}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 mt-2">
                        Submitted: {new Date(p.created_at).toLocaleString()}
                      </p>
                    </div>

                    <div className="flex flex-col gap-2 min-w-[180px]">
                      <Button
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md"
                        onClick={() => handleStatusUpdate(p.property_id, "approved")}
                        disabled={updateStatusMutation.isPending}
                        type="button"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        className="bg-red-600 hover:bg-red-700 text-white shadow-md"
                        onClick={() => handleStatusUpdate(p.property_id, "rejected")}
                        disabled={updateStatusMutation.isPending}
                        type="button"
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Approved Properties */}
      <Card className="mb-8 bg-white border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Approved Properties ({approved.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {approved.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No approved properties yet</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {approved.map((p) => (
                <div key={p.property_id} className="border border-green-200 rounded-lg p-4 bg-green-50 hover:shadow-md transition-shadow">
                  <h3 className="font-semibold text-gray-900">{p.property_title}</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-700 mt-1">
                    {p.property_type && <Badge className="bg-emerald-100 text-emerald-700 border-emerald-300">{p.property_type}</Badge>}
                    {p.transaction_type && (
                      <Badge className={p.transaction_type === "sale" ? "bg-blue-100 text-blue-700 border-blue-300" : "bg-purple-100 text-purple-700 border-purple-300"}>
                        {p.transaction_type === "sale" ? "Sale" : "Rent"}
                      </Badge>
                    )}
                    {typeof p.bhk === "number" && p.bhk > 0 && (
                      <Badge className="bg-gray-100 text-gray-700 border-gray-300">{p.bhk} BHK</Badge>
                    )}
                  </div>
                  <div className="flex items-center text-gray-600 mt-2">
                    <MapPin className="h-4 w-4 mr-1" />
                    <span className="text-sm text-gray-900">{p.location || p.full_address}</span>
                  </div>
                  <div className="mt-1">
                    <Price value={p.sale_price} />
                  </div>
                  <Badge className="mt-3 bg-green-100 text-green-800 border-green-300">
                    Approved
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
