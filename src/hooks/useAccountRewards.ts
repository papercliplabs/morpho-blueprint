"use client";
import { useQuery } from "@tanstack/react-query";
import { useAccount } from "wagmi";
import type { MerklAccountRewardsMap } from "@/data/whisk/getAccountRewards";
import { fetchJsonResponse } from "@/utils/fetch";

export function useAccountRewards() {
  const { address } = useAccount();
  return useQuery({
    queryKey: ["account-rewards-map", address],
    queryFn: async () => fetchJsonResponse<MerklAccountRewardsMap>(`/api/account/${address}/rewards`),
    enabled: !!address,
  });
}
