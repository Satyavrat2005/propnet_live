import { unstable_cache } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import type { MapProperty } from "@/lib/types/map";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

type PropertyRow = {
  property_id: string;
  property_title: string | null;
  property_type: string | null;
  transaction_type: string | null;
  sale_price: string | null;
  location: string | null;
  full_address: string | null;
  building_society: string | null;
  description: string | null;
  listing_type: string | null;
  latitude: number | null;
  longitude: number | null;
  owner_name: string | null;
  owner_phone: string | null;
  created_at: string | null;
  profiles?:
    | Array<{
        name?: string | null;
        agency_name?: string | null;
        profile_photo_url?: string | null;
        phone?: string | null;
        email?: string | null;
      }>
    | {
        name?: string | null;
        agency_name?: string | null;
        profile_photo_url?: string | null;
        phone?: string | null;
        email?: string | null;
      }
    | null;
};

type PrimaryListingRow = {
  id: number;
  project_name: string | null;
  project_description: string | null;
  details: string | null;
  promoter: string | null;
  site_address: string | null;
  end_date: string | null;
};

const trimText = (value?: string | null, maxLength = 160) => {
  if (!value) return null;
  return value.length <= maxLength ? value : `${value.slice(0, maxLength)}…`;
};

const TEXT_LIMITS = {
  title: 100,
  location: 120,
  fullAddress: 130,
  buildingSociety: 60,
  description: 120,
  ownerName: 60,
  primaryDetails: 100,
};

const fetchApprovedProperties = unstable_cache(async (): Promise<MapProperty[]> => {
  const PAGE_SIZE = 250;
  let offset = 0;
  const rows: PropertyRow[] = [];

  while (true) {
    const { data, error } = await supabase
      .from("properties")
      .select(`
        property_id,
        property_title,
        property_type,
        transaction_type,
        sale_price,
        location,
        full_address,
        building_society,
        description,
        listing_type,
        latitude,
        longitude,
        owner_name,
        owner_phone,
        created_at,
        profiles(name, agency_name, profile_photo_url, phone, email)
      `)
      .eq("approval_status", "approved")
      .order("created_at", { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);

    if (error) {
      console.error("[map-data] Failed to fetch approved properties", error);
      break;
    }

    if (!data || data.length === 0) {
      break;
    }

    rows.push(...data);

    if (data.length < PAGE_SIZE) {
      break;
    }

    offset += PAGE_SIZE;
  }

  return rows.map((row: PropertyRow): MapProperty => {
    const profileRecord = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;

    const broker = profileRecord
      ? {
          name: trimText(profileRecord.name, TEXT_LIMITS.ownerName) || null,
          phone: profileRecord.phone || null,
          agencyName: profileRecord.agency_name || null,
          profilePhotoUrl: profileRecord.profile_photo_url || null,
          email: profileRecord.email || null,
        }
      : null;

    return {
    id: row.property_id,
    title: trimText(row.property_title || "Untitled Property", TEXT_LIMITS.title) || "Untitled Property",
    propertyType: row.property_type,
    transactionType: row.transaction_type || row.listing_type,
    price: row.sale_price,
    location: trimText(row.location || row.full_address, TEXT_LIMITS.location) || "Location not specified",
    fullAddress: trimText(row.full_address, TEXT_LIMITS.fullAddress),
    buildingSociety: trimText(row.building_society, TEXT_LIMITS.buildingSociety) || null,
    owner: {
      name: trimText(row.owner_name, TEXT_LIMITS.ownerName) || null,
      phone: row.owner_phone,
      agencyName: null,
      profilePhotoUrl: null,
    },
      broker,
    lat: row.latitude,
    lng: row.longitude,
    createdAt: row.created_at,
    description: trimText(row.description, TEXT_LIMITS.description),
    details: null,
    listingSource: "property",
    };
  });
}, ["map-properties"], { revalidate: 300 });

const fetchPrimaryListings = unstable_cache(async (): Promise<MapProperty[]> => {
  const { data, error } = await supabase
    .from("primarly_listing")
    .select(`
      id,
      project_name,
      project_description,
      details,
      promoter,
      site_address,
      end_date
    `)
    .order("end_date", { ascending: true })
    // .range(0, 99);

  if (error) {
    console.error("[map-data] Failed to fetch primary listings", error);
    return [];
  }

  return (data || []).map((row: PrimaryListingRow): MapProperty => ({
    id: `primary-${row.id}`,
    title: trimText(row.project_name || "Primary Listing", TEXT_LIMITS.title) || "Primary Listing",
    propertyType: "primary",
    transactionType: "primary",
    price: trimText(row.details || row.project_description || "Contact for details", TEXT_LIMITS.primaryDetails),
    location: trimText(row.site_address, TEXT_LIMITS.location) || "Location not specified",
    fullAddress: trimText(row.site_address, TEXT_LIMITS.fullAddress),
    description: trimText(row.project_description, TEXT_LIMITS.description),
    details: trimText(row.details, TEXT_LIMITS.primaryDetails),
    owner: {
      name: trimText(row.promoter, TEXT_LIMITS.ownerName) || "Promoter",
      phone: null,
      agencyName: null,
      profilePhotoUrl: null,
    },
    lat: null,
    lng: null,
    promoter: trimText(row.promoter, 80) || null,
    listingSource: "primary",
  }));
}, ["map-primary"], { revalidate: 300 });

export async function getMapPageData() {
  const [properties, primary] = await Promise.all([fetchApprovedProperties(), fetchPrimaryListings()]);
  return { properties, primary };
}
