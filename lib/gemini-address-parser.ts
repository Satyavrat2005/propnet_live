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

  if (!apiKey) {
    console.warn("GEMINI_API_KEY not found, returning null values");
    return {
      location: null,
      flatNumber: null,
      floorNumber: null,
      buildingSociety: null,
    };
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const prompt = `Parse the following address and extract these fields in JSON format:
- location (Area and City combined, e.g., "Bandra West, Mumbai")
- flatNumber (Flat/Unit number like "A-101", "201", etc.)
- floorNumber (Floor number like "3rd Floor", "Ground Floor", etc.)
- buildingSociety (Building or Society name)

If any field is not found in the address, return null for that field.

Address: "${fullAddress}"

Return ONLY a valid JSON object with these exact keys: location, flatNumber, floorNumber, buildingSociety. No additional text or explanation.`;

  const modelCandidates = [
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-2.5-flash-lite",
  ];

  for (const modelName of modelCandidates) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = await response.text();

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.warn(`Failed to extract JSON from Gemini response (${modelName})`);
        continue;
      }

      const parsed = JSON.parse(jsonMatch[0]) as ParsedAddress;

      return {
        location: parsed.location || null,
        flatNumber: parsed.flatNumber || null,
        floorNumber: parsed.floorNumber || null,
        buildingSociety: parsed.buildingSociety || null,
      };
    } catch (error) {
      console.warn(`Gemini ${modelName} failed, trying next model:`, error);
    }
  }

  console.error("All Gemini models failed for address parsing");
  return {
    location: null,
    flatNumber: null,
    floorNumber: null,
    buildingSociety: null,
  };
}
