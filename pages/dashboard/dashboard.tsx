// app/dashboard/page.tsx
"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
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
  Users,
  Target,
  CheckCircle,
  AlertCircle,
  XCircle,
} from "lucide-react";
import MobileNavigation from "@/components/layout/mobile-navigation";
import { useAuth } from "@/hooks/use-auth";
import { formatPrice } from "@/utils/formatters";

export default function Dashboard() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/");
    }
  }, [authLoading, user, router]);

  const { data: myProperties = [], isLoading: propertiesLoading } = useQuery({
    queryKey: ["/api/my-properties"],
  });

  const { data: myRequirements = [], isLoading: requirementsLoading } = useQuery({
    queryKey: ["/api/my-requirements"],
  });

  const { data: allProperties = [], isLoading: allPropertiesLoading } = useQuery({
    queryKey: ["/api/properties"],
  });

  const { data: coListingRequests = [], isLoading: coListingLoading } = useQuery({
    queryKey: ["/api/colisting-requests"],
  });

  const quickActions = [
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
  ];

  const getStatusBadge = (status: string | undefined) => {
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

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return "Today";
    if (diffInDays === 1) return "Yesterday";
    if (diffInDays < 7) return `${diffInDays} days ago`;
    return date.toLocaleDateString();
  };

  const propertyArray = Array.isArray(myProperties) ? myProperties : [];
  const coListingArray = Array.isArray(coListingRequests) ? coListingRequests : [];
  const requirementsArray = Array.isArray(myRequirements) ? myRequirements : [];
  const allPropertiesArray = Array.isArray(allProperties) ? allProperties : [];

  const recentActivities = useMemo(() => {
    const props = propertyArray.slice(0, 3).map((property: any) => ({
      id: `property-${property.id}`,
      type: "property",
      title: `Property "${property.title}" listed`,
      description: `${property.location} • ${property.price}`,
      time: property.createdAt,
      status: property.ownerApprovalStatus,
      icon: Building2,
    }));

    const colist = coListingArray.slice(0, 2).map((request: any) => ({
      id: `colisting-${request.id}`,
      type: "colisting",
      title: "Co-listing request received",
      description: `For "${request.property?.title || "Property"}"`,
      time: request.createdAt,
      status: request.status,
      icon: Users,
    }));

    // Sort by createdAt (newest first) and slice top 5
    return [...props, ...colist]
      .sort((a, b) => {
        const ta = a.time ? new Date(a.time).getTime() : 0;
        const tb = b.time ? new Date(b.time).getTime() : 0;
        return tb - ta;
      })
      .slice(0, 5);
  }, [propertyArray, coListingArray]);

  const stats = {
    totalListings: propertyArray.length,
    approvedListings: propertyArray.filter((p: any) => p.ownerApprovalStatus === "approved").length,
    pendingListings: propertyArray.filter((p: any) => p.ownerApprovalStatus === "pending").length,
    totalRequirements: requirementsArray.length,
    networkProperties: allPropertiesArray.length,
  };

  // Loading state: mimic original behaviour
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
          <div
            className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center cursor-pointer hover:bg-primary/20 transition-colors"
            onClick={() => router.push("/profile")}
          >
            <span className="text-primary font-semibold">
              {user?.name?.charAt(0) || user?.phone?.charAt(0) || "U"}
            </span>
          </div>
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
          {quickActions.map((action) => (
            <Card
              key={action.path}
              className="p-4 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => router.push(action.path)}
            >
              <div className="flex items-start space-x-3">
                <div className={`w-10 h-10 ${action.color} rounded-lg flex items-center justify-center`}>
                  <action.icon className="text-white" size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className={`font-medium ${action.textColor} text-sm`}>{action.title}</h3>
                  <p className="text-xs text-neutral-500 mt-1">{action.description}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Recent Activities */}
      <div className="px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-neutral-900">Recent Activities</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/my-listings")}
          >
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
            {recentActivities.map((activity) => (
              <Card key={activity.id} className="p-4">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-neutral-100 rounded-full flex items-center justify-center">
                    <activity.icon className="text-neutral-600" size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-neutral-900 text-sm">{activity.title}</p>
                        <p className="text-neutral-600 text-xs mt-1">{activity.description}</p>
                      </div>
                      <div className="flex items-center space-x-2 ml-2">
                        {activity.status && getStatusBadge(activity.status)}
                      </div>
                    </div>
                    <div className="flex items-center text-xs text-neutral-500 mt-2">
                      <Clock size={12} className="mr-1" />
                      {formatDate(activity.time)}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Bottom spacing for navigation */}
      <div className="h-20"></div>

      <MobileNavigation />
    </div>
  );
}
