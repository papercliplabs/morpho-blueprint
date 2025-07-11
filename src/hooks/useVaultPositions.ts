"use client";
import { useQuery } from "@tanstack/react-query";
import type { Address } from "viem";
import { useAccount } from "wagmi";

import type { VaultPositionMap } from "@/data/whisk/getVaultPositions";
import { fetchJsonResponse } from "@/utils/promise";

export function useVaultPositions() {
  const { address } = useAccount();
  return useQuery({
    queryKey: ["vault-positions", address],
    queryFn: async () => fetchJsonResponse<VaultPositionMap>(`/api/account/${address}/vault-positions`),
    enabled: !!address,
  });
}

export function useVaultPosition(chainId: number, vaultAddress: Address) {
  const { data: positions, ...rest } = useVaultPositions();
  return { data: positions?.[chainId]?.[vaultAddress], ...rest };
}
