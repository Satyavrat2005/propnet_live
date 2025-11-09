import { NextResponse } from "next/server";

export async function GET(req: Request) {
  // TODO: Implement actual database query when Supabase is configured
  // For now, return empty array so the UI can display "No co-listing requests yet"
  
  // Mock data structure for future testing:
  // const mockColistingRequests = [
  //   {
  //     id: 1,
  //     propertyId: 1,
  //     requesterId: 2,
  //     status: "pending",
  //     commissionSplit: 50,
  //     message: "Interested in co-listing this property",
  //     createdAt: new Date().toISOString(),
  //     property: {
  //       title: "Luxury 3BHK Apartment",
  //       location: "Bandra West, Mumbai",
  //       price: 12500000,
  //     },
  //     requester: {
  //       name: "John Doe",
  //       agencyName: "ABC Realty",
  //       phone: "+919876543210",
  //     },
  //   },
  // ];
  
  return NextResponse.json([]);
}
