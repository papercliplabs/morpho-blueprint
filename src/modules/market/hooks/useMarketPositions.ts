"use client";
import { useQuery } from "@tanstack/react-query";
import type { Hex } from "viem";
import { useAccount } from "wagmi";
import { fetchJsonResponse } from "@/common/utils/fetch";
import type { SupportedChainId } from "@/config/types";
import type { MarketPositionMap } from "@/modules/market/data/getMarketPositions";

export function useMarketPositions() {
  const { address } = useAccount();
  return useQuery({
    queryKey: ["market-positions", address],
    queryFn: async () => fetchJsonResponse<MarketPositionMap>(`/api/account/${address}/market-positions`),
    enabled: !!address,
  });
}

export function useMarketPosition(chainId: SupportedChainId, marketId: Hex) {
  const { data: positions, ...rest } = useMarketPositions();
  return { data: positions?.[chainId]?.[marketId], ...rest };
}
