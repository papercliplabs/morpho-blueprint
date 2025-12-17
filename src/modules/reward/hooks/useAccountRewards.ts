"use client";
import { useQuery } from "@tanstack/react-query";
import { useAccount } from "wagmi";
import { fetchJsonResponse } from "@/common/utils/fetch";
import type { MerklAccountRewardsMap } from "@/modules/reward/data/getAccountRewards";

export function useAccountRewards() {
  const { address } = useAccount();
  return useQuery({
    queryKey: ["account-rewards-map", address],
    queryFn: async () => fetchJsonResponse<MerklAccountRewardsMap>(`/api/account/${address}/rewards`),
    enabled: !!address,
  });
}
