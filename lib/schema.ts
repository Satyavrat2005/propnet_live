import { z } from "zod";

export const insertPropertySchema = z.object({
  title: z.string().min(1, "Property title is required"),
  propertyType: z.string().min(1, "Property type is required"),
  transactionType: z.enum(["sale", "rent"]),
  price: z.string().min(1, "Price is required"),
  rentFrequency: z.enum(["monthly", "yearly"]).optional(),
  size: z.string().optional(),
  sizeUnit: z.enum(["sq.ft", "sq.m", "sq.yd", "acre"]).optional(),
  location: z.string().optional(),
  fullAddress: z.string().min(1, "Full address is required"),
  flatNumber: z.string().optional(),
  floorNumber: z.string().optional(),
  buildingSociety: z.string().optional(),
  description: z.string().optional(),
  bhk: z.number().optional(),
  listingType: z.enum(["exclusive", "colisting", "shared"]),
  isPubliclyVisible: z.boolean().optional(),
  ownerName: z.string().min(1, "Owner name is required"),
  ownerPhone: z.string().min(1, "Owner phone is required"),
  commissionTerms: z.string().optional(),
  scopeOfWork: z.array(z.string()).optional(),
});

export type InsertProperty = z.infer<typeof insertPropertySchema>;
