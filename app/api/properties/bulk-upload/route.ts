export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import Papa from "papaparse";
import { insertPropertySchema } from "@/lib/schema";
import { verifySession } from "@/lib/auth/session";

type CsvRow = Record<string, string | null | undefined>;

interface UploadSummary {
  total: number;
  successful: number;
  failed: number;
  errors: string[];
  duplicates: Array<{ row: number; message: string }>;
  smsWarnings: Array<{ row: number; status: string; error?: string | null }>;
}

const truthy = new Set(["true", "1", "yes", "y"]);
const falsy = new Set(["false", "0", "no", "n"]);

const sizeUnitMap: Record<string, "sq.ft" | "sq.m" | "sq.yd" | "acre"> = {
  "sq.ft": "sq.ft",
  sqft: "sq.ft",
  "squarefeet": "sq.ft",
  "sq.m": "sq.m",
  sqm: "sq.m",
  "squaremeters": "sq.m",
  "sq.yd": "sq.yd",
  sqyd: "sq.yd",
  "squareyards": "sq.yd",
  acre: "acre",
  acres: "acre",
};

const listingTypeMap: Record<string, "exclusive" | "colisting" | "shared"> = {
  exclusive: "exclusive",
  "co-listing": "colisting",
  colisting: "colisting",
  "co listing": "colisting",
  "co_listed": "colisting",
  shared: "shared",
  open: "shared",
  "open market": "shared",
};

const rentFrequencyMap: Record<string, "monthly" | "yearly"> = {
  monthly: "monthly",
  month: "monthly",
  yearly: "yearly",
  annual: "yearly",
};

type CreatePropertyResult = {
  ok: boolean;
  status: number;
  message: string;
  payload?: Record<string, unknown> | null;
};

function getCell(row: CsvRow, ...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = row[key];
    if (value != null && String(value).trim().length > 0) {
      return String(value).trim();
    }
  }
  return undefined;
}

function parseBooleanCell(value?: string | null): boolean | undefined {
  if (!value) return undefined;
  const normalized = value.trim().toLowerCase();
  if (truthy.has(normalized)) return true;
  if (falsy.has(normalized)) return false;
  return undefined;
}

function sanitizeOwnerPhoneInput(value?: string | null): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const hasPlusPrefix = trimmed.startsWith("+");
  const digits = trimmed.replace(/[^\d]/g, "");
  if (!digits) return undefined;
  return hasPlusPrefix ? `+${digits}` : digits;
}

function parseNumberCell(value?: string | null): number | undefined {
  if (!value) return undefined;
  const parsed = Number(String(value).trim());
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseScopeOfWorkCell(value?: string | null): string[] | undefined {
  if (!value) return undefined;
  const raw = value.trim();
  if (!raw) return undefined;
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      const entries = parsed.map((item) => String(item).trim()).filter(Boolean);
      return entries.length ? entries : undefined;
    }
  } catch {
    // fall through to delimiter parsing
  }
  const entries = raw
    .split(/[|,]/)
    .map((item) => item.trim())
    .filter(Boolean);
  return entries.length ? entries : undefined;
}

function normalizeSizeUnit(value?: string): "sq.ft" | "sq.m" | "sq.yd" | "acre" | undefined {
  if (!value) return undefined;
  const normalized = value.replace(/\s+/g, "").toLowerCase();
  return sizeUnitMap[normalized];
}

function normalizeListingType(value?: string): "exclusive" | "colisting" | "shared" | undefined {
  if (!value) return undefined;
  const normalized = value.replace(/[_\s-]+/g, " ").trim().toLowerCase();
  return listingTypeMap[normalized];
}

function normalizeTransactionType(value?: string): "sale" | "rent" | undefined {
  if (!value) return undefined;
  const normalized = value.trim().toLowerCase();
  if (normalized === "rent") return "rent";
  if (normalized === "sale" || normalized === "sell") return "sale";
  return undefined;
}

function normalizeRentFrequency(value?: string): "monthly" | "yearly" | undefined {
  if (!value) return undefined;
  const normalized = value.trim().toLowerCase();
  return rentFrequencyMap[normalized];
}

function hasMeaningfulData(row: CsvRow): boolean {
  return Object.values(row).some((value) => Boolean(value && String(value).trim()));
}

function buildSchemaInput(row: CsvRow): Record<string, unknown> {
  const title = getCell(row, "title");
  const propertyType = getCell(row, "propertyType", "property_type");
  const transactionType = normalizeTransactionType(getCell(row, "transactionType", "transaction_type"));
  const price = getCell(row, "price", "sale_price");
  const rentFrequency = normalizeRentFrequency(getCell(row, "rentFrequency", "rent_frequency"));
  const size = getCell(row, "size", "area");
  const sizeUnit = normalizeSizeUnit(getCell(row, "sizeUnit", "area_unit"));
  const location = getCell(row, "location");
  const fullAddress = getCell(row, "fullAddress", "full_address") ?? location;
  const flatNumber = getCell(row, "flatNumber", "flat_number");
  const floorNumber = getCell(row, "floorNumber", "floor", "floor_number");
  const buildingSociety = getCell(row, "buildingSociety", "building_society");
  const description = getCell(row, "description");
  const bhk = parseNumberCell(getCell(row, "bhk"));
  const listingType = normalizeListingType(getCell(row, "listingType", "listing_type"));
  const isPubliclyVisibleCell = parseBooleanCell(getCell(row, "isPubliclyVisible", "is_publicly_visible"));
  const ownerName = getCell(row, "ownerName", "owner_name");
  const ownerPhone = sanitizeOwnerPhoneInput(getCell(row, "ownerPhone", "owner_phone"));
  const commissionTerms = getCell(row, "commissionTerms", "commission_terms");
  const scopeOfWork = parseScopeOfWorkCell(getCell(row, "scopeOfWork", "scope_of_work"));

  const isPubliclyVisible = typeof isPubliclyVisibleCell === "boolean"
    ? isPubliclyVisibleCell
    : listingType !== "exclusive";

  return {
    title,
    propertyType,
    transactionType,
    price,
    rentFrequency,
    size,
    sizeUnit,
    location,
    fullAddress,
    flatNumber,
    floorNumber,
    buildingSociety,
    description,
    bhk,
    listingType,
    isPubliclyVisible,
    ownerName,
    ownerPhone,
    commissionTerms,
    scopeOfWork,
  };
}

function buildFormData(data: ReturnType<typeof insertPropertySchema.parse>): FormData {
  const formData = new FormData();
  formData.append("title", data.title);
  formData.append("propertyType", data.propertyType);
  formData.append("transactionType", data.transactionType);
  formData.append("price", data.price);
  if (data.rentFrequency) formData.append("rentFrequency", data.rentFrequency);
  if (data.size) formData.append("size", data.size);
  if (data.sizeUnit) formData.append("sizeUnit", data.sizeUnit);
  formData.append("location", data.location);
  formData.append("fullAddress", data.fullAddress);
  if (data.flatNumber) formData.append("flatNumber", data.flatNumber);
  if (data.floorNumber) formData.append("floorNumber", data.floorNumber);
  if (data.buildingSociety) formData.append("buildingSociety", data.buildingSociety);
  if (data.description) formData.append("description", data.description);
  if (typeof data.bhk === "number") formData.append("bhk", String(data.bhk));
  formData.append("listingType", data.listingType);
  formData.append("isPubliclyVisible", String(data.isPubliclyVisible ?? false));
  formData.append("ownerName", data.ownerName);
  formData.append("ownerPhone", data.ownerPhone);
  if (data.commissionTerms) formData.append("commissionTerms", data.commissionTerms);
  if (data.scopeOfWork && data.scopeOfWork.length) {
    formData.append("scopeOfWork", JSON.stringify(data.scopeOfWork));
  }
  return formData;
}

async function getUserFromCookie(req: NextRequest): Promise<string | null> {
  const cookie = req.headers.get("cookie") || "";
  const part = cookie.split(";").find((c) => c.trim().startsWith("session="));
  if (!part) return null;
  try {
    const token = part.split("=")[1];
    const session = await verifySession(token);
    return session.sub as string;
  } catch {
    return null;
  }
}

async function createPropertyViaApi(formData: FormData, req: NextRequest): Promise<CreatePropertyResult> {
  const origin = req.nextUrl?.origin || process.env.NEXT_PUBLIC_APP_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const endpoint = new URL("/api/my-properties", origin);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Cookie: req.headers.get("cookie") || "",
      },
      body: formData,
      cache: "no-store",
    });

    let message = response.statusText || "Request failed";
    let payload: Record<string, unknown> | null = null;
    try {
      payload = await response.json();
      if (payload && typeof payload === "object" && "message" in payload && typeof payload.message === "string") {
        message = payload.message;
      }
    } catch {
      // ignore body parse errors
    }

    return { ok: response.ok, status: response.status, message, payload };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create property";
    return { ok: false, status: 500, message };
  }
}

export async function POST(req: NextRequest) {
  const userId = await getUserFromCookie(req);
  if (!userId) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ message: "No file uploaded" }, { status: 400 });
    }

    const text = await file.text();
    const parsed = Papa.parse<Record<string, string>>(text, {
      header: true,
      skipEmptyLines: "greedy",
      transformHeader: (header) => header.trim(),
    });

    if (parsed.errors?.length) {
      const firstError = parsed.errors[0];
      return NextResponse.json(
        { message: `CSV parse error: ${firstError?.message ?? "Unknown error"}` },
        { status: 400 }
      );
    }

    const rows = (parsed.data || []).filter(hasMeaningfulData);

    if (rows.length === 0) {
      return NextResponse.json({ message: "CSV file is empty." }, { status: 400 });
    }

    const summary: UploadSummary = {
      total: rows.length,
      successful: 0,
      failed: 0,
      errors: [],
      duplicates: [],
      smsWarnings: [],
    };

    for (let index = 0; index < rows.length; index++) {
      const rowNumber = index + 2; // account for header row
      const schemaInput = buildSchemaInput(rows[index]);
      const validation = insertPropertySchema.safeParse(schemaInput);

      if (!validation.success) {
        summary.failed += 1;
        const issues = validation.error.issues.map((issue) => issue.message).join(", ");
        summary.errors.push(`Row ${rowNumber}: ${issues}`);
        continue;
      }

      const propertyForm = buildFormData(validation.data);
      const result = await createPropertyViaApi(propertyForm, req);

      if (result.ok) {
        summary.successful += 1;
        const ownerConsent = result.payload && typeof result.payload === "object" ? (result.payload as Record<string, unknown>).ownerConsent as Record<string, unknown> | undefined : undefined;
        const smsStatus = ownerConsent && typeof ownerConsent === "object" ? (ownerConsent.smsStatus as string | undefined) : undefined;
        if (smsStatus && smsStatus !== "sent") {
          summary.smsWarnings.push({
            row: rowNumber,
            status: smsStatus,
            error: ownerConsent && typeof ownerConsent === "object" ? (ownerConsent.smsError as string | null | undefined) ?? undefined : undefined,
          });
        }
      } else {
        summary.failed += 1;
        summary.errors.push(`Row ${rowNumber}: ${result.message}`);
        if (result.status === 409) {
          summary.duplicates.push({ row: rowNumber, message: result.message });
        }
      }
    }

    return NextResponse.json(summary, { status: 200 });
  } catch (err: unknown) {
    console.error("[POST /api/properties/bulk-upload]", err);
    const message = err instanceof Error ? err.message : "Bulk upload failed";
    return NextResponse.json({ message }, { status: 500 });
  }
}
