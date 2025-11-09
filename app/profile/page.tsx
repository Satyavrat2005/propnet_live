// app/profile/page.tsx
"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  User as UserIcon,
  Home as HomeIcon,
  Handshake,
  Settings as SettingsIcon,
  LogOut as LogOutIcon,
  ChevronRight,
  Award,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import MobileNavigation from "@/components/layout/mobile-navigation";

export default function ProfilePage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: myProperties = [] } = useQuery({
    queryKey: ["/api/my-properties"],
    queryFn: async () => {
      const response = await fetch("/api/my-properties");
      if (!response.ok) throw new Error("Failed to fetch properties");
      return response.json();
    },
  });

  const { data: colistingRequests = [] } = useQuery({
    queryKey: ["/api/colisting-requests"],
    queryFn: async () => {
      const response = await fetch("/api/colisting-requests");
      if (!response.ok) throw new Error("Failed to fetch colisting requests");
      return response.json();
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/auth/logout");
    },
    onSuccess: () => {
      // clear local auth and queries, then redirect to home
      try {
        logout();
      } catch {}
      queryClient.clear();
      router.replace("/");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to logout. Please try again.",
        variant: "destructive",
      });
    },
  });

  // If user is not present, redirect to home (same behaviour as original)
  useEffect(() => {
    if (!user) {
      router.replace("/");
    }
  }, [user, router]);

  if (!user) {
    // Keep behavior consistent with original: don't render profile when user missing
    return null;
  }

  const pendingRequests = (colistingRequests as any[]).filter((req: any) => req.status === "pending").length;

  const menuItems = [
    {
      icon: HomeIcon,
      label: "My Properties",
      action: () => router.push("/feed"),
    },
    {
      icon: Handshake,
      label: "Co-listing Requests",
      badge: pendingRequests > 0 ? pendingRequests : null,
      action: () => router.push("/colisting-requests"),
    },
    {
      icon: UserIcon,
      label: "Edit Profile",
      action: () => router.push("/edit-profile"),
    },
    {
      icon: SettingsIcon,
      label: "Settings",
      action: () => toast({ title: "Coming Soon", description: "Settings will be available soon" }),
    },
  ];

  return (
    <div className="flex flex-col min-h-screen pb-20">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-neutral-100 z-10">
        <div className="flex items-center px-6 py-4">
          <button
            className="text-primary mr-4"
            onClick={() => router.push("/feed")}
          >
            <ArrowLeft size={24} />
          </button>
          <h2 className="text-lg font-semibold text-neutral-900">Profile</h2>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <div className="px-6 py-6">
          {/* Profile Header */}
          <div className="text-center mb-8">
            <div className="w-24 h-24 bg-neutral-200 rounded-full mx-auto mb-4 flex items-center justify-center relative">
              {user?.profilePhoto ? (
                // keep identical markup/source paths
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`/uploads/${user.profilePhoto}`}
                  alt="Profile Photo"
                  className="w-full h-full rounded-full object-cover"
                />
              ) : user?.agencyLogo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`/uploads/${user.agencyLogo}`}
                  alt="Agency Logo"
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span className="text-2xl font-bold text-neutral-500">
                  {user?.name?.charAt(0) || "A"}
                </span>
              )}
            </div>

            <h3 className="text-xl font-bold text-neutral-900">{user?.name || "Agent"}</h3>
            <p className="text-neutral-500">{user?.agencyName || "Real Estate Agent"}</p>
            {user?.email && <p className="text-sm text-neutral-400">{user.email}</p>}
            {user?.city && <p className="text-sm text-neutral-400">{user.city}</p>}

            <div className="flex flex-wrap items-center justify-center gap-2 mt-3">
              <Badge className="bg-accent text-white">
                <Award size={12} className="mr-1" />
                {user?.isVerified ? "Verified Agent" : "Pending Verification"}
              </Badge>
              {user?.experience && (
                <Badge variant="secondary">
                  {user.experience}+ years
                </Badge>
              )}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="text-center p-4 bg-neutral-50 rounded-lg">
              <div className="text-2xl font-bold text-primary">{Array.isArray(myProperties) ? myProperties.length : 0}</div>
              <div className="text-xs text-neutral-500">Active Listings</div>
            </div>
            <div className="text-center p-4 bg-neutral-50 rounded-lg">
              <div className="text-2xl font-bold text-accent">{pendingRequests}</div>
              <div className="text-xs text-neutral-500">Pending Requests</div>
            </div>
            <div className="text-center p-4 bg-neutral-50 rounded-lg">
              <div className="text-2xl font-bold text-neutral-600">0</div>
              <div className="text-xs text-neutral-500">Deals Closed</div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="space-y-2">
            {menuItems.map((item, index) => (
              <button
                key={index}
                onClick={item.action}
                className="w-full flex items-center justify-between p-4 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <item.icon size={20} />
                  <span>{item.label}</span>
                </div>
                <div className="flex items-center space-x-2">
                  {item.badge && (
                    <Badge variant="secondary" className="text-xs">
                      {item.badge}
                    </Badge>
                  )}
                  <ChevronRight size={16} />
                </div>
              </button>
            ))}

            <button
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
              className="w-full flex items-center justify-between p-4 border border-red-200 rounded-lg hover:bg-red-50 text-red-600 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <LogOutIcon size={20} />
                <span>Logout</span>
              </div>
              {logoutMutation.isPending ? (
                <div className="loading-spinner" />
              ) : (
                <ChevronRight className="text-red-300" size={16} />
              )}
            </button>
          </div>
        </div>
      </div>

      <MobileNavigation />
    </div>
  );
}
