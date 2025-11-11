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
        const res = await fetch("/api/secure-portal/me");
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
      const res = await fetch("/api/admin/users", { credentials: "same-origin" });
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
        credentials: "same-origin",
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
      const res = await fetch("/api/secure-portal/logout", { method: "POST", headers: { "Content-Type": "application/json" } });
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

  if (authLoading || !adminData) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="flex items-center gap-2 text-white">
          <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
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
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/50">Approved</Badge>;
      case "rejected":
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/50">Rejected</Badge>;
      default:
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50">Pending</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600/20 rounded-lg">
                <Shield className="h-6 w-6 text-blue-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Admin Portal</h1>
                <p className="text-sm text-slate-400">Welcome, {adminData?.admin?.username}</p>
              </div>
            </div>

            {/* Buttons: Manage Property (new) + Logout (existing) */}
            <div className="flex items-center gap-3">
              <Button
                onClick={goToManageProperty}
                variant="outline"
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                Manage Property
              </Button>

              <Button
                onClick={handleLogout}
                variant="outline"
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Total Signups</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-400" />
                <span className="text-2xl font-bold text-white">{total}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Pending Review</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-yellow-400" />
                <span className="text-2xl font-bold text-white">{pending.length}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Approved</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-green-400" />
                <span className="text-2xl font-bold text-white">{approved.length}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Rejected</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <UserX className="h-5 w-5 text-red-400" />
                <span className="text-2xl font-bold text-white">{rejected.length}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="pending">
          <TabsList className="bg-slate-800 border-slate-700">
            <TabsTrigger value="pending" className="data-[state=active]:bg-slate-700">
              Pending Users
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-slate-700">
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Pending list */}
          <TabsContent value="pending" className="mt-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Pending User Approvals</CardTitle>
                <CardDescription className="text-slate-400">
                  Review and manage brokers who signed up
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  </div>
                ) : pending.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">No pending users</div>
                ) : (
                  <div className="space-y-4">
                    {pending.map((u) => (
                      <div key={u.id} className="p-4 bg-slate-700/50 rounded-lg border border-slate-600">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-semibold text-white">
                              {u.name || "Unnamed Broker"}{" "}
                              {u.rera_id ? (
                                <span className="inline-flex items-center ml-2 text-xs text-green-400">
                                  <BadgeCheck className="h-4 w-4 mr-1" /> RERA: {u.rera_id}
                                </span>
                              ) : null}
                            </h3>
                            {u.agency_name && (
                              <p className="text-sm text-slate-400">{u.agency_name}</p>
                            )}
                          </div>
                          {getStatusBadge(u.status)}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div className="space-y-1">
                            {u.phone && (
                              <p className="text-slate-400 flex items-center">
                                <Phone className="h-4 w-4 mr-2" />
                                <span className="text-white">{u.phone}</span>
                              </p>
                            )}
                            {u.email && (
                              <p className="text-slate-400 flex items-center">
                                <Mail className="h-4 w-4 mr-2" />
                                <span className="text-white">{u.email}</span>
                              </p>
                            )}
                            {u.city && (
                              <p className="text-slate-400 flex items-center">
                                <MapPin className="h-4 w-4 mr-2" />
                                <span className="text-white">{u.city}</span>
                              </p>
                            )}
                          </div>

                          <div className="space-y-1">
                            {u.experience && (
                              <p className="text-slate-400 flex items-center">
                                <Building2 className="h-4 w-4 mr-2" />
                                <span className="text-white">Experience: {u.experience}</span>
                              </p>
                            )}
                            {u.working_regions?.length ? (
                              <p className="text-slate-400">
                                Regions:{" "}
                                <span className="text-white">
                                  {u.working_regions.join(", ")}
                                </span>
                              </p>
                            ) : null}
                            {u.area_of_expertise?.length ? (
                              <p className="text-slate-400">
                                Expertise:{" "}
                                <span className="text-white">
                                  {u.area_of_expertise.join(", ")}
                                </span>
                              </p>
                            ) : null}
                          </div>
                        </div>

                        <div className="flex gap-2 mt-4">
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
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
                            className="border-red-500 text-red-400 hover:bg-red-500/10"
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
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Admin Settings</CardTitle>
                <CardDescription className="text-slate-400">
                  Manage admin account settings and security
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-slate-700/50 rounded-lg border border-slate-600">
                    <div className="flex items-center gap-3 mb-2">
                      <AlertTriangle className="h-5 w-5 text-yellow-400" />
                      <h3 className="font-medium text-white">Security Notice</h3>
                    </div>
                    <p className="text-sm text-slate-400">
                      Your admin session is secured with device fingerprinting and encrypted tokens.
                      Always logout when using shared devices.
                    </p>
                  </div>

                  <div className="p-4 bg-slate-700/50 rounded-lg border border-slate-600">
                    <h3 className="font-medium text-white mb-2">Session Information</h3>
                    <div className="text-sm text-slate-400 space-y-1">
                      <p>
                        Username: <span className="text-white">{adminData?.admin?.username}</span>
                      </p>
                      <p>
                        Email: <span className="text-white">{adminData?.admin?.email}</span>
                      </p>
                      <p>
                        Device Status: <span className="text-green-400">Verified</span>
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
