// app/profile/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { ArrowLeft, User as UserIcon, Home as HomeIcon, Handshake, Settings as SettingsIcon, LogOut as LogOutIcon, ChevronRight, Award } from "lucide-react";
import MobileNavigation from "@/components/layout/mobile-navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

/**
 * NOTE: requires NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in env.
 */
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type ProfileRow = {
  id: string;
  phone?: string;
  name?: string;
  email?: string;
  bio?: string;
  agency_name?: string;
  rera_id?: string;
  city?: string;
  experience?: string;
  website?: string;
  area_of_expertise?: string[] | null;
  working_regions?: string[] | null;
  profile_photo_url?: string | null;
  created_at?: string;
  updated_at?: string;
  status?: string;
};

export default function ProfilePage() {
  const router = useRouter();
  const { toast } = useToast();

  const [sessionLoaded, setSessionLoaded] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [myProperties, setMyProperties] = useState<any[]>([]);
  const [colistingRequests, setCoListingRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // load session and profile
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.access_token) {
          // not signed in
          setUserId(null);
          setProfile(null);
          setSessionLoaded(true);
          setLoading(false);
          return;
        }
        const userId = session.user.id;
        if (!mounted) return;
        setUserId(userId);

        // fetch profile row
        const { data: profData, error: profErr } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .limit(1)
          .single();

        if (profErr && profErr.code !== "PGRST116") {
          console.error("profile fetch error:", profErr);
        }
        if (mounted) setProfile(profData ?? null);

        // fetch my-properties (properties table referencing profiles.id)
        const { data: propsData, error: propsErr } = await supabase
          .from("properties")
          .select("*")
          .eq("id", userId);

        if (propsErr) console.error("my properties error", propsErr);
        if (mounted) setMyProperties(propsData ?? []);

        // fetch co-listing requests if you have a table; fallback to empty
        // If you use a different table name, change it accordingly.
        const { data: coData } = await supabase
          .from("colisting_requests")
          .select("*")
          .eq("agent_id", userId);
        if (mounted) setCoListingRequests(coData ?? []);
      } catch (err) {
        console.error(err);
      } finally {
        if (mounted) {
          setSessionLoaded(true);
          setLoading(false);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const pendingRequests = colistingRequests.filter((r) => r.status === "pending").length;

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      // clear local app state
      setUserId(null);
      setProfile(null);
      router.replace("/");
    } catch (err) {
      toast({
        title: "Logout failed",
        description: "Unable to logout, try again.",
        variant: "destructive",
      });
    }
  };

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
      <div className="sticky top-0 bg-white border-b border-neutral-100 z-10">
        <div className="flex items-center px-6 py-4">
          <button className="text-primary mr-4" onClick={() => router.push("/feed")}>
            <ArrowLeft size={24} />
          </button>
          <h2 className="text-lg font-semibold text-neutral-900">Profile</h2>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <div className="px-6 py-6">
          <div className="text-center mb-8">
            <div className="w-24 h-24 bg-neutral-200 rounded-full mx-auto mb-4 flex items-center justify-center relative">
              {profile?.profile_photo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.profile_photo_url}
                  alt="Profile Photo"
                  className="w-full h-full rounded-full object-cover"
                />
              ) : profile?.agency_name ? (
                <span className="text-2xl font-bold text-neutral-500">
                  {profile?.agency_name?.charAt(0) ?? "A"}
                </span>
              ) : (
                <span className="text-2xl font-bold text-neutral-500">
                  {profile?.name?.charAt(0) ?? "A"}
                </span>
              )}
            </div>

            <h3 className="text-xl font-bold text-neutral-900">{profile?.name ?? "Agent"}</h3>
            <p className="text-neutral-500">{profile?.agency_name ?? "Real Estate Agent"}</p>
            {profile?.email && <p className="text-sm text-neutral-400">{profile.email}</p>}
            {profile?.city && <p className="text-sm text-neutral-400">{profile.city}</p>}

            <div className="flex flex-wrap items-center justify-center gap-2 mt-3">
              <Badge className="bg-accent text-white">
                <Award size={12} className="mr-1" />
                {profile?.status === "approved" ? "Verified Agent" : "Pending Verification"}
              </Badge>
              {profile?.experience && <Badge variant="secondary">{profile.experience}+ years</Badge>}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="text-center p-4 bg-neutral-50 rounded-lg">
              <div className="text-2xl font-bold text-primary">{myProperties?.length ?? 0}</div>
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
                  {item.badge && <Badge variant="secondary" className="text-xs">{item.badge}</Badge>}
                  <ChevronRight size={16} />
                </div>
              </button>
            ))}

            <button
              onClick={logout}
              className="w-full flex items-center justify-between p-4 border border-red-200 rounded-lg hover:bg-red-50 text-red-600 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <LogOutIcon size={20} />
                <span>Logout</span>
              </div>
              <ChevronRight className="text-red-300" size={16} />
            </button>
          </div>
        </div>
      </div>

      <MobileNavigation />
    </div>
  );
}
