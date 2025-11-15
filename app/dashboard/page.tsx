"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Home,
  Plus,
  Zap,
  Building2,
  FileText,
  TrendingUp,
  Eye,
  MessageCircle,
  Clock,
  ArrowRight,
  Activity,
  Star,
  Search,
  Map,
  Users,
  Target,
  CheckCircle,
  AlertCircle,
  XCircle,
} from "lucide-react";

/**
 * Dashboard page (Next.js App Router)
 * - Converted from your original component that used wouter and react-query
 * - Replaces useAuth, MobileNavigation, formatPrice with small inline implementations
 * - Keeps UI, copy, colors, layout and border colors identical
 *
 * Notes:
 * - Expects API endpoints:
 *   GET /api/auth/me
 *   GET /api/my-properties
 *   GET /api/my-requirements
 *   GET /api/properties
 *   GET /api/colisting-requests
 *
 * If any endpoints return error, empty arrays will be used and UI will still render.
 */

/* -------------------------
   Small inline utilities
   ------------------------- */

// Minimal formatPrice replacement (keeps simple formatting)
function formatPrice(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") return "-";
  const num = typeof value === "string" ? Number(value) : value;
  if (Number.isNaN(num)) return String(value);
  return num.toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

/* -------------------------
   Minimal useAuth hook
   ------------------------- */
/**
 * useAuth fetches /api/auth/me to get logged in user
 * returns { user, isLoading }
 */
function useAuth() {
  const [user, setUser] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (!mounted) return;
        if (!res.ok) {
          setUser(null);
          setIsLoading(false);
          return;
        }
        const json = await res.json();
        setUser(json?.user ?? null);
      } catch (err) {
        console.error("useAuth error:", err);
        setUser(null);
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return { user, isLoading };
}

/* -------------------------
   MobileNavigation component
   ------------------------- */
/**
 * Minimal mobile navigation bar used at bottom of the dashboard.
 * Keeps same look/feel (simple buttons and icons).
 */
function MobileNavigation() {
  const router = useRouter();

  const items = [
    { key: "home", label: "Home", path: "/dashboard", icon: Home },
    { key: "quick", label: "Feed", path: "/feed", icon: Search },
    { key: "add", label: "Map", path: "/map", icon: Map },
    { key: "listings", label: "Messages", path: "/messages" , icon: MessageCircle },
    { key: "profile", label: "Clients", path: "/clients", icon: Users },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 p-2 ">
      <div className="max-w-4xl mx-auto flex justify-between">
        {items.map((it) => {
          const Icon = it.icon;
          return (
            <button
              key={it.key}
              onClick={() => router.push(it.path)}
              className="flex flex-col items-center text-xs text-neutral-600 px-2 py-1 hover:text-neutral-900"
              aria-label={it.label}
            >
              <Icon size={18} />
              <span className="mt-1 text-[10px]">{it.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* -------------------------
   Dashboard component
   ------------------------- */

export default function Dashboard() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const dashboardAvatarSrc =
    user?.profilePhoto ??
    user?.profile_photo_url ??
    user?.profilePhotoUrl ??
    user?.photo_url ??
    user?.photoUrl ??
    user?.photo ??
    user?.avatarUrl ??
    user?.avatar ??
    null;

  // Data state (replaces react-query)
  const [myProperties, setMyProperties] = useState<any[]>([]);
  const [myRequirements, setMyRequirements] = useState<any[]>([]);
  const [allProperties, setAllProperties] = useState<any[]>([]);
  const [coListingRequests, setCoListingRequests] = useState<any[]>([]);

  const [propertiesLoading, setPropertiesLoading] = useState(true);
  const [requirementsLoading, setRequirementsLoading] = useState(true);
  const [allPropertiesLoading, setAllPropertiesLoading] = useState(true);
  const [coListingLoading, setCoListingLoading] = useState(true);

  // Fetch helper
  async function fetchJson(path: string) {
    try {
      const res = await fetch(path);
      if (!res.ok) return [];
      const json = await res.json();
      return json ?? [];
    } catch (err) {
      console.error("fetchJson error", path, err);
      return [];
    }
  }

  useEffect(() => {
    let mounted = true;

    (async () => {
      setPropertiesLoading(true);
      const data = await fetchJson("/api/my-properties");
      if (!mounted) return;
      setMyProperties(Array.isArray(data) ? data : []);
      setPropertiesLoading(false);
    })();

    (async () => {
      setRequirementsLoading(true);
      const data = await fetchJson("/api/my-requirements");
      if (!mounted) return;
      setMyRequirements(Array.isArray(data) ? data : []);
      setRequirementsLoading(false);
    })();

    (async () => {
      setAllPropertiesLoading(true);
      const data = await fetchJson("/api/properties");
      if (!mounted) return;
      setAllProperties(Array.isArray(data) ? data : []);
      setAllPropertiesLoading(false);
    })();

    (async () => {
      setCoListingLoading(true);
      const data = await fetchJson("/api/colisting-requests");
      if (!mounted) return;
      setCoListingRequests(Array.isArray(data) ? data : []);
      setCoListingLoading(false);
    })();

    return () => {
      mounted = false;
    };
  }, []);

  // If you want to redirect unauthenticated users to login, uncomment below:
  React.useEffect(() => {
    if (!authLoading && !user) {
      // no user logged in — optional redirect logic
      // router.push("/auth/login");
      console.log("No user logged in — showing public dashboard view");
    }
  }, [authLoading, user, router]);

  const propertyArray = Array.isArray(myProperties) ? myProperties : [];
  const coListingArray = Array.isArray(coListingRequests) ? coListingRequests : [];
  const requirementsArray = Array.isArray(myRequirements) ? myRequirements : [];
  const allPropertiesArray = Array.isArray(allProperties) ? allProperties : [];

  // Build recent activities (note: keep same sorting & mapping logic)
  const recentActivities = [
    ...propertyArray.slice(0, 3).map((property: any) => ({
      id: `property-${property.id}`,
      type: "property",
      title: `Property "${property.title}" listed`,
      description: `${property.location} • ${formatPrice(property.price)}`,
      time: property.createdAt ?? new Date().toISOString(),
      status: property.ownerApprovalStatus,
      icon: Building2,
    })),
    ...coListingArray.slice(0, 2).map((request: any) => ({
      id: `colisting-${request.id}`,
      type: "colisting",
      title: "Co-listing request received",
      description: `For "${request.property?.title || "Property"}"`,
      time: request.createdAt ?? new Date().toISOString(),
      status: request.status,
      icon: Users,
    })),
  ]
    .sort((a, b) => {
      const ta = new Date(a.time).getTime();
      const tb = new Date(b.time).getTime();
      return tb - ta;
    })
    .slice(0, 5);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return "Today";
    if (diffInDays === 1) return "Yesterday";
    if (diffInDays < 7) return `${diffInDays} days ago`;
    return date.toLocaleDateString();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle size={12} className="mr-1" />
            Approved
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-red-100 text-red-800">
            <XCircle size={12} className="mr-1" />
            Rejected
          </Badge>
        );
      default:
        return (
          <Badge className="bg-yellow-100 text-yellow-800">
            <AlertCircle size={12} className="mr-1" />
            Pending
          </Badge>
        );
    }
  };

  const stats = {
    totalListings: propertyArray.length,
    approvedListings: propertyArray.filter((p: any) => p.ownerApprovalStatus === "approved").length,
    pendingListings: propertyArray.filter((p: any) => p.ownerApprovalStatus === "pending").length,
    totalRequirements: requirementsArray.length,
    networkProperties: allPropertiesArray.length,
  };

  if (authLoading || propertiesLoading) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-neutral-900">Welcome back!</h1>
            <p className="text-sm text-neutral-600">{user?.name || user?.phone}</p>
          </div>
          <button
            type="button"
            className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center cursor-pointer hover:bg-primary/20 transition-colors"
            onClick={() => router.push("/profile")}
          >
            <Avatar className="h-10 w-10">
              {dashboardAvatarSrc ? (
                <AvatarImage src={dashboardAvatarSrc} alt={user?.name ?? "Profile"} />
              ) : (
                <AvatarFallback className="text-xs font-semibold text-primary">
                  {user?.name?.charAt(0) || user?.phone?.charAt(0) || "U"}
                </AvatarFallback>
              )}
            </Avatar>
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="px-6 py-4">
        <div className="grid grid-cols-2 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-neutral-900">{stats.totalListings}</p>
                <p className="text-sm text-neutral-600">Total Listings</p>
              </div>
              <Building2 className="text-blue-500" size={24} />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-neutral-900">{stats.approvedListings}</p>
                <p className="text-sm text-neutral-600">Approved</p>
              </div>
              <CheckCircle className="text-green-500" size={24} />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-neutral-900">{stats.totalRequirements}</p>
                <p className="text-sm text-neutral-600">Requirements</p>
              </div>
              <Target className="text-orange-500" size={24} />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-neutral-900">{stats.networkProperties}</p>
                <p className="text-sm text-neutral-600">Network</p>
              </div>
              <Users className="text-purple-500" size={24} />
            </div>
          </Card>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-neutral-900">Quick Actions</h2>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {[
            {
              icon: Zap,
              title: "QuickPost",
              description: "AI-powered property listing",
              path: "/quickpost",
              color: "bg-blue-500",
              textColor: "text-blue-600",
            },
            {
              icon: Plus,
              title: "Add Property",
              description: "Manual property entry",
              path: "/add-property",
              color: "bg-green-500",
              textColor: "text-green-600",
            },
            {
              icon: Building2,
              title: "My Listings",
              description: "Manage your properties",
              path: "/my-listings",
              color: "bg-purple-500",
              textColor: "text-purple-600",
            },
            {
              icon: Target,
              title: "Requirements",
              description: "Client requirements",
              path: "/requirements",
              color: "bg-orange-500",
              textColor: "text-orange-600",
            },
          ].map((action) => {
            const Icon = action.icon;
            return (
              <Card key={action.path} className="p-4 cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push(action.path)}>
                <div className="flex items-start space-x-3">
                  <div className={`w-10 h-10 ${action.color} rounded-lg flex items-center justify-center`}>
                    <Icon className="text-white" size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-medium ${action.textColor} text-sm`}>{action.title}</h3>
                    <p className="text-xs text-neutral-500 mt-1">{action.description}</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Recent Activities */}
      <div className="px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-neutral-900">Recent Activities</h2>
          <Button variant="ghost" size="sm" onClick={() => router.push("/my-listings")}>
            View All
            <ArrowRight size={14} className="ml-1" />
          </Button>
        </div>

        {recentActivities.length === 0 ? (
          <Card className="p-6 text-center">
            <Activity className="mx-auto text-neutral-400 mb-2" size={32} />
            <p className="text-neutral-600 text-sm">No recent activities</p>
            <p className="text-neutral-500 text-xs mt-1">Start by adding your first property</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {recentActivities.map((activity) => {
              const Icon = activity.icon;
              return (
                <Card key={activity.id} className="p-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-neutral-100 rounded-full flex items-center justify-center">
                      <Icon className="text-neutral-600" size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-neutral-900 text-sm">{activity.title}</p>
                          <p className="text-neutral-600 text-xs mt-1">{activity.description}</p>
                        </div>
                        <div className="flex items-center space-x-2 ml-2">{activity.status && getStatusBadge(activity.status)}</div>
                      </div>
                      <div className="flex items-center text-xs text-neutral-500 mt-2">
                        <Clock size={12} className="mr-1" />
                        {formatDate(activity.time)}
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom spacing for navigation */}
      <div className="h-20"></div>

      <MobileNavigation />
    </div>
  );
}
