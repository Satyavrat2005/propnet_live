import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("primarly_listing")
      .select(
        `id, project_name, project_description, details, end_date, blocks, promoter, site_address, land_area, total_area_of_land, total_carpet_area`
      )
      .order("end_date", { ascending: true })
      .range(0, 4999);

    if (error) {
      console.error("[GET /api/primarly-listing] Supabase error", error);
      return NextResponse.json({ message: "Failed to load primary listings" }, { status: 500 });
    }

    const mapped = (data || []).map((row: PrimaryListingRow) => ({
      id: `primary-${row.id}`,
      title: row.project_name || "Primary Listing",
      propertyType: "primary",
      transactionType: "primary",
      price: row.details || row.project_description || "Contact for details",
      location: row.site_address || "Location not specified",
      fullAddress: row.site_address || null,
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
      description: row.project_description || null,
      promoter: row.promoter || null,
      details: row.details || null,
      blocks: row.blocks || null,
      landArea: row.land_area || null,
      totalAreaOfLand: row.total_area_of_land || null,
      totalCarpetArea: row.total_carpet_area || null,
      listingSource: "primary" as const,
    }));

    return NextResponse.json(mapped, { status: 200 });
  } catch (err: any) {
    console.error("[GET /api/primarly-listing] Unexpected error", err);
    return NextResponse.json(
      { message: err?.message || "Unexpected error loading primary listings" },
      { status: 500 }
    );
  }
}
