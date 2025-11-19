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
        created_at
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

  return rows.map((row: PropertyRow): MapProperty => ({
    id: row.property_id,
    title: trimText(row.property_title || "Untitled Property", 140) || "Untitled Property",
    propertyType: row.property_type,
    transactionType: row.transaction_type || row.listing_type,
    price: row.sale_price,
    location: trimText(row.location || row.full_address) || "Location not specified",
    fullAddress: trimText(row.full_address, 180),
    buildingSociety: trimText(row.building_society, 70) || null,
    owner: {
      name: trimText(row.owner_name, 80) || null,
      phone: row.owner_phone,
      agencyName: null,
      profilePhotoUrl: null,
    },
    lat: row.latitude,
    lng: row.longitude,
    createdAt: row.created_at,
    description: trimText(row.description, 160),
    details: null,
    listingSource: "property",
  }));
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
    title: trimText(row.project_name || "Primary Listing", 120) || "Primary Listing",
    propertyType: "primary",
    transactionType: "primary",
    price: trimText(row.details || row.project_description || "Contact for details", 120),
    location: trimText(row.site_address, 180) || "Location not specified",
    fullAddress: trimText(row.site_address, 180),
    description: trimText(row.project_description, 160),
    details: trimText(row.details, 140),
    owner: {
      name: trimText(row.promoter, 80) || "Promoter",
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
