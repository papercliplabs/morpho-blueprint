"use client";
import { useCallback, useMemo, useState } from "react";
import { useAccount } from "wagmi";
import { type Action, UserFacingError } from "@/actions";
import { claimMerklRewardsAction } from "@/actions/claimMerklRewardsAction";
import { SUPPORTED_CHAIN_IDS } from "@/config";
import type { SupportedChainId } from "@/config/types";
import type { MerklAccountReward } from "@/data/whisk/getAccountRewards";
import { useAccountRewards } from "@/hooks/useAccountRewards";
import { Button } from "../ui/button";
import { DialogDrawer, DialogDrawerContent, DialogDrawerTitle, DialogDrawerTrigger } from "../ui/dialog-drawer";
import { PoweredByMerkl } from "../ui/icons/PoweredByMerkl";
import { Sparkles } from "../ui/icons/Sparkles";
import NumberFlow from "../ui/number-flow";
import { Skeleton } from "../ui/skeleton";
import { RewardsClaim } from "./RewardsClaim";
import { RewardsSelector } from "./RewardsSelector";

export function Rewards() {
  const [claimAction, setClaimAction] = useState<{ action: Action; rewards: MerklAccountReward[] } | null>(null);

  const { isConnected, address } = useAccount();
  const { data: rewardsMap, isLoading } = useAccountRewards();

  const totalUsdAcrossAllChains = useMemo(() => {
    return Object.values(rewardsMap ?? {}).reduce((acc, curr) => acc + curr.totalUsd, 0);
  }, [rewardsMap]);

  const handleBuildAction = useCallback(
    (chainId: SupportedChainId, rewards: MerklAccountReward[]): { error: string | null } => {
      if (!address) {
        return { error: "No account connected" };
      }

      if (rewards.length === 0) {
        return { error: "No rewards to claim" };
      }

      try {
        const action = claimMerklRewardsAction({
          chainId,
          accountAddress: address,
          tokens: rewards.map((reward) => reward.token.address),
          creditedAmounts: rewards.map((reward) => BigInt(reward.creditedAmount.raw)),
          proofs: rewards.map((reward) => reward.proofs),
          distributorAddress: rewards[0]!.distributorAddress,
        });
        setClaimAction({ action, rewards });
        return { error: null };
      } catch (error) {
        return { error: error instanceof UserFacingError ? error.message : "An unknown error occurred" };
      }
    },
    [address],
  );

  if (!isConnected) {
    return null;
  }

  if (isLoading || !rewardsMap) {
    return (
      <Button asChild variant="secondary" className="w-16" disabled>
        <Skeleton />
      </Button>
    );
  }

  return (
    <>
      <DialogDrawer>
        <DialogDrawerTrigger>
          <Button variant="secondary" className="body-medium-plus gap-1.5">
            <Sparkles className="size-4 fill-primary" />
            <NumberFlow value={totalUsdAcrossAllChains} format={{ currency: "USD" }} />
          </Button>
        </DialogDrawerTrigger>
        <DialogDrawerContent className="flex flex-col p-0">
          <div className="px-6 pt-6 pb-4">
            <DialogDrawerTitle>Claimable tokens {SUPPORTED_CHAIN_IDS.length > 1 ? "per chain" : ""}</DialogDrawerTitle>
          </div>

          <div className="flex-1 overflow-y-auto px-6 pt-4">
            <RewardsSelector rewardsMap={rewardsMap} onSubmit={handleBuildAction} />

            <div className="flex items-center justify-center py-6">
              <PoweredByMerkl className="h-5" />
            </div>
          </div>
        </DialogDrawerContent>
      </DialogDrawer>

      <RewardsClaim
        action={claimAction?.action}
        rewards={claimAction?.rewards}
        clearAction={() => setClaimAction(null)}
      />
    </>
  );
}
