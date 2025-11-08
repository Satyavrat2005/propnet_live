/**
 * Safe fetch utility that handles non-JSON responses gracefully
 */
export async function safeFetch<T = any>(url: string, defaultValue: T): Promise<T> {
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      console.warn(`Failed to fetch ${url}:`, response.status);
      return defaultValue;
    }
    
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      console.warn(`Response from ${url} is not JSON`);
      return defaultValue;
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error fetching ${url}:`, error);
    return defaultValue;
  }
}
