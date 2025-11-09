import { NextResponse } from "next/server";

export async function GET(req: Request) {
  // TODO: Implement actual database query when Supabase is configured
  // For now, return empty array so the UI can display "No properties yet"
  
  // Mock data structure for future testing:
  // const mockProperties = [
  //   {
  //     id: 1,
  //     title: "Luxury 3BHK Apartment",
  //     price: 12500000,
  //     location: "Bandra West, Mumbai",
  //     bedrooms: 3,
  //     bathrooms: 2,
  //     area: 1450,
  //     propertyType: "Apartment",
  //     listingType: "Sale",
  //     status: "active",
  //     images: [],
  //     agentId: 1,
  //     createdAt: new Date().toISOString(),
  //   },
  // ];
  
  return NextResponse.json([]);
}
