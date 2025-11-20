export interface MapProperty {
  id: string;
  title: string;
  propertyType: string | null;
  transactionType: string | null;
  price: string | number | null;
  location: string;
  fullAddress?: string | null;
  size?: number | string | null;
  sizeUnit?: string | null;
  bhk?: number | null;
  buildingSociety?: string | null;
  owner: {
    name: string | null;
    phone: string | null;
    agencyName?: string | null;
    profilePhotoUrl?: string | null;
  };
  broker?: {
    name: string | null;
    phone: string | null;
    agencyName?: string | null;
    profilePhotoUrl?: string | null;
    email?: string | null;
  } | null;
  lat?: number | null;
  lng?: number | null;
  createdAt?: string | null;
  description?: string | null;
  promoter?: string | null;
  details?: string | null;
  blocks?: string | null;
  landArea?: number | null;
  totalAreaOfLand?: number | null;
  totalCarpetArea?: number | string | null;
  listingSource?: "property" | "primary";
}
