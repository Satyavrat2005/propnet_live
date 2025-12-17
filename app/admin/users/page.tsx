// app/admin/users/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  ArrowLeft, 
  Users as UsersIcon, 
  Search, 
  Mail, 
  Phone, 
  Building2, 
  MapPin, 
  Calendar,
  CheckCircle,
  Clock,
  Award
} from "lucide-react";
import { CubeLoader } from "@/components/ui/cube-loader";

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
  profile_complete: boolean;
  created_at: string;
  updated_at: string;
  status: string | null;
};

export default function AdminUsers() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

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

  const { data: users, isLoading } = useQuery<Profile[]>({
    queryKey: ["/api/admin/users"],
    queryFn: async () => {
      const res = await fetch("/api/admin/users", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch users");
      return res.json();
    },
    retry: false,
    enabled: !!adminData,
  });

  // Filter users based on search query
  const filteredUsers = users?.filter((user) => {
    const query = searchQuery.toLowerCase();
    return (
      user.name?.toLowerCase().includes(query) ||
      user.email?.toLowerCase().includes(query) ||
      user.phone?.includes(query) ||
      user.agency_name?.toLowerCase().includes(query) ||
      user.city?.toLowerCase().includes(query) ||
      user.rera_id?.toLowerCase().includes(query)
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
        <CubeLoader message="Loading users..." />
      </div>
    );
  }

  const list = filteredUsers || [];
  const totalUsers = users?.length || 0;
  const completeProfiles = users?.filter((u) => u.profile_complete).length || 0;
  const verifiedUsers = users?.filter((u) => u.status === "approved").length || 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4 py-4 md:py-6">
          <div className="space-y-4 md:space-y-0">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Registered Users</h1>
              <p className="text-sm md:text-base text-gray-600 mt-1">View and manage all users registered on the platform</p>
            </div>
            <Button
              onClick={() => router.push("/admin/dashboard")}
              variant="outline"
              className="w-full sm:w-auto border-emerald-600 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-600"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 md:py-8">
        {/* Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
          <Card className="bg-linear-to-br from-blue-500 to-blue-600 border-0 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-4xl md:text-3xl font-bold mb-1">{totalUsers}</p>
                  <p className="text-sm text-blue-100">Total Users</p>
                </div>
                <div className="p-3 bg-white/20 rounded-lg shrink-0">
                  <UsersIcon className="h-7 w-7 md:h-6 md:w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-linear-to-br from-green-500 to-green-600 border-0 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-4xl md:text-3xl font-bold mb-1">{completeProfiles}</p>
                  <p className="text-sm text-green-100">Complete Profiles</p>
                </div>
                <div className="p-3 bg-white/20 rounded-lg shrink-0">
                  <CheckCircle className="h-7 w-7 md:h-6 md:w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-linear-to-br from-purple-500 to-purple-600 border-0 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-4xl md:text-3xl font-bold mb-1">{verifiedUsers}</p>
                  <p className="text-sm text-purple-100">Verified Users</p>
                </div>
                <div className="p-3 bg-white/20 rounded-lg shrink-0">
                  <Award className="h-7 w-7 md:h-6 md:w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search Bar */}
        <Card className="mb-6 md:mb-8">
          <CardContent className="p-4 md:p-5">
            <div className="relative">
              <Search className="absolute left-3 md:left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                placeholder="Search by name, email, phone, agency..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 md:pl-12 py-5 md:py-3"
              />
            </div>
          </CardContent>
        </Card>

        {/* Users List */}
        {list.length === 0 ? (
          <Card>
            <CardContent className="p-8 md:p-12 text-center">
              <UsersIcon className="h-20 w-20 md:h-16 md:w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg md:text-xl font-semibold text-gray-700 mb-2">
                {searchQuery ? "No users found" : "No users registered yet"}
              </h3>
              <p className="text-sm md:text-base text-gray-500">
                {searchQuery ? "Try adjusting your search criteria" : "Users will appear here once they register"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:gap-5">
            {list.map((user) => (
              <Card key={user.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6 md:p-7">
                  <div className="flex flex-col sm:flex-row items-start gap-4">
                    {/* Profile Photo */}
                    <div className="shrink-0 mx-auto sm:mx-0">
                      {user.profile_photo_url ? (
                        <img
                          src={user.profile_photo_url}
                          alt={user.name || "User"}
                          className="w-20 h-20 md:w-16 md:h-16 rounded-full object-cover border-2 border-gray-200"
                        />
                      ) : (
                        <div className="w-20 h-20 md:w-16 md:h-16 rounded-full bg-linear-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-2xl md:text-xl font-bold">
                          {user.name?.charAt(0).toUpperCase() || "U"}
                        </div>
                      )}
                    </div>

                    {/* User Info */}
                    <div className="flex-1 min-w-0 w-full">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-2">
                            {user.name || "Unnamed User"}
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            {user.profile_complete ? (
                              <Badge className="bg-green-100 text-green-700 border-green-300">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Complete Profile
                              </Badge>
                            ) : (
                              <Badge className="bg-yellow-100 text-yellow-700 border-yellow-300">
                                <Clock className="w-3 h-3 mr-1" />
                                Incomplete Profile
                              </Badge>
                            )}
                            {user.status === "approved" && (
                              <Badge className="bg-blue-100 text-blue-700 border-blue-300">
                                <Award className="w-3 h-3 mr-1" />
                                Verified
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs shrink-0">
                          <Calendar className="w-3 h-3 mr-1" />
                          {new Date(user.created_at).toLocaleDateString()}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 mb-4">
                        {user.phone && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                            <span>{user.phone}</span>
                          </div>
                        )}
                        {user.email && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Mail className="w-4 h-4 text-gray-400 shrink-0" />
                            <span className="truncate">{user.email}</span>
                          </div>
                        )}
                        {user.agency_name && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Building2 className="w-4 h-4 text-gray-400 shrink-0" />
                            <span>{user.agency_name}</span>
                          </div>
                        )}
                        {user.city && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                            <span>{user.city}</span>
                          </div>
                        )}
                        {user.rera_id && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Award className="w-4 h-4 text-gray-400 shrink-0" />
                            <span className="font-mono text-xs">{user.rera_id}</span>
                          </div>
                        )}
                        {user.experience && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Clock className="w-4 h-4 text-gray-400 shrink-0" />
                            <span>{user.experience} experience</span>
                          </div>
                        )}
                      </div>

                      {user.bio && (
                        <p className="text-sm text-gray-600 mb-4 line-clamp-2">{user.bio}</p>
                      )}

                      {(user.area_of_expertise || user.working_regions) && (
                        <div className="flex flex-wrap gap-2">
                          {user.area_of_expertise?.map((area, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {area}
                            </Badge>
                          ))}
                          {user.working_regions?.map((region, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs bg-blue-50">
                              <MapPin className="w-3 h-3 mr-1" />
                              {region}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
