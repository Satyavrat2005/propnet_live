// app/api/quickpost/extract/route.ts
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";

// Fallback models in order of preference
const GEMINI_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-1.5-flash",
  "gemini-1.5-flash-8b"
];

const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";

type ExtractedProperty = {
  title?: string;
  propertyType?: string;
  transactionType?: "sale" | "rent";
  price?: string;
  rentFrequency?: "monthly" | "yearly";
  size?: string;
  sizeUnit?: string;
  location?: string;
  fullAddress?: string;
  ownerName?: string;
  ownerPhone?: string;
  commissionTerms?: string;
  bhk?: number;
  flatNumber?: string;
  floorNumber?: string;
  buildingSociety?: string;
  description?: string;
  confidence?: number;
  listingType?: "exclusive" | "shared" | "co-listing";
  isPubliclyVisible?: boolean;
  scopeOfWork?: string[];
};

function normalize(val: any): ExtractedProperty {
  const tType =
    (val?.transactionType || val?.transaction || "").toString().toLowerCase() as
      | "sale"
      | "rent";
  const listingTypeRaw = (val?.listingType || "").toString().toLowerCase();
  const listingType: ExtractedProperty["listingType"] =
    listingTypeRaw === "exclusive"
      ? "exclusive"
      : listingTypeRaw === "co-listing" || listingTypeRaw === "colisting"
      ? "co-listing"
      : "shared";

  const parsedBhk =
    typeof val?.bhk === "number"
      ? val.bhk
      : parseInt(String(val?.bhk || "").replace(/\D/g, "")) || 0;

  const sizeStr = val?.size ? String(val.size) : "";
  const sizeUnit =
    val?.sizeUnit ||
    (/sq\.? ?ft|sqft|ft2/i.test(sizeStr) ? "sq.ft" : undefined) ||
    (/sq\.? ?m|sqm|m2/i.test(sizeStr) ? "sq.m" : undefined) ||
    undefined;

  return {
    title: val?.title || val?.name || "",
    propertyType: val?.propertyType || val?.type || "",
    transactionType: tType === "rent" ? "rent" : "sale",
    price: val?.price ? String(val.price) : "",
    rentFrequency:
      (val?.rentFrequency as "monthly" | "yearly") ||
      (/month|monthly/i.test(String(val?.price || "")) ? "monthly" : undefined),
    size: sizeStr.replace(/[^\d.]/g, "") || "",
    sizeUnit: val?.sizeUnit || sizeUnit || "sq.ft",
    location: val?.location || val?.area || "",
    fullAddress: val?.fullAddress || val?.address || "",
    ownerName: val?.ownerName || val?.owner || "",
    ownerPhone: val?.ownerPhone || val?.contact || "",
    commissionTerms: val?.commissionTerms || val?.commission || "",
    bhk: parsedBhk,
    flatNumber: val?.flatNumber || val?.unit || "",
    floorNumber: val?.floorNumber || val?.floor || "",
    buildingSociety:
      val?.buildingSociety || val?.building || val?.society || "",
    description: val?.description || "",
    confidence:
      typeof val?.confidence === "number"
        ? Math.min(Math.max(val.confidence, 0), 1)
        : undefined,
    listingType,
    isPubliclyVisible:
      typeof val?.isPubliclyVisible === "boolean"
        ? val.isPubliclyVisible
        : listingType !== "exclusive",
    scopeOfWork: Array.isArray(val?.scopeOfWork) ? val.scopeOfWork : [],
  };
}

function extractJson(text: string): any {
  // Try to pull JSON from code fences or raw output
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const raw = fence ? fence[1] : text;
  try {
    return JSON.parse(raw);
  } catch {
    // Try to find first JSON array/object
    const first = raw.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    if (first) {
      try {
        return JSON.parse(first[1]);
      } catch {}
    }
  }
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();
    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { message: "Field 'text' is required." },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { message: "GEMINI_API_KEY is missing in environment." },
        { status: 500 }
      );
    }

    const prompt = [
      {
        role: "user",
        parts: [
          {
            text:
              `You are given raw text with one or more Indian real-estate listings (from WhatsApp, email, notes, etc.). ` +
              `Extract each property as strict JSON. Use these fields:\n\n` +
              `- title\n- propertyType (Apartment|Villa|Commercial|Plot)\n- transactionType (sale|rent)\n- price (string as typed, e.g. "₹ 2.5 Cr" or "75000")\n- rentFrequency (monthly|yearly, omit if not rent)\n- size (number as string)\n- sizeUnit (sq.ft|sq.m|sq.yd|acre)\n- location (area + city)\n- fullAddress (complete address if available)\n- bhk (integer)\n- flatNumber\n- floorNumber\n- buildingSociety\n- description\n- ownerName\n- ownerPhone\n- commissionTerms\n- listingType (exclusive|shared|co-listing)\n- isPubliclyVisible (boolean; default true unless listingType is exclusive)\n- scopeOfWork (array of strings)\n- confidence (0..1)\n\n` +
              `Important rules:\n` +
              `1) If a field is unknown, return empty string or omit for optional.\n` +
              `2) Guess bhk from phrases like "2 BHK" or "1RK".\n` +
              `3) Size should be numeric only; put unit in sizeUnit.\n` +
              `4) If it's rent and frequency is missing, default "monthly" when price mentions month.\n` +
              `5) Output ONLY JSON with the shape: { "properties": [ ... ] } — no commentary.\n\n` +
              `Raw text:\n` +
              text,
          },
        ],
      },
    ];

    // Try each model in sequence if rate limit is hit
    let resp: Response | null = null;
    let lastError: string = "";
    let usedModel: string = "";

    for (const model of GEMINI_MODELS) {
      const endpoint = `${GEMINI_BASE_URL}/${model}:generateContent?key=${apiKey}`;
      
      try {
        console.log(`[Gemini] Trying model: ${model}`);
        resp = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents: prompt }),
          cache: "no-store",
        });

        if (resp.ok) {
          usedModel = model;
          console.log(`[Gemini] Success with model: ${model}`);
          break;
        }

        // If rate limit (429), try next model
        if (resp.status === 429) {
          console.log(`[Gemini] Rate limit hit for ${model}, trying next model...`);
          lastError = await resp.text();
          continue;
        }

        // For other errors, break and return error
        lastError = await resp.text();
        break;

      } catch (error: any) {
        console.error(`[Gemini] Error with model ${model}:`, error);
        lastError = error.message;
        continue;
      }
    }

    if (!resp || !resp.ok) {
      return NextResponse.json(
        { 
          message: `All Gemini models failed or rate limited`, 
          detail: lastError,
          triedModels: GEMINI_MODELS
        },
        { status: 500 }
      );
    }

    const data = await resp.json();
    const candidateText =
      data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const json = extractJson(candidateText);

    if (!json || !Array.isArray(json?.properties)) {
      // lightweight fallback: naive single listing detection
      const fallback: ExtractedProperty[] = [];
      const phone = text.match(/\b(\+?91[- ]?)?\d{10}\b/);
      const bhk = text.match(/(\d+)\s*bhk|\b(\d+)\s*BHK\b/i);
      fallback.push(
        normalize({
          title: "",
          propertyType:
            /plot/i.test(text)
              ? "Plot"
              : /villa/i.test(text)
              ? "Villa"
              : /commercial|office|shop/i.test(text)
              ? "Commercial"
              : "Apartment",
          transactionType: /rent|lease/i.test(text) ? "rent" : "sale",
          price: (text.match(/(?:₹|rs\.?)\s?[\d.,]+(?:\s?(?:lakh|cr|crore|k))?/i) || [])[0] || "",
          size: (text.match(/(\d+(?:\.\d+)?)\s*(?:sq\.?\s*ft|sqft|ft2|sq\.?\s*m|sqm|m2|sq\.?\s*yd|sqyd|yd2|acre)/i) || [])[1] || "",
          sizeUnit: (text.match(/sq\.?\s*ft|sqft|ft2/i) && "sq.ft") ||
            (text.match(/sq\.?\s*m|sqm|m2/i) && "sq.m") ||
            (text.match(/sq\.?\s*yd|sqyd|yd2/i) && "sq.yd") ||
            (text.match(/acre/i) && "acre") ||
            "sq.ft",
          location: "",
          fullAddress: "",
          bhk: parseInt(bhk?.[1] || bhk?.[2] || "0") || 0,
          ownerPhone: phone?.[0] || "",
          commissionTerms: "",
          description: "",
          confidence: 0.3,
          listingType: "shared",
        })
      );

      return NextResponse.json(
        { properties: fallback, count: fallback.length, model: "fallback" },
        { status: 200 }
      );
    }

    const props: ExtractedProperty[] = json.properties.map(normalize);
    return NextResponse.json(
      { properties: props, count: props.length, model: usedModel },
      { status: 200 }
    );
  } catch (e: any) {
    console.error("[/api/quickpost/extract] ", e);
    return NextResponse.json(
      { message: e?.message || "Unexpected error" },
      { status: 500 }
    );
  }
}
