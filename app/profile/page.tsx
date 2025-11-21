// app/profile/page.tsx
"use client";

import React, { ReactNode, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  User as UserIcon,
  Home as HomeIcon,
  Handshake,
  Settings as SettingsIcon,
  LogOut as LogOutIcon,
  ChevronRight,
  Award,
  Phone,
  Mail,
  MapPin,
  Building2,
  Calendar,
} from "lucide-react";
import MobileNavigation from "@/components/layout/mobile-navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

type ProfileRow = {
  id: string;
  phone?: string;
  name?: string;
  email?: string;
  bio?: string;
  agencyName?: string;
  agency_name?: string;
  reraId?: string;
  rera_id?: string;
  city?: string;
  experience?: string;
  website?: string;
  areaOfExpertise?: string[] | null;
  area_of_expertise?: string[] | null;
  workingRegions?: string[] | null;
  working_regions?: string[] | null;
  profilePhoto?: string | null;
  profile_photo_url?: string | null;
  status?: string;
};

type PropertySummary = {
  id: string;
  title?: string;
  location?: string;
  transactionType?: string;
  propertyType?: string;
  approvalStatus?: string;
  createdAt?: string;
  price?: number | string | null;
  owner_name?: string | null;
  owner_phone?: string | null;
  ownerName?: string | null;
  ownerPhone?: string | null;
  ownerApprovalStatus?: string | null;
};

type CoListingRequest = {
  id: string;
  status?: string;
  createdAt?: string;
  property?: { title?: string; location?: string };
  requester?: { name?: string; agencyName?: string };
};

type NormalizedProfile = {
  id: string;
  name: string;
  email: string;
  phone: string;
  agencyName: string;
  city: string;
  bio: string;
  experience: string;
  reraId: string;
  website: string;
  status: string;
  profilePhotoUrl: string | null;
  areaOfExpertise: string[];
  workingRegions: string[];
};

const fetchJson = async <T,>(url: string): Promise<T> => {
  const response = await fetch(url, { credentials: "include" });
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  return response.json();
};

export default function ProfilePage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, isLoading: authLoading, logout: authLogout } = useAuth();

  const normalizedProfile = useMemo<NormalizedProfile | null>(() => {
    if (!user) return null;
    const data = user as unknown as ProfileRow & { status?: string };
    const expertiseRaw = data.areaOfExpertise ?? data.area_of_expertise ?? [];
    const regionsRaw = data.workingRegions ?? data.working_regions ?? [];
    return {
      id: String(data.id ?? ""),
      name: data.name ?? "Agent",
      email: data.email ?? "",
      phone: data.phone ?? "",
      agencyName: data.agencyName ?? data.agency_name ?? "",
      city: data.city ?? "",
      bio: data.bio ?? "",
      experience: data.experience ?? "",
      reraId: data.reraId ?? data.rera_id ?? "",
      website: data.website ?? "",
      status: data.status ?? "pending",
      profilePhotoUrl: data.profilePhoto ?? data.profile_photo_url ?? null,
      areaOfExpertise: Array.isArray(expertiseRaw)
        ? expertiseRaw.filter(Boolean)
        : String(expertiseRaw || "")
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
      workingRegions: Array.isArray(regionsRaw)
        ? regionsRaw.filter(Boolean)
        : String(regionsRaw || "")
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
    };
  }, [user]);

  const {
    data: properties = [],
    isFetching: isPropertiesLoading,
  } = useQuery<PropertySummary[]>({
    queryKey: ["profile", "properties"],
    enabled: !!normalizedProfile,
    queryFn: () => fetchJson<PropertySummary[]>("/api/my-properties"),
  });

  const {
    data: colistingRequests = [],
    isFetching: isRequestsLoading,
  } = useQuery<CoListingRequest[]>({
    queryKey: ["profile", "colisting-requests"],
    enabled: !!normalizedProfile,
    queryFn: () => fetchJson<CoListingRequest[]>("/api/colisting-requests"),
  });

  const pendingRequests = useMemo(
    () => colistingRequests.filter((r) => (r.status || "").toLowerCase() === "pending").length,
    [colistingRequests]
  );

  const owners = useMemo(() => {
    const seen = new Map<string, string>();
    properties.forEach((p) => {
      const phone = (p.ownerPhone || p.owner_phone || "").toString().trim();
      const name = (p.ownerName || p.owner_name || "").toString().trim();
      if (!phone && !name) return;
      const key = `${phone}-${name}`;
      if (seen.has(key)) return;
      seen.set(key, name || phone || "Unknown");
    });
    return { count: seen.size, names: Array.from(seen.values()) };
  }, [properties]);

  const pendingListings = useMemo(
    () => properties.filter((p) => (p.ownerApprovalStatus || "").toLowerCase() === "pending").length,
    [properties]
  );

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      authLogout();
      router.push("/");
    } catch {
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
      label: "Properties",
      action: () => router.push("/my-listings"),
    },
   
    {
      icon: UserIcon,
      label: "Edit Profile",
      action: () => router.push("/edit-profile"),
    },
  ];

  if (authLoading || (normalizedProfile && (isPropertiesLoading || isRequestsLoading))) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!normalizedProfile) {
    return (
      <div className="min-h-screen bg-neutral-50 flex flex-col items-center justify-center px-6 text-center">
        <h2 className="text-2xl font-semibold text-neutral-900 mb-2">Sign in to view your profile</h2>
        <p className="text-neutral-500 mb-6">Your conversations, listings, and co-listing requests will appear here once you log in.</p>
        <Button onClick={() => router.push("/auth/login")}>Go to login</Button>
      </div>
    );
  }

  const topProperties = properties.slice(0, 3);
  const topRequests = colistingRequests.slice(0, 3);

  return (
    <div className="flex flex-col min-h-screen pb-20">
      <div className="sticky top-0 bg-white border-b border-neutral-100 z-10">
        <div className="flex items-center px-6 py-4">
          <button className="text-primary mr-4" onClick={() => router.push("/dashboard")}>
            <ArrowLeft size={24} />
          </button>
          <h2 className="text-lg font-semibold text-neutral-900">Profile</h2>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <div className="px-6 py-6 space-y-6">
          <ProfileHeaderCard profile={normalizedProfile} pendingListings={pendingListings} ownersCount={owners.count} ownerNames={owners.names} listings={properties.length} />

          <SectionCard
            title="Your Listings"
            description="Recently added properties"
            actionLabel="View all"
            onAction={() => router.push("/my-listings")}
          >
            <PropertiesPreview properties={topProperties} isLoading={isPropertiesLoading} />
          </SectionCard>

          {/* <SectionCard
            title="Co-listing Requests"
            description="Latest activity from your network"
            actionLabel="View requests"
            onAction={() => router.push("/colisting-requests")}
          >
            <RequestsPreview requests={topRequests} isLoading={isRequestsLoading} />
          </SectionCard> */}

          <SectionCard title="Professional Highlights" description="Expertise shared with potential partners">
            <ProfessionalDetails profile={normalizedProfile} />
          </SectionCard>

          <SectionCard title="Contact" description="Keep your contact details up to date">
            <ContactDetails profile={normalizedProfile} />
          </SectionCard>

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
                {/* <div className="flex items-center space-x-2">
                  {item.badge && <Badge variant="secondary" className="text-xs">{item.badge}</Badge>}
                  <ChevronRight size={16} />
                </div> */}
              </button>
            ))}

            <button
              onClick={logout}
              className="w-full flex items-center justify-between p-4 border-2 border-red-500 bg-red-500 hover:bg-red-600 hover:border-red-600 rounded-lg text-white transition-all duration-200"
            >
              <div className="flex items-center space-x-3">
                <LogOutIcon size={20} />
                <span>Logout</span>
              </div>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      <MobileNavigation />
    </div>
  );
}

type SectionCardProps = {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  children: ReactNode;
};

function SectionCard({ title, description, actionLabel, onAction, children }: SectionCardProps) {
  return (
    <div className="bg-white border border-neutral-200 rounded-2xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold text-neutral-900">{title}</h3>
          {description && <p className="text-sm text-neutral-500">{description}</p>}
        </div>
        {actionLabel && onAction && (
          <Button variant="outline" size="sm" onClick={onAction}>
            {actionLabel}
          </Button>
        )}
      </div>
      {children}
    </div>
  );
}

function ProfileHeaderCard({
  profile,
  pendingListings,
  ownersCount,
  ownerNames,
  listings,
}: {
  profile: NormalizedProfile;
  pendingListings: number;
  ownersCount: number;
  ownerNames: string[];
  listings: number;
}) {
  return (
    <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm">
      <div className="text-center mb-6">
        <div className="w-24 h-24 bg-neutral-200 rounded-full mx-auto mb-4 flex items-center justify-center overflow-hidden">
          {profile.profilePhotoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.profilePhotoUrl} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <span className="text-2xl font-bold text-neutral-600">{profile.agencyName?.charAt(0) || profile.name?.charAt(0) || "A"}</span>
          )}
        </div>
        <h3 className="text-xl font-bold text-neutral-900">{profile.name}</h3>
        <p className="text-neutral-500">{profile.agencyName || "Real Estate Agent"}</p>
        {profile.email && <p className="text-sm text-neutral-400">{profile.email}</p>}
        {profile.city && <p className="text-sm text-neutral-400">{profile.city}</p>}
        {/* <div className="flex flex-wrap items-center justify-center gap-2 mt-3">
          <Badge className="bg-accent text-white">
            <Award size={12} className="mr-1" />
            {profile.status === "approved" ? "Verified Agent" : "Pending Verification"}
          </Badge>
          {profile.experience && (
            <Badge variant="secondary">
              {profile.experience}
            </Badge>
          )}
        </div> */}
      </div>
      <div className="grid grid-cols-3 gap-3">
        <StatPill label="Listings" value={listings} accent="text-primary" />
        <StatPill label="Pending" value={pendingListings} accent="text-accent" />
        <StatPill label="Owners" value={ownersCount} accent="text-neutral-700" />
      </div>
    </div>
  );
}

function StatPill({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div className="text-center p-3 bg-neutral-50 rounded-xl">
      <div className={`text-2xl font-bold ${accent}`}>{value}</div>
      <p className="text-xs text-neutral-500">{label}</p>
    </div>
  );
}

function PropertiesPreview({ properties, isLoading }: { properties: PropertySummary[]; isLoading: boolean }) {
  if (isLoading) {
    return <p className="text-sm text-neutral-500">Loading properties…</p>;
  }
  if (!properties.length) {
    return <p className="text-sm text-neutral-500">No properties yet. Add a listing to showcase your work.</p>;
  }
  return (
    <div className="space-y-3">
      {properties.map((property) => (
        <div key={property.id} className="border border-neutral-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-sm font-semibold text-neutral-900">{property.title || "Untitled property"}</p>
              <p className="text-xs text-neutral-500 flex items-center gap-1">
                <MapPin size={12} />
                {property.location || "Location TBD"}
              </p>
            </div>
            <Badge variant="secondary" className="text-xs capitalize">
              {property.transactionType || "NA"}
            </Badge>
          </div>
          <p className="text-xs text-neutral-500 flex items-center gap-1">
            <Calendar size={12} />
            Listed {property.createdAt ? new Date(property.createdAt).toLocaleDateString() : "recently"}
          </p>
        </div>
      ))}
    </div>
  );
}

function RequestsPreview({ requests, isLoading }: { requests: CoListingRequest[]; isLoading: boolean }) {
  if (isLoading) {
    return <p className="text-sm text-neutral-500">Loading requests…</p>;
  }
  if (!requests.length) {
    return <p className="text-sm text-neutral-500">No co-listing requests yet.</p>;
  }
  return (
    <div className="space-y-3">
      {requests.map((request) => (
        <div key={request.id} className="border border-neutral-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm font-semibold text-neutral-900">{request.requester?.name || "Network partner"}</p>
            <Badge variant="secondary" className="text-xs capitalize">
              {request.status || "pending"}
            </Badge>
          </div>
          <p className="text-xs text-neutral-500">{request.requester?.agencyName || "Agency"}</p>
          <p className="text-xs text-neutral-500 mt-1">
            {request.property?.title || "Property"} · {request.property?.location || "TBD"}
          </p>
        </div>
      ))}
    </div>
  );
}

function ProfessionalDetails({ profile }: { profile: NormalizedProfile }) {
  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-sm font-semibold text-neutral-800 mb-2">Areas of Expertise</h4>
        {profile.areaOfExpertise?.length ? (
          <div className="flex flex-wrap gap-2">
            {profile.areaOfExpertise.map((item: string) => (
              <Badge key={item} variant="secondary" className="text-xs capitalize">
                {item}
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-sm text-neutral-500">Add areas of expertise from the edit profile screen.</p>
        )}
      </div>
      <div>
        <h4 className="text-sm font-semibold text-neutral-800 mb-2">Working Regions</h4>
        {profile.workingRegions?.length ? (
          <div className="flex flex-wrap gap-2">
            {profile.workingRegions.map((region: string) => (
              <Badge key={region} variant="outline" className="text-xs">
                {region}
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-sm text-neutral-500">Add the cities or neighborhoods you cover.</p>
        )}
      </div>
      {profile.bio && (
        <div>
          <h4 className="text-sm font-semibold text-neutral-800 mb-2">About</h4>
          <p className="text-sm text-neutral-600 leading-relaxed">{profile.bio}</p>
        </div>
      )}
    </div>
  );
}

function ContactDetails({ profile }: { profile: NormalizedProfile }) {
  const rows = [
    { icon: Phone, label: "Phone", value: profile.phone },
    { icon: Mail, label: "Email", value: profile.email },
    { icon: Building2, label: "Agency", value: profile.agencyName },
    { icon: MapPin, label: "City", value: profile.city },
  ].filter((row) => !!row.value);

  if (!rows.length) {
    return <p className="text-sm text-neutral-500">Add your contact information to make it easier for brokers to reach you.</p>;
  }

  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <div key={row.label} className="flex items-center gap-3 text-sm">
          <row.icon size={16} className="text-neutral-500" />
          <div>
            <p className="text-neutral-500 text-xs">{row.label}</p>
            <p className="text-neutral-900 font-medium">{row.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
