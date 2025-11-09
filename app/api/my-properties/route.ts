// app/api/my-properties/route.ts
import { NextResponse } from "next/server";
import { PROPERTIES } from "@/lib/properties-data";

// Mock: in this demo we treat ownerId=1 as the current user
export async function GET() {
  const myProps = PROPERTIES.filter(p => p.ownerId === 1);
  return NextResponse.json(myProps);
}
