export interface OwnerConsentSmsOptions {
  ownerName?: string | null;
  agentName?: string | null;
  propertyTitle?: string | null;
  location?: string | null;
  propertyType?: string | null;
  bhk?: number | null;
  size?: number | string | null;
  sizeUnit?: string | null;
  price?: string | number | null;
  listingType?: string | null;
  ownerConsentUrl?: string | null;
}

const MAX_SMS_LENGTH = 320;

const truncate = (value: string | null | undefined, max: number) => {
  if (!value) return value;
  return value.length <= max ? value : `${value.slice(0, max - 1)}…`;
};

export function buildOwnerConsentSms(options: OwnerConsentSmsOptions): string {
  const ownerFirstName = options.ownerName ? String(options.ownerName).split(" ")[0] : "Hi";
  const agentName = options.agentName || "Your agent";
  const propertyTitle = truncate(options.propertyTitle || "your property", 60) || "your property";
  const locationText = options.location ? truncate(options.location, 40) : null;
  const details = [
    options.propertyType,
    options.bhk ? `${options.bhk} BHK` : null,
    options.size ? `${options.size}${options.sizeUnit ? ` ${options.sizeUnit}` : ""}` : null,
  ]
    .filter(Boolean)
    .join(" • ");
  const truncatedDetails = truncate(details || null, 70);
  const priceSnippet = options.price ? String(options.price) : "Price on request";
  const listingTypeLabel = options.listingType || "Listing";

  const entries = [
    { key: "owner", text: `${ownerFirstName}, ${agentName} wants to list your property on PropNet.` },
    { key: "title", text: `"${propertyTitle}"${locationText ? ` at ${locationText}` : ""}` },
    { key: "details", text: truncatedDetails || null },
    { key: "price", text: `Price: ${priceSnippet}` },
    { key: "review", text: options.ownerConsentUrl ? `Review & approve: ${options.ownerConsentUrl}` : null },
    { key: "listing", text: `Listing type: ${listingTypeLabel}` },
  ].filter((entry) => entry.text) as Array<{ key: string; text: string }>;

  const assemble = () => entries.map((entry) => entry.text).join("\n");

  const shorten = () => {
    let body = assemble();
    if (body.length <= MAX_SMS_LENGTH) return body;

    const dropOrder = ["listing", "details"];
    for (const key of dropOrder) {
      const index = entries.findIndex((entry) => entry.key === key);
      if (index !== -1) {
        entries.splice(index, 1);
        body = assemble();
        if (body.length <= MAX_SMS_LENGTH) return body;
      }
    }

    const titleEntry = entries.find((entry) => entry.key === "title");
    if (titleEntry) {
      const shortenedTitle = truncate(propertyTitle, 40);
      const shortenedLocation = locationText ? truncate(locationText, 25) : null;
      titleEntry.text = `"${shortenedTitle}"${shortenedLocation ? ` at ${shortenedLocation}` : ""}`;
      body = assemble();
      if (body.length <= MAX_SMS_LENGTH) return body;
    }

    const detailsEntry = entries.find((entry) => entry.key === "details");
    if (detailsEntry) {
      detailsEntry.text = truncate(detailsEntry.text, 40) || "";
      body = assemble();
      if (body.length <= MAX_SMS_LENGTH) return body;
    }

    return `${body.slice(0, MAX_SMS_LENGTH - 1)}…`;
  };

  return shorten();
}
