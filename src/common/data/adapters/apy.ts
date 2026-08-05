import { toTokenInfo } from "@/common/data/adapters/entity";
import type { Apy, ApyAverages, RewardApy } from "@/common/data/types";

interface RawReward {
  asset: {
    address: string;
    symbol: string;
    name: string;
    decimals: number;
    logoURI: string | null;
    tags?: string[] | null;
  };
  supplyApr?: number | null;
  borrowApr?: number | null;
}

/**
 * Morpho reward APRs are instantaneous only (Whisk attached a windowed `rewards[]` to every APY
 * object). Windowed rewards *total* is `netApy - netApyExcludingRewards`; the per-token breakdown
 * below is the current APR, which is what app.morpho.org shows too.
 */
export function toRewardApys(rewards: RawReward[] | null | undefined, side: "supply" | "borrow"): RewardApy[] {
  return (rewards ?? [])
    .map((reward) => ({
      asset: toTokenInfo(reward.asset),
      apr: (side === "supply" ? reward.supplyApr : reward.borrowApr) ?? 0,
    }))
    .filter((reward) => reward.apr !== 0);
}

/**
 * Collects the four aliased `avgNetApy(lookback:)` selections into the app's shape. Both protocols
 * alias them identically — on `Vault.state` for V1 and on `VaultV2` itself.
 */
export function toApyAverages(
  source:
    | {
        avgNetApy7d?: number | null;
        avgNetApy30d?: number | null;
        avgNetApy90d?: number | null;
        avgNetApyInception?: number | null;
      }
    | null
    | undefined,
): ApyAverages {
  return {
    sevenDays: source?.avgNetApy7d ?? null,
    thirtyDays: source?.avgNetApy30d ?? null,
    ninetyDays: source?.avgNetApy90d ?? null,
    inception: source?.avgNetApyInception ?? null,
  };
}

/**
 * Assembles the app's `Apy` from the two net figures the API serves for a given window.
 *
 * Both vaults and markets report APYs already net of fees, and neither exposes a gross rate, so
 * this is a straight mapping. Fee *rates* are displayed on their own (the vault info panel), never
 * as APY deltas subtracted from a reconstructed gross figure.
 */
export function assembleApy({
  apyExcludingRewards,
  netApy,
  rewards,
}: {
  /** APY after fees, excluding rewards (`avgNetApyExcludingRewards` / `avgSupplyApy`). */
  apyExcludingRewards: number | null | undefined;
  /** APY after fees, including rewards (`avgNetApy` / `avgNetSupplyApy`). */
  netApy: number | null | undefined;
  rewards: RewardApy[];
}): Apy {
  const afterFees = apyExcludingRewards ?? 0;
  return { afterFees, total: netApy ?? afterFees, rewards };
}
