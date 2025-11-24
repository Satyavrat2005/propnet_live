// lib/gemini-address-parser.ts
import { GoogleGenerativeAI } from "@google/generative-ai";

interface ParsedAddress {
  location: string | null; // Area, City
  flatNumber: string | null;
  floorNumber: string | null;
  buildingSociety: string | null;
}

export async function parseAddressWithGemini(
  fullAddress: string
): Promise<ParsedAddress> {
  const apiKey = process.env.GEMINI_API_KEY;

  // Return nulls if no API key
  if (!apiKey) {
    console.warn("GEMINI_API_KEY not found, returning null values");
    return {
      location: null,
      flatNumber: null,
      floorNumber: null,
      buildingSociety: null,
    };
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `Parse the following address and extract these fields in JSON format:
- location (Area and City combined, e.g., "Bandra West, Mumbai")
- flatNumber (Flat/Unit number like "A-101", "201", etc.)
- floorNumber (Floor number like "3rd Floor", "Ground Floor", etc.)
- buildingSociety (Building or Society name)

If any field is not found in the address, return null for that field.

Address: "${fullAddress}"

Return ONLY a valid JSON object with these exact keys: location, flatNumber, floorNumber, buildingSociety. No additional text or explanation.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Try to extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.warn("Failed to extract JSON from Gemini response");
      return {
        location: null,
        flatNumber: null,
        floorNumber: null,
        buildingSociety: null,
      };
    }

    const parsed = JSON.parse(jsonMatch[0]) as ParsedAddress;

    // Ensure all fields exist
    return {
      location: parsed.location || null,
      flatNumber: parsed.flatNumber || null,
      floorNumber: parsed.floorNumber || null,
      buildingSociety: parsed.buildingSociety || null,
    };
  } catch (error) {
    console.error("Error parsing address with Gemini:", error);
    return {
      location: null,
      flatNumber: null,
      floorNumber: null,
      buildingSociety: null,
    };
  }
}
