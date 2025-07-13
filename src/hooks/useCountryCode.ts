"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchJsonResponse } from "@/utils/fetch";

// Fetches the ISO 3166-2 country code for the current user
export function useCountryCode() {
  return useQuery({
    queryKey: ["country"],
    queryFn: async () => fetchJsonResponse<string>(`/api/country`),
  });
}
