import { NextResponse } from "next/server";

/**
 * GET /api/my-properties
 * Returns list of properties for the authenticated user
 * For now, returns empty array (or mock data for development)
 */
export async function GET(req: Request) {
  // TODO: Implement actual database query when Supabase is configured
  // For now, return empty array so the UI can display "No listings yet"
  
  // Mock data for development (uncomment to see sample properties)
  // const mockProperties = [
  //   {
  //     id: 1,
  //     title: "Beautiful 2 BHK Apartment",
  //     propertyType: "apartment",
  //     transactionType: "sale",
  //     price: "5000000",
  //     size: "1200",
  //     sizeUnit: "sq.ft",
  //     location: "Mumbai, Maharashtra",
  //     bhk: 2,
  //     status: "active",
  //     isPubliclyVisible: true,
  //     createdAt: new Date().toISOString(),
  //   },
  // ];

  return NextResponse.json([]);
}
