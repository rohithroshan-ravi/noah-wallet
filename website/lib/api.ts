// Configures the generated API client with the backend base URL and auth key.
// Import this module once (e.g. in layout.tsx or a provider) before calling
// any SDK function, or pass `client` as an option per-call.
//
// Server Components:  just await the SDK functions — Next.js extends fetch
//                     with automatic caching and revalidation.
// Client Components:  use the SDK functions inside useQuery() hooks.

import { client } from "@/lib/client/client.gen";

export function configureApiClient() {
  client.setConfig({
    baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080",
    headers: {
      "X-API-Key": process.env.NEXT_PUBLIC_API_KEY ?? "",
    },
  });
}

// Re-export the SDK so callers only need one import.
export * from "@/lib/client";
