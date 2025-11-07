"use client";
import { ChevronDown } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import { useState } from "react";
import { SUPPORTED_CHAIN_IDS } from "@/config";
import type { SupportedChainId } from "@/config/types";
import type { MerklAccountReward, MerklAccountRewardsMap } from "@/data/whisk/getAccountRewards";
import { cn } from "@/utils/shadcn";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import NumberFlow from "../ui/number-flow";
import { Separator } from "../ui/seperator";
import { RewardTokenRow } from "./RewardTokenRow";

interface RewardsSelectorProps {
  rewardsMap: MerklAccountRewardsMap;
  onSubmit: (chainId: SupportedChainId, rewards: MerklAccountReward[]) => { error: string | null };
}

export function RewardsSelector({ rewardsMap, onSubmit }: RewardsSelectorProps) {
  const entries = Object.entries(rewardsMap);

  if (entries.length === 0) {
    return (
      <Card className="flex h-[80px] w-full items-center justify-center bg-secondary text-center text-secondary-foreground shadow-none">
        You currently have no claimable rewards. <br /> Rewards update every 24 hours, check back later.
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {entries.map(([chainId, { rewards, totalUsd }]) => (
        <RewardsSelectorChain
          key={chainId}
          chainId={Number(chainId) as SupportedChainId}
          rewards={rewards}
          totalUsd={totalUsd}
          defaultOpen={entries.length <= 2}
          onSubmit={onSubmit}
        />
      ))}
    </div>
  );
}

function RewardsSelectorChain({
  chainId,
  rewards,
  totalUsd,
  defaultOpen,
  onSubmit,
}: {
  chainId: SupportedChainId;
  rewards: MerklAccountReward[];
  totalUsd: number;
  defaultOpen: boolean;
  onSubmit: (chainId: SupportedChainId, rewards: MerklAccountReward[]) => { error: string | null };
}) {
  const [dropdownOpen, setDropdownOpen] = useState(defaultOpen);
  const [submitError, setSubmitError] = useState<string | null>(null);

  function handleClick() {
    setSubmitError(null);
    const { error } = onSubmit(chainId, rewards);
    if (error) {
      setSubmitError(error);
      return;
    }
  }

  if (rewards.length === 0) {
    return null;
  }

  // Note: all rewards for a chain have the same chain (enforced by Whisk)
  const chainInfo = rewards[0]!.token.chain;

  return (
    <div className="rounded-xl bg-muted">
      <button
        type="button"
        className="flex w-full items-center gap-2 p-4 pb-4 text-left "
        aria-expanded={dropdownOpen}
        onClick={() => setDropdownOpen((prev) => !prev)}
      >
        <div className="flex items-center gap-2.5">
          <Image
            src={chainInfo.icon}
            alt={chainInfo.name}
            width={28}
            height={28}
            className="shrink-0 rounded-4 rounded-[4px]"
          />
          <div className="flex flex-col">
            <span>{chainInfo.name}</span>
            <span className="body-small text-muted-foreground">
              {rewards.length} token{rewards.length === 1 ? "" : "s"}
            </span>
          </div>
        </div>
        <NumberFlow value={totalUsd} format={{ currency: "USD" }} className="ml-auto" />
        <ChevronDown
          className={cn("size-5 shrink-0 transition-transform hover:cursor-pointer", dropdownOpen && "rotate-180")}
        />
      </button>

      <div className="px-4">
        <Separator className="bg-border" />
      </div>

      <AnimatePresence initial={false}>
        {dropdownOpen ? (
          <motion.div
            key="rewards-list"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden "
          >
            <div className="flex flex-col gap-3 ">
              <ul className="flex flex-col gap-2">
                {rewards.map((reward) => (
                  <RewardTokenRow key={`${reward.token.address}-${reward.distributorAddress}`} reward={reward} />
                ))}
              </ul>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className=" px-4 py-4">
        <Button className="w-full" onClick={handleClick}>
          Claim {SUPPORTED_CHAIN_IDS.length > 1 ? `on ${chainInfo.name}` : ""}
        </Button>
        {submitError && <p className="text-destructive text-sm">{submitError}</p>}
      </div>
    </div>
  );
}
