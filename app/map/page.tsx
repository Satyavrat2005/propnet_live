import MapClient from "./MapClient";
import { getMapPageData } from "@/lib/server/map-data";

export const dynamic = "force-dynamic";

export default async function MapPage() {
  const { properties, primary } = await getMapPageData();
  return <MapClient initialProperties={properties} initialPrimaryListings={primary} />;
}
