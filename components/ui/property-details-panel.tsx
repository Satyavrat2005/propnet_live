"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Phone, MapPin } from "lucide-react";
import {
  formatArea,
  getListingTypeLabel,
  getListingTypeBadgeColor,
  getSafeFormattedPrice,
} from "@/utils/formatters";

export interface PropertyOwnerDetails {
  name?: string | null;
  phone?: string | null;
  agencyName?: string | null;
  profilePhotoUrl?: string | null;
  email?: string | null;
}

export interface PropertyDetailsData {
  id?: string;
  title?: string | null;
  propertyType?: string | null;
  transactionType?: string | null;
  price?: string | number | null;
  rentFrequency?: string | null;
  size?: number | string | null;
  sizeUnit?: string | null;
  bhk?: number | null;
  buildingSociety?: string | null;
  location?: string | null;
  fullAddress?: string | null;
  flatNumber?: string | null;
  floor?: string | null;
  description?: string | null;
  listingType?: string | null;
  promoter?: string | null;
  details?: string | null;
  landArea?: number | string | null;
  totalAreaOfLand?: number | string | null;
  totalCarpetArea?: number | string | null;
  owner?: PropertyOwnerDetails | null;
  broker?: PropertyOwnerDetails | null;
}

interface PropertyDetailsPanelProps {
  property: PropertyDetailsData;
  className?: string;
  onCall?: () => void;
  actions?: React.ReactNode;
}

export default function PropertyDetailsPanel({ property, className = "", onCall, actions }: PropertyDetailsPanelProps) {
  const safePriceInput = property.price ?? undefined;
  const transactionType = property.transactionType ?? undefined;
  const rentFrequency = property.rentFrequency ?? undefined;
  const priceLabel = getSafeFormattedPrice(safePriceInput, transactionType, rentFrequency);
  const sizeLabel = property.size ? formatArea(property.size, property.sizeUnit || "sq.ft") : "Not specified";
  const listingBadge = property.listingType ? getListingTypeLabel(property.listingType) : property.transactionType ? property.transactionType : null;
  const listingColor = property.listingType ? getListingTypeBadgeColor(property.listingType) : "bg-gray-100 text-gray-700";
  const isPrimary = (property.transactionType || "").toLowerCase() === "primary";
  const contact = property.broker || property.owner || null;
  const contactName = contact?.name || "Broker";
  const contactPhone = contact?.phone || "";

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-xl font-semibold text-neutral-900 leading-snug">
            {property.title || "Property Details"}
          </h3>
          <p className="text-xs uppercase text-muted-foreground tracking-wide">
            {property.propertyType || "Property"}
          </p>
        </div>
        <div className="flex flex-col items-end text-right space-y-1">
          {listingBadge && (
            <Badge className={`text-xs font-semibold px-3 py-1 uppercase tracking-wide ${listingColor}`}>
              {listingBadge}
            </Badge>
          )}
          {property.transactionType && (
            <span className="text-xs text-muted-foreground">{property.transactionType}</span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-xs font-medium text-muted-foreground">Price</p>
          <p className="font-semibold text-neutral-900 leading-tight">{priceLabel}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground">Size</p>
          <p className="font-semibold leading-tight">{sizeLabel}</p>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Location</p>
        <div className="flex items-start gap-2">
          <MapPin size={16} className="text-muted-foreground mt-0.5" />
          <div>
            <p className="text-sm text-neutral-900">
              {property.location || "Not specified"}
            </p>
            {property.buildingSociety && (
              <p className="text-xs text-muted-foreground">{property.buildingSociety}</p>
            )}
          </div>
        </div>
      </div>

      {property.bhk && (
        <div>
          <p className="text-xs font-medium text-muted-foreground">Configuration</p>
          <p className="text-sm text-neutral-900">{property.bhk} BHK</p>
        </div>
      )}

      {property.description && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">Description</p>
          <p className="text-sm text-neutral-700 leading-relaxed">
            {property.description}
          </p>
        </div>
      )}

      {isPrimary && (
        <div className="space-y-4">
          <div>
            <p className="text-xs font-medium text-muted-foreground">Promoter</p>
            <p className="text-sm text-neutral-900">
              {property.promoter || "Not provided"}
            </p>
          </div>
          {property.details && (
            <div>
              <p className="text-xs font-medium text-muted-foreground">Project Details</p>
              <p className="text-sm text-neutral-700 leading-relaxed">
                {property.details}
              </p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4 text-sm">
            {property.landArea && (
              <div>
                <p className="text-xs font-medium text-muted-foreground">Land Area</p>
                <p className="text-sm text-neutral-900">{property.landArea}</p>
              </div>
            )}
            {property.totalAreaOfLand && (
              <div>
                <p className="text-xs font-medium text-muted-foreground">Total Area of Land</p>
                <p className="text-sm text-neutral-900">{property.totalAreaOfLand}</p>
              </div>
            )}
            {property.totalCarpetArea && (
              <div>
                <p className="text-xs font-medium text-muted-foreground">Total Carpet Area</p>
                <p className="text-sm text-neutral-900">{property.totalCarpetArea}</p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="space-y-3">
        <p className="text-xs font-medium text-muted-foreground">Broker Details</p>
        <div className="bg-muted/50 rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-3">
            {contact?.profilePhotoUrl ? (
              <img 
                src={contact.profilePhotoUrl} 
                alt={contactName}
                className="h-12 w-12 rounded-full object-cover"
              />
            ) : (
              <div className="h-12 w-12 rounded-full bg-primary/10 text-primary font-semibold flex items-center justify-center">
                {contactName.charAt(0) || "B"}
              </div>
            )}
            <div>
              <p className="text-sm font-semibold text-neutral-900">{contactName}</p>
              <p className="text-xs text-muted-foreground">{contact?.agencyName || "Real Estate Agent"}</p>
            </div>
          </div>
          {contact?.email && (
            <div className="flex items-center gap-2 text-sm text-neutral-700">
              <span className="text-muted-foreground">✉</span>
              <span>{contact.email}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm text-neutral-700">
            <Phone size={14} className="text-muted-foreground" />
            <span>{contactPhone || "Not provided"}</span>
          </div>
        </div>
      </div>

      {actions}
    </div>
  );
}