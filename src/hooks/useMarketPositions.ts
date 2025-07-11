"use client";
import { useQuery } from "@tanstack/react-query";
import type { Hex } from "viem";
import { useAccount } from "wagmi";

import type { MarketPositionMap } from "@/data/whisk/getMarketPositions";
import { fetchJsonResponse } from "@/utils/promise";

export function useMarketPositions() {
  const { address } = useAccount();
  return useQuery({
    queryKey: ["market-positions", address],
    queryFn: async () => fetchJsonResponse<MarketPositionMap>(`/api/account/${address}/market-positions`),
    enabled: !!address,
  });
}

export function useMarketPosition(chainId: number, marketId: Hex) {
  const { data: positions, ...rest } = useMarketPositions();
  return { data: positions?.[chainId]?.[marketId], ...rest };
}
