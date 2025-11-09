import { NextResponse } from "next/server";

export async function GET(req: Request) {
  // TODO: Implement actual database query when Supabase is configured
  // For now, return empty array so the UI can display "No requirements yet"
  
  // Mock data structure for future testing:
  // const mockRequirements = [
  //   {
  //     id: 1,
  //     propertyType: "Apartment",
  //     budget: 5000000,
  //     location: "Bandra West, Mumbai",
  //     bedrooms: 2,
  //     status: "active",
  //     createdAt: new Date().toISOString(),
  //   },
  // ];
  
  return NextResponse.json([]);
}
