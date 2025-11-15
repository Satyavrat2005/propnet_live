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
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-2 text-gray-700">
          <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
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
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Button
          onClick={() => router.push("/admin/dashboard")}
          variant="outline"
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
      </div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Property Approval</h1>
        <p className="text-gray-600">Approve or reject property listings submitted by brokers</p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-600 mr-3" />
              <div>
                <p className="text-2xl font-bold">{pending.length}</p>
                <p className="text-sm text-gray-600">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <p className="text-2xl font-bold">{approved.length}</p>
                <p className="text-sm text-gray-600">Approved</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <XCircle className="h-8 w-8 text-red-600 mr-3" />
              <div>
                <p className="text-2xl font-bold">{rejected.length}</p>
                <p className="text-sm text-gray-600">Rejected</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <p className="text-2xl font-bold">{total}</p>
                <p className="text-sm text-gray-600">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Properties */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-yellow-600" />
            Pending Properties ({pending.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pending.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No pending properties</p>
          ) : (
            <div className="space-y-4">
              {pending.map((p) => (
                <div key={p.property_id} className="border rounded-lg p-4 bg-yellow-50">
                  <div className="flex justify-between items-start">
                    <div className="pr-4">
                      <h3 className="font-semibold text-lg">{p.property_title}</h3>
                      <div className="flex items-center gap-2 text-sm text-gray-700 mt-1">
                        {p.property_type && <Badge variant="outline">{p.property_type}</Badge>}
                        {p.transaction_type && (
                          <Badge variant={p.transaction_type === "sale" ? "default" : "secondary"}>
                            {p.transaction_type === "sale" ? "Sale" : "Rent"}
                          </Badge>
                        )}
                        {typeof p.bhk === "number" && p.bhk > 0 && (
                          <Badge variant="outline">{p.bhk} BHK</Badge>
                        )}
                      </div>
                      <div className="flex items-center text-gray-600 mt-2">
                        <MapPin className="h-4 w-4 mr-1" />
                        <span className="text-sm">{p.location || p.full_address}</span>
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
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => handleStatusUpdate(p.property_id, "approved")}
                        disabled={updateStatusMutation.isPending}
                        type="button"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
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
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Approved Properties ({approved.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {approved.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No approved properties yet</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {approved.map((p) => (
                <div key={p.property_id} className="border rounded-lg p-4 bg-green-50">
                  <h3 className="font-semibold">{p.property_title}</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-700 mt-1">
                    {p.property_type && <Badge variant="outline">{p.property_type}</Badge>}
                    {p.transaction_type && (
                      <Badge variant={p.transaction_type === "sale" ? "default" : "secondary"}>
                        {p.transaction_type === "sale" ? "Sale" : "Rent"}
                      </Badge>
                    )}
                    {typeof p.bhk === "number" && p.bhk > 0 && (
                      <Badge variant="outline">{p.bhk} BHK</Badge>
                    )}
                  </div>
                  <div className="flex items-center text-gray-600 mt-2">
                    <MapPin className="h-4 w-4 mr-1" />
                    <span className="text-sm">{p.location || p.full_address}</span>
                  </div>
                  <div className="mt-1">
                    <Price value={p.sale_price} />
                  </div>
                  <Badge variant="secondary" className="mt-3 bg-green-100 text-green-800">
                    Approved
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
