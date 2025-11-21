/**
 * Format price based on transaction type and rent frequency
 */
export function formatPrice(
  price: number,
  transactionType?: string,
  rentFrequency?: string
): string {
  if (!price) return "N/A";

  const formattedPrice = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);

  if (transactionType === "rent" && rentFrequency) {
    return `${formattedPrice}/${rentFrequency}`;
  }

  return formattedPrice;
}

/**
 * Format area with unit
 */
export function formatArea(
  area: number | string,
  unit: string = "sq ft"
): string {
  if (!area) return "N/A";

  const numArea = typeof area === "string" ? parseFloat(area) : area;
  return `${numArea.toLocaleString("en-IN")} ${unit}`;
}

export function parsePriceToNumber(input: string | number | null | undefined): number {
  if (input == null) return 0;
  if (typeof input === "number") return input;
  const raw = String(input).toLowerCase().trim();
  if (!raw) return 0;

  const digitsOnly = raw.replace(/[, ]+/g, "");
  if (/^[\d.]+$/.test(digitsOnly)) {
    return Number(digitsOnly) || 0;
  }

  const numMatch = raw.match(/[\d,.]*\.?\d+/);
  const parsed = numMatch ? parseFloat(numMatch[0].replace(/,/g, "")) : NaN;
  if (Number.isNaN(parsed)) return 0;

  if (raw.includes("lakh") || raw.includes("lac")) {
    return parsed * 100000;
  }
  if (raw.includes("crore") || raw.includes("cr")) {
    return parsed * 10000000;
  }
  if (raw.endsWith("k")) return parsed * 1000;
  if (raw.endsWith("m")) return parsed * 1000000;

  return parsed;
}

export function getSafeFormattedPrice(
  rawPrice: string | number | null | undefined,
  transactionType?: string,
  rentFrequency?: string
): string {
  const numericValue = parsePriceToNumber(rawPrice);
  if (numericValue > 0) {
    return formatPrice(numericValue, transactionType, rentFrequency);
  }

  const fallback = rawPrice != null ? String(rawPrice).trim() : "";
  return fallback || "Price on request";
}

/**
 * Get badge color based on listing type
 */
export function getListingTypeBadgeColor(type?: string): string {
  const colorMap: Record<string, string> = {
    "rent": "bg-blue-100 text-blue-800",
    "sale": "bg-green-100 text-green-800",
    "buy": "bg-green-100 text-green-800",
    "sell": "bg-orange-100 text-orange-800",
    "lease": "bg-purple-100 text-purple-800",
    "primary": "bg-amber-100 text-amber-800",
    "secondary": "bg-indigo-100 text-indigo-800",
  };

  return colorMap[type?.toLowerCase() || ""] || "bg-gray-100 text-gray-800";
}

/**
 * Get readable label for listing type
 */
export function getListingTypeLabel(type?: string): string {
  const labelMap: Record<string, string> = {
    "rent": "For Rent",
    "sale": "For Sale",
    "buy": "Buy",
    "sell": "For Sale",
    "lease": "Lease",
    "primary": "Primary Listing",
    "secondary": "Secondary Listing",
  };

  return labelMap[type?.toLowerCase() || ""] || type || "Property";
}

/**
 * Format property bhk display
 */
export function formatBHK(bhk?: number): string {
  if (!bhk) return "";
  return `${bhk} BHK`;
}

/**
 * Format bathrooms display
 */
export function formatBathrooms(bathrooms?: number): string {
  if (!bathrooms) return "";
  return `${bathrooms} Bathroom${bathrooms > 1 ? "s" : ""}`;
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number = 50): string {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
}

/**
 * Format phone number
 */
export function formatPhoneNumber(phone: string): string {
  if (!phone) return "";
  // Remove all non-digits
  const cleaned = phone.replace(/\D/g, "");
  // Format as +91 XXXXX XXXXX (Indian format)
  if (cleaned.length === 10) {
    return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
  }
  return phone;
}

/**
 * Get property type icon or abbreviation
 */
export function getPropertyTypeIcon(propertyType?: string): string {
  if (!propertyType) return "P";
  return propertyType.charAt(0).toUpperCase();
}