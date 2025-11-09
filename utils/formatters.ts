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

/**
 * Get badge color based on listing type
 */
export function getListingTypeBadgeColor(type?: string): string {
  const colorMap: Record<string, string> = {
    "rent": "bg-blue-100 text-blue-800",
    "buy": "bg-green-100 text-green-800",
    "sell": "bg-orange-100 text-orange-800",
    "lease": "bg-purple-100 text-purple-800",
  };

  return colorMap[type?.toLowerCase() || ""] || "bg-gray-100 text-gray-800";
}

/**
 * Get readable label for listing type
 */
export function getListingTypeLabel(type?: string): string {
  const labelMap: Record<string, string> = {
    "rent": "For Rent",
    "buy": "Buy",
    "sell": "For Sale",
    "lease": "Lease",
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
