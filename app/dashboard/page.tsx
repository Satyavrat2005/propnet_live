"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/app-layout";
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
  ArrowLeft,
  TrendingDown,
  Sparkles,
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
          <Badge className="badge-success">
            <CheckCircle size={12} className="mr-1" />
            Approved
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="badge-error">
            <XCircle size={12} className="mr-1" />
            Rejected
          </Badge>
        );
      default:
        return (
          <Badge className="badge-warning">
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
      <AppLayout>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      {/* Welcome Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-1">
              Welcome back, {user?.name?.split(' ')[0] || 'there'}! 👋
            </h1>
            <p className="text-muted-foreground">Here's what's happening with your properties today</p>
          </div>
          <Button 
            onClick={() => router.push('/add-property')}
            className="bg-primary hover:bg-primary/90 text-white px-6 shadow-lg"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Property
          </Button>
        </div>
      </div>

      {/* Stats Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bento-card group cursor-pointer" onClick={() => router.push('/my-listings')}>
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Building2 className="w-6 h-6 text-primary" />
            </div>
            <Badge className="bg-primary/10 text-primary border-0">
              <TrendingUp className="w-3 h-3 mr-1" />
              Active
            </Badge>
          </div>
          <p className="text-3xl font-bold text-foreground mb-1">{stats.totalListings}</p>
          <p className="text-sm text-muted-foreground">Total Listings</p>
        </div>

        <div className="bento-card group cursor-pointer" onClick={() => router.push('/my-listings')}>
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <Badge className="bg-green-100 text-green-700 border-0">Verified</Badge>
          </div>
          <p className="text-3xl font-bold text-foreground mb-1">{stats.approvedListings}</p>
          <p className="text-sm text-muted-foreground">Approved Properties</p>
        </div>

        <div className="bento-card group cursor-pointer" onClick={() => router.push('/requirements')}>
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Target className="w-6 h-6 text-orange-600" />
            </div>
            <Badge className="bg-orange-100 text-orange-700 border-0">Active</Badge>
          </div>
          <p className="text-3xl font-bold text-foreground mb-1">{stats.totalRequirements}</p>
          <p className="text-sm text-muted-foreground">Client Requirements</p>
        </div>

        <div className="bento-card group cursor-pointer" onClick={() => router.push('/feed')}>
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <Badge className="bg-purple-100 text-purple-700 border-0">Network</Badge>
          </div>
          <p className="text-3xl font-bold text-foreground mb-1">{stats.networkProperties}</p>
          <p className="text-sm text-muted-foreground">Available Properties</p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions - 2 columns */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Quick Actions
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div 
                className="bento-card group cursor-pointer bg-linear-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20 hover:border-blue-500/40"
                onClick={() => router.push("/quickpost")}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <Zap className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-1">QuickPost</h3>
                    <p className="text-sm text-muted-foreground">AI-powered property listing</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                </div>
              </div>

              <div 
                className="bento-card group cursor-pointer bg-linear-to-br from-primary/10 to-emerald-600/5 border-primary/20 hover:border-primary/40"
                onClick={() => router.push("/add-property")}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <Plus className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-1">Add Property</h3>
                    <p className="text-sm text-muted-foreground">Create new listing manually</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </div>
              </div>

              <div 
                className="bento-card group cursor-pointer bg-linear-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20 hover:border-purple-500/40"
                onClick={() => router.push("/my-listings")}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <Building2 className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-1">My Listings</h3>
                    <p className="text-sm text-muted-foreground">Manage your properties</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-purple-600 group-hover:translate-x-1 transition-all" />
                </div>
              </div>

              <div 
                className="bento-card group cursor-pointer bg-linear-to-br from-orange-500/10 to-orange-600/5 border-orange-500/20 hover:border-orange-500/40"
                onClick={() => router.push("/requirements")}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <Target className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-1">Requirements</h3>
                    <p className="text-sm text-muted-foreground">Track client needs</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-orange-600 group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activities */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                Recent Activities
              </h2>
              <Button variant="ghost" size="sm" onClick={() => router.push("/my-listings")} className="text-primary hover:text-primary/80">
                View All
                <ArrowRight size={16} className="ml-1" />
              </Button>
            </div>

            {recentActivities.length === 0 ? (
              <div className="bento-card text-center py-12">
                <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                  <Activity className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-foreground font-medium mb-1">No recent activities</p>
                <p className="text-sm text-muted-foreground">Start by adding your first property</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentActivities.map((activity) => {
                  const Icon = activity.icon;
                  return (
                    <div key={activity.id} className="card-modern p-4 hover:border-primary/30 transition-all">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
                          <Icon className="w-5 h-5 text-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <p className="font-medium text-foreground text-sm mb-1">{activity.title}</p>
                              <p className="text-sm text-muted-foreground">{activity.description}</p>
                            </div>
                            {activity.status && (
                              <div className="shrink-0">{getStatusBadge(activity.status)}</div>
                            )}
                          </div>
                          <div className="flex items-center text-xs text-muted-foreground mt-3">
                            <Clock size={12} className="mr-1.5" />
                            {formatDate(activity.time)}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Info - 1 column */}
        <div className="space-y-6">
          {/* Pending Items */}
          {stats.pendingListings > 0 && (
            <div className="bento-card bg-linear-to-br from-yellow-500/10 to-yellow-600/5 border-yellow-500/20">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-yellow-500 rounded-xl flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-white" />
                </div>
                <Badge className="bg-yellow-100 text-yellow-700 border-0">Action Required</Badge>
              </div>
              <p className="text-2xl font-bold text-foreground mb-1">{stats.pendingListings}</p>
              <p className="text-sm text-muted-foreground mb-4">Pending Approvals</p>
              <Button 
                onClick={() => router.push('/my-listings')}
                size="sm"
                variant="outline"
                className="w-full border-yellow-500/30 hover:bg-yellow-500/10"
              >
                Review Now
              </Button>
            </div>
          )}

          {/* Network Stats */}
          <div className="bento-card">
            <h3 className="font-semibold text-foreground mb-4">Network Insights</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Available</p>
                    <p className="text-xs text-muted-foreground">In network</p>
                  </div>
                </div>
                <p className="text-lg font-bold text-foreground">{stats.networkProperties}</p>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Your Active</p>
                    <p className="text-xs text-muted-foreground">Listings</p>
                  </div>
                </div>
                <p className="text-lg font-bold text-foreground">{stats.approvedListings}</p>
              </div>

              <Button 
                onClick={() => router.push('/feed')}
                size="sm"
                className="w-full bg-primary hover:bg-primary/90 mt-2"
              >
                Browse Network
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>

          {/* Quick Links */}
          <div className="bento-card">
            <h3 className="font-semibold text-foreground mb-4">Quick Links</h3>
            <div className="space-y-2">
              {[
                { label: 'Messages', icon: MessageCircle, path: '/messages', count: 0 },
                { label: 'Map View', icon: Map, path: '/map', count: null },
                { label: 'Clients', icon: Users, path: '/clients', count: null },
                { label: 'Search', icon: Search, path: '/search', count: null },
              ].map((link) => (
                <button
                  key={link.path}
                  onClick={() => router.push(link.path)}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl hover:bg-muted transition-colors text-left group"
                >
                  <div className="flex items-center gap-3">
                    <link.icon className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    <span className="text-sm font-medium text-foreground">{link.label}</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
