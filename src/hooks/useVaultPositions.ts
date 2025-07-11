"use client";
import { useQuery } from "@tanstack/react-query";
import type { Address } from "viem";
import { useAccount } from "wagmi";
import type { SupportedChainId } from "@/config/types";
import type { VaultPositionMap } from "@/data/whisk/getVaultPositions";
import { fetchJsonResponse } from "@/utils/fetch";

export function useVaultPositions() {
  const { address } = useAccount();
  return useQuery({
    queryKey: ["vault-positions", address],
    queryFn: async () => fetchJsonResponse<VaultPositionMap>(`/api/account/${address}/vault-positions`),
    enabled: !!address,
  });
}

export function useVaultPosition(chainId: SupportedChainId, vaultAddress: Address) {
  const { data: positions, ...rest } = useVaultPositions();
  return { data: positions?.[chainId]?.[vaultAddress], ...rest };
}
