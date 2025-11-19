import { unstable_cache } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import type { MapProperty } from "@/lib/types/map";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

type PropertyRow = {
  property_id: string;
  id: string | null;
  property_title: string | null;
  property_type: string | null;
  transaction_type: string | null;
  sale_price: string | null;
  area: number | string | null;
  area_unit: string | null;
  bhk: number | null;
  location: string | null;
  full_address: string | null;
  building_society: string | null;
  description: string | null;
  listing_type: string | null;
  property_photos: string[] | null;
  commission_terms: string | null;
  approval_status: string | null;
  public_property: boolean | null;
  latitude: number | null;
  longitude: number | null;
  owner_name: string | null;
  owner_phone: string | null;
  created_at: string | null;
  updated_at: string | null;
  profiles?: Array<{
    name?: string | null;
    agency_name?: string | null;
    profile_photo_url?: string | null;
    phone?: string | null;
  }> | null;
};

type PrimaryListingRow = {
  id: number;
  project_name: string | null;
  project_description: string | null;
  details: string | null;
  end_date: string | null;
  blocks: string | null;
  promoter: string | null;
  site_address: string | null;
  land_area: number | null;
  total_area_of_land: number | null;
  total_carpet_area: number | null;
};

const fetchApprovedProperties = unstable_cache(async (): Promise<MapProperty[]> => {
  const { data, error } = await supabase
    .from("properties")
    .select(`
      property_id,
      id,
      property_title,
      property_type,
      transaction_type,
      sale_price,
      area,
      area_unit,
      bhk,
      location,
      full_address,
      building_society,
      description,
      listing_type,
      commission_terms,
      approval_status,
      public_property,
      latitude,
      longitude,
      owner_name,
      owner_phone,
      created_at,
      updated_at,
      profiles(name, agency_name, profile_photo_url, phone)
    `)
    .eq("approval_status", "approved")
    .order("created_at", { ascending: false })
    .range(0, 4999);

  if (error) {
    console.error("[map-data] Failed to fetch approved properties", error);
    return [];
  }

  return (data || []).map((row: PropertyRow): MapProperty => ({
    id: row.property_id,
    title: row.property_title || "Untitled Property",
    propertyType: row.property_type,
    transactionType: row.transaction_type || row.listing_type,
    price: row.sale_price,
    location: row.location || row.full_address || "Location not specified",
    fullAddress: row.full_address,
    size: row.area,
    sizeUnit: row.area_unit,
    bhk: row.bhk,
    buildingSociety: row.building_society,
    owner: {
      name: row.owner_name || row.profiles?.[0]?.name || null,
      phone: row.owner_phone || row.profiles?.[0]?.phone || null,
      agencyName: row.profiles?.[0]?.agency_name || null,
      profilePhotoUrl: row.profiles?.[0]?.profile_photo_url || null,
    },
    lat: row.latitude,
    lng: row.longitude,
    createdAt: row.created_at,
    description: row.description,
    details: row.commission_terms,
    listingSource: "property",
  }));
}, ["map-properties"], { revalidate: 300 });

const fetchPrimaryListings = unstable_cache(async (): Promise<MapProperty[]> => {
  const { data, error } = await supabase
    .from("primarly_listing")
    .select(
      `id, project_name, project_description, details, end_date, blocks, promoter, site_address, land_area, total_area_of_land, total_carpet_area`
    )
    .order("end_date", { ascending: true })
    .range(0, 4999);

  if (error) {
    console.error("[map-data] Failed to fetch primary listings", error);
    return [];
  }

  return (data || []).map((row: PrimaryListingRow): MapProperty => ({
    id: `primary-${row.id}`,
    title: row.project_name || "Primary Listing",
    propertyType: "primary",
    transactionType: "primary",
    price: row.details || row.project_description || "Contact for details",
    location: row.site_address || "Location not specified",
    fullAddress: row.site_address,
    size: row.total_carpet_area,
    sizeUnit: row.total_carpet_area ? "sq.ft" : null,
    bhk: null,
    buildingSociety: row.project_name || row.site_address || null,
    owner: {
      name: row.promoter || "Promoter",
      phone: null,
    },
    lat: null,
    lng: null,
    description: row.project_description,
    promoter: row.promoter,
    details: row.details,
    blocks: row.blocks,
    landArea: row.land_area,
    totalAreaOfLand: row.total_area_of_land,
    totalCarpetArea: row.total_carpet_area,
    listingSource: "primary",
  }));
}, ["map-primary"], { revalidate: 300 });

export async function getMapPageData() {
  const [properties, primary] = await Promise.all([fetchApprovedProperties(), fetchPrimaryListings()]);
  return { properties, primary };
}
