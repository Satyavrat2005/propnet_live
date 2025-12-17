// app/admin/dashboard/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Shield,
  Users,
  Settings,
  LogOut,
  Check,
  X,
  Clock,
  UserCheck,
  UserX,
  AlertTriangle,
  MapPin,
  Building2,
  Phone,
  Mail,
  BadgeCheck,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Profile = {
  id: string;
  phone: string | null;
  name: string | null;
  email: string | null;
  bio: string | null;
  agency_name: string | null;
  rera_id: string | null;
  city: string | null;
  experience: string | null;
  website: string | null;
  area_of_expertise: string[] | null;
  working_regions: string[] | null;
  profile_photo_url: string | null;
  profile_complete: boolean | null;
  status: "pending" | "approved" | "rejected" | string | null;
  created_at: string;
  updated_at: string;
};

export default function AdminPortal() {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Admin (existing flow)
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
    if (!authLoading && !adminData) router.push("/admin/login");
  }, [authLoading, adminData, router]);

  // Users
  const { data: users, isLoading } = useQuery<Profile[]>({
    queryKey: ["/api/admin/users"],
    queryFn: async () => {
      const res = await fetch("/api/admin/users", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch users");
      return res.json();
    },
    enabled: !!adminData,
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "approved" | "rejected" }) => {
      const res = await fetch(`/api/admin/users/${id}`, {
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
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "Status Updated", description: "User status updated successfully." });
    },
    onError: (e: any) => {
      toast({
        title: "Update Failed",
        description: e?.message || "Failed to update user",
        variant: "destructive",
      });
    },
  });

  const handleLogout = async () => {
    try {
      const res = await fetch("/api/secure-portal/logout", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include" });
      if (!res.ok) throw new Error(await res.text());
      try { localStorage.removeItem("adminSessionToken"); } catch {}
      router.push("/admin/login");
    } catch (err: any) {
      toast({ title: "Logout Failed", description: err?.message || "Unable to logout", variant: "destructive" });
    }
  };

  // Manage Property button handler
  const goToManageProperty = () => {
    router.push("/admin");
  };

  // Manage Users button handler
  const goToManageUsers = () => {
    router.push("/admin/users");
  };

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

  const list = users || [];
  const total = list.length;
  const pending = list.filter((u) => (u.status || "pending").toLowerCase() === "pending");
  const approved = list.filter((u) => (u.status || "").toLowerCase() === "approved");
  const rejected = list.filter((u) => (u.status || "").toLowerCase() === "rejected");

  const getStatusBadge = (status?: string | null) => {
    switch ((status || "pending").toLowerCase()) {
      case "approved":
        return <Badge className="bg-green-100 text-green-700 border-green-300">Approved</Badge>;
      case "rejected":
        return <Badge className="bg-red-100 text-red-700 border-red-300">Rejected</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-300">Pending</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4 md:py-6">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
              {/* Header Title */}
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <Shield className="h-6 w-6 text-emerald-600" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Admin Portal</h1>
                  <p className="text-sm text-gray-600">Welcome, {adminData?.admin?.username}</p>
                </div>
              </div>

              {/* Buttons: Stack on mobile, horizontal on desktop */}
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-3">
                <Button
                  onClick={goToManageProperty}
                  variant="outline"
                  className="w-full md:w-auto border-emerald-600 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-600"
                >
                  <Building2 className="h-4 w-4 mr-2" />
                  Manage Property
                </Button>

                <Button
                  onClick={goToManageUsers}
                  variant="outline"
                  className="w-full md:w-auto border-emerald-600 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-600"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Registered Users
                </Button>

                <Button
                  onClick={handleLogout}
                  className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
          <Card className="bg-white border-gray-200 hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3 md:pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Signups</CardTitle>
            </CardHeader>
            <CardContent className="pb-6 md:pb-4">
              <div className="flex items-center justify-between md:gap-2">
                <span className="text-3xl md:text-2xl font-bold text-gray-900">{total}</span>
                <div className="p-3 md:p-2 bg-emerald-100 rounded-lg">
                  <Users className="h-6 w-6 md:h-5 md:w-5 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-200 hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3 md:pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Pending Review</CardTitle>
            </CardHeader>
            <CardContent className="pb-6 md:pb-4">
              <div className="flex items-center justify-between md:gap-2">
                <span className="text-3xl md:text-2xl font-bold text-gray-900">{pending.length}</span>
                <div className="p-3 md:p-2 bg-yellow-100 rounded-lg">
                  <Clock className="h-6 w-6 md:h-5 md:w-5 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-200 hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3 md:pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Approved</CardTitle>
            </CardHeader>
            <CardContent className="pb-6 md:pb-4">
              <div className="flex items-center justify-between md:gap-2">
                <span className="text-3xl md:text-2xl font-bold text-gray-900">{approved.length}</span>
                <div className="p-3 md:p-2 bg-green-100 rounded-lg">
                  <UserCheck className="h-6 w-6 md:h-5 md:w-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-200 hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3 md:pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Rejected</CardTitle>
            </CardHeader>
            <CardContent className="pb-6 md:pb-4">
              <div className="flex items-center justify-between md:gap-2">
                <span className="text-3xl md:text-2xl font-bold text-gray-900">{rejected.length}</span>
                <div className="p-3 md:p-2 bg-red-100 rounded-lg">
                  <UserX className="h-6 w-6 md:h-5 md:w-5 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="pending">
          <TabsList className="bg-white border border-gray-200">
            <TabsTrigger value="pending" className="data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700">
              Pending Users
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700">
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Pending list */}
          <TabsContent value="pending" className="mt-6">
            <Card className="bg-white border-gray-200">
              <CardHeader>
                <CardTitle className="text-gray-900">Pending User Approvals</CardTitle>
                <CardDescription className="text-gray-600">
                  Review and manage brokers who signed up
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-6 h-6 border-2 border-emerald-600/30 border-t-emerald-600 rounded-full animate-spin"></div>
                  </div>
                ) : pending.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">No pending users</div>
                ) : (
                  <div className="space-y-4 md:space-y-6">
                    {pending.map((u) => (
                      <div key={u.id} className="p-6 md:p-4 bg-gray-50 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-4">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg md:text-base text-gray-900 mb-1">
                              {u.name || "Unnamed Broker"}
                            </h3>
                            {u.rera_id && (
                              <span className="inline-flex items-center text-xs text-emerald-600 mb-2">
                                <BadgeCheck className="h-4 w-4 mr-1" /> RERA: {u.rera_id}
                              </span>
                            )}
                            {u.agency_name && (
                              <p className="text-sm text-gray-600">{u.agency_name}</p>
                            )}
                          </div>
                          {getStatusBadge(u.status)}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 text-sm mb-5">
                          <div className="space-y-2.5 md:space-y-1.5">
                            {u.phone && (
                              <p className="text-gray-600 flex items-center">
                                <Phone className="h-4 w-4 mr-2 flex-shrink-0" />
                                <span className="text-gray-900">{u.phone}</span>
                              </p>
                            )}
                            {u.email && (
                              <p className="text-gray-600 flex items-center">
                                <Mail className="h-4 w-4 mr-2 flex-shrink-0" />
                                <span className="text-gray-900 break-all">{u.email}</span>
                              </p>
                            )}
                            {u.city && (
                              <p className="text-gray-600 flex items-center">
                                <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
                                <span className="text-gray-900">{u.city}</span>
                              </p>
                            )}
                          </div>

                          <div className="space-y-2.5 md:space-y-1.5">
                            {u.experience && (
                              <p className="text-gray-600 flex items-center">
                                <Building2 className="h-4 w-4 mr-2 flex-shrink-0" />
                                <span className="text-gray-900">Experience: {u.experience}</span>
                              </p>
                            )}
                            {u.working_regions?.length ? (
                              <p className="text-gray-600">
                                Regions:{" "}
                                <span className="text-gray-900">
                                  {u.working_regions.join(", ")}
                                </span>
                              </p>
                            ) : null}
                            {u.area_of_expertise?.length ? (
                              <p className="text-gray-600">
                                Expertise:{" "}
                                <span className="text-gray-900">
                                  {u.area_of_expertise.join(", ")}
                                </span>
                              </p>
                            ) : null}
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-2.5 md:gap-2 pt-4 border-t border-gray-200">
                          <Button
                            size="sm"
                            className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white"
                            onClick={() => updateStatus.mutate({ id: u.id, status: "approved" })}
                            disabled={updateStatus.isPending}
                            type="button"
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateStatus.mutate({ id: u.id, status: "rejected" })}
                            className="w-full sm:w-auto border-red-600 text-red-600 hover:bg-red-50"
                            disabled={updateStatus.isPending}
                            type="button"
                          >
                            <X className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings (unchanged) */}
          <TabsContent value="settings" className="mt-6">
            <Card className="bg-white border-gray-200">
              <CardHeader>
                <CardTitle className="text-gray-900">Admin Settings</CardTitle>
                <CardDescription className="text-gray-600">
                  Manage admin account settings and security
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div className="flex items-center gap-3 mb-2">
                      <AlertTriangle className="h-5 w-5 text-yellow-600" />
                      <h3 className="font-medium text-gray-900">Security Notice</h3>
                    </div>
                    <p className="text-sm text-gray-600">
                      Your admin session is secured with device fingerprinting and encrypted tokens.
                      Always logout when using shared devices.
                    </p>
                  </div>

                  <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                    <h3 className="font-medium text-gray-900 mb-2">Session Information</h3>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>
                        Username: <span className="text-gray-900 font-medium">{adminData?.admin?.username}</span>
                      </p>
                      <p>
                        Email: <span className="text-gray-900 font-medium">{adminData?.admin?.email}</span>
                      </p>
                      <p>
                        Device Status: <span className="text-emerald-600 font-medium">Verified</span>
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
