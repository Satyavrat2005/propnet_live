import { z } from "zod";

export const insertPropertySchema = z.object({
  title: z.string().min(1, "Property title is required"),
  propertyType: z.string().min(1, "Property type is required"),
  transactionType: z.enum(["sale", "rent"]),
  price: z.string().min(1, "Price is required"),
  rentFrequency: z.enum(["monthly", "yearly"]).optional(),
  size: z.string().optional(),
  sizeUnit: z.enum(["sq.ft", "sq.m", "sq.yd", "acre"]).optional(),
  location: z.string().min(1, "Location is required"),
  fullAddress: z.string().optional(),
  flatNumber: z.string().min(1, "Flat/Unit number is required"),
  floorNumber: z.string().min(1, "Floor number is required"),
  buildingSociety: z.string().min(1, "Building/Society is required"),
  description: z.string().optional(),
  bhk: z.number().optional(),
  listingType: z.enum(["exclusive", "colisting", "shared"]),
  isPubliclyVisible: z.boolean().optional(),
  ownerName: z.string().optional(),
  ownerPhone: z.string().optional(),
  commissionTerms: z.string().optional(),
  scopeOfWork: z.array(z.string()).optional(),
});

export type InsertProperty = z.infer<typeof insertPropertySchema>;
