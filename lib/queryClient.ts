import { QueryClient } from "@tanstack/react-query";

/**
 * API Request utility for making authenticated requests
 */
export async function apiRequest(
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH",
  endpoint: string,
  data?: unknown
): Promise<Response> {
  const isWritableMethod = method === "POST" || method === "PUT" || method === "PATCH";
  const headers: HeadersInit = {};
  const options: RequestInit = {
    method,
    credentials: "include", // Important: include credentials for cookies
  };

  if (!(data instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  if (Object.keys(headers).length > 0) {
    options.headers = headers;
  }

  if (isWritableMethod && data) {
    options.body = data instanceof FormData ? data : JSON.stringify(data);
  }

  const response = await fetch(endpoint, options);

  if (!response.ok && response.status !== 401 && response.status !== 400) {
    throw new Error(`API request failed: ${response.statusText}`);
  }

  return response;
}

/**
 * Create a QueryClient instance with default options
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

export default queryClient;