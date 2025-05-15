"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React, { type ReactNode } from "react";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchInterval: 300_000, // 5 min
      staleTime: 300_000, // 5 min
      retry: false, // Generally use fetchJsonResponse, which handles retries itself
    },
  },
});

export function TanstackQueryProvider({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
