import { formatUnits, getAddress } from "viem";
import { descale, toAmount, toBigInt, toRatio } from "@/common/data/adapters/amount";
import { assembleApy, toRewardApys } from "@/common/data/adapters/apy";
import { toChainInfo, toCuratorInfo, toTokenInfo } from "@/common/data/adapters/entity";
import { warnIfTruncated } from "@/common/data/adapters/pagination";
import { type DataPoint, descaleSeries, zipTimeseries } from "@/common/data/adapters/timeseries";
import { numberToString } from "@/common/utils/format";
import { Erc4626VaultProtocol } from "@/config/vault-protocol";
import type {
  MarketInfoFragmentFragment,
  MarketSummaryFragmentFragment,
  MarketSupplyingVaultV1FragmentFragment,
  MarketSupplyingVaultV2FragmentFragment,
} from "@/generated/gql/morpho/graphql";
import type {
  MarketHistoricalEntry,
  MarketInfo,
  MarketSummary,
  MarketVaultAllocation,
} from "@/modules/market/market.types";
import type { BigIntish } from "@/morpho-types";

/**
 * AdaptiveCurveIRM target utilization. Not exposed by the API (`Market.targetBorrowUtilization` is
 * deprecated and hardcodes 90% anyway); it is a protocol constant.
 */
export const ADAPTIVE_CURVE_IRM_TARGET_UTILIZATION = 0.9;

/** The API exposes no market name; compose one from the asset symbols, as app.morpho.org does. */
export function composeMarketName(collateralSymbol: string | null | undefined, loanSymbol: string): string {
  return collateralSymbol ? `${collateralSymbol} / ${loanSymbol}` : `Idle ${loanSymbol}`;
}

/**
 * Not exposed by the API. Derived from the LLTV, as Morpho Blue does:
 * `LIF = min(1.15, 1 / (0.3 * lltv + 0.7))`, and the penalty is `LIF - 1`.
 */
export function computeLiquidationPenalty(lltvWad: BigIntish | null | undefined): number {
  const lltv = Number(formatUnits(toBigInt(lltvWad), 18));
  const liquidationIncentiveFactor = Math.min(1.15, 1 / (0.3 * lltv + 0.7));
  return liquidationIncentiveFactor - 1;
}

/**
 * `MarketState.price` is the oracle price of one collateral unit in loan-asset units, scaled by
 * `36 + loanDecimals - collateralDecimals`. `raw` is passed straight to the blue-sdk math helpers
 * (which expect the 1e36-scaled oracle price), `formatted` is the human-readable price.
 */
export function toCollateralPriceInLoanAsset(
  price: BigIntish | null | undefined,
  loanDecimals: number,
  collateralDecimals: number,
): { raw: string; formatted: string } | null {
  if (price == null) return null;
  const raw = toBigInt(price);
  const scale = 36 + Math.round(loanDecimals) - Math.round(collateralDecimals);
  return { raw: raw.toString(), formatted: formatUnits(raw, scale) };
}

export function toMarketInfo(market: MarketInfoFragmentFragment): MarketInfo {
  const state = market.state;
  const collateralAsset = market.collateralAsset ? toTokenInfo(market.collateralAsset) : null;
  const loanAsset = toTokenInfo(market.loanAsset);
  const rewards = toRewardApys(state?.rewards, "supply");

  return {
    marketId: market.marketId,
    chain: toChainInfo(market.chain),
    name: composeMarketName(collateralAsset?.symbol, loanAsset.symbol),
    // A market with no collateral asset is an idle market.
    isIdle: collateralAsset === null,
    lltv: toRatio(market.lltv),
    collateralAsset,
    loanAsset,
    totalSupplied: { usd: state?.supplyAssetsUsd ?? null },
    supplyApy6h: assembleApy({
      apyExcludingRewards: state?.avgSupplyApy,
      netApy: state?.avgNetSupplyApy,
      rewards,
    }),
    supplyApy1d: assembleApy({
      apyExcludingRewards: state?.dailySupplyApy,
      netApy: state?.dailyNetSupplyApy,
      rewards,
    }),
    supplyApy7d: assembleApy({
      apyExcludingRewards: state?.weeklySupplyApy,
      netApy: state?.weeklyNetSupplyApy,
      rewards,
    }),
    supplyApy30d: assembleApy({
      apyExcludingRewards: state?.monthlySupplyApy,
      netApy: state?.monthlyNetSupplyApy,
      rewards,
    }),
  };
}

export function toMarketSummary(market: MarketSummaryFragmentFragment): MarketSummary {
  const state = market.state;
  const collateralAsset = market.collateralAsset ? toTokenInfo(market.collateralAsset) : null;
  const loanAsset = toTokenInfo(market.loanAsset);
  const rewards = toRewardApys(state?.rewards, "borrow");

  return {
    chain: toChainInfo(market.chain),
    name: composeMarketName(collateralAsset?.symbol, loanAsset.symbol),
    marketId: market.marketId,
    totalBorrowed: toAmount(state?.borrowAssets, loanAsset.decimals, state?.borrowAssetsUsd),
    collateralAsset,
    loanAsset,
    lltv: toRatio(market.lltv),
    borrowApy: assembleApy({
      apyExcludingRewards: state?.borrowApy,
      netApy: state?.netBorrowApy,
      rewards,
    }),
    borrowApy6h: assembleApy({
      apyExcludingRewards: state?.avgBorrowApy,
      netApy: state?.avgNetBorrowApy,
      rewards,
    }),
    borrowApy1d: assembleApy({
      apyExcludingRewards: state?.dailyBorrowApy,
      netApy: state?.dailyNetBorrowApy,
      rewards,
    }),
    borrowApy7d: assembleApy({
      apyExcludingRewards: state?.weeklyBorrowApy,
      netApy: state?.weeklyNetBorrowApy,
      rewards,
    }),
    borrowApy30d: assembleApy({
      apyExcludingRewards: state?.monthlyBorrowApy,
      netApy: state?.monthlyNetBorrowApy,
      rewards,
    }),
  };
}

/**
 * `Market.publicAllocatorSharedLiquidity` lists every reallocatable chunk; the UI shows the total.
 * Priced with the loan asset price, since the API exposes no USD value on these entries.
 */
export function sumPublicAllocatorSharedLiquidity(
  entries: readonly { assets: BigIntish }[] | null | undefined,
  loanDecimals: number,
  loanPriceUsd: number | null | undefined,
) {
  const total = (entries ?? []).reduce((acc, entry) => acc + toBigInt(entry.assets), 0n);
  const amount = toAmount(total, loanDecimals);
  return { ...amount, usd: loanPriceUsd == null ? null : descale(total, loanDecimals) * loanPriceUsd };
}

/* -------------------------------------------------------------------------------------------- */
/* Inverse vault-allocation join (market page)                                                    */
/* -------------------------------------------------------------------------------------------- */

function marketShare(
  part: BigIntish | null | undefined,
  marketSupplyAssets: BigIntish | null | undefined,
  decimals: number,
): number {
  const total = descale(marketSupplyAssets, decimals);
  return total > 0 ? descale(part, decimals) / total : 0;
}

/**
 * Whisk served `Market.vaultAllocations` directly. Morpho exposes the vaults supplying a market and
 * leaves the per-market amount to be picked out of each vault's own allocation list (vault V1) or
 * MarketV1 caps (vault V2).
 */
export function toMarketVaultAllocations(
  marketId: string,
  marketSupplyAssets: BigIntish | null | undefined,
  loanDecimals: number,
  loanPriceUsd: number | null,
  supplyingVaults: readonly MarketSupplyingVaultV1FragmentFragment[],
  supplyingVaultV2s: readonly MarketSupplyingVaultV2FragmentFragment[],
): MarketVaultAllocation[] {
  const fromV1 = supplyingVaults.flatMap((vault): MarketVaultAllocation[] => {
    const allocation = vault.state?.allocation.find((entry) => entry.market.marketId === marketId);
    if (!allocation) return [];

    return [
      {
        protocol: Erc4626VaultProtocol.MorphoV1,
        vault: {
          vaultAddress: getAddress(vault.address),
          name: vault.name,
          curatorAddress: vault.state?.curator ? getAddress(vault.state.curator) : null,
          asset: toTokenInfo(vault.asset),
          chain: toChainInfo(vault.chain),
          metadata: { curator: toCuratorInfo(vault.state?.curators?.[0]) },
        },
        enabled: toBigInt(allocation.supplyCap) > 0n,
        position: {
          supplyAmount: toAmount(allocation.supplyAssets, loanDecimals, allocation.supplyAssetsUsd),
          supplyShares: toBigInt(allocation.supplyShares).toString(),
        },
        supplyCap: toAmount(allocation.supplyCap, loanDecimals, allocation.supplyCapUsd),
        marketSupplyShare: marketShare(allocation.supplyAssets, marketSupplyAssets, loanDecimals),
      },
    ];
  });

  const fromV2 = supplyingVaultV2s.flatMap((vault): MarketVaultAllocation[] => {
    // A cap past the first page would drop this vault from the market's supplier table entirely.
    warnIfTruncated("vault V2 caps", vault.caps.pageInfo);
    warnIfTruncated("vault V2 adapters", vault.adapters.pageInfo);

    // A vault can cap the same market through more than one adapter, so the supplier row is the
    // sum over the market's caps rather than the first match.
    const capsForMarket = (vault.caps.items ?? []).filter(
      (entry) =>
        entry.type === "MarketV1" &&
        entry.data?.__typename === "MarketV1CapData" &&
        entry.data.market?.marketId === marketId,
    );
    if (capsForMarket.length === 0) return [];

    // `cap.allocation` is only refreshed on (de)allocation, while the adapter's position on the
    // market accrues interest and losses — prefer each cap's own adapter's position for the current
    // amount (joined on the cap's `adapterAddress`) and keep the cap only for limits (and as a
    // fallback while the position is not indexed yet).
    const positionByAdapter = new Map<string, { supplyAssets?: BigIntish | null; supplyAssetsUsd?: number | null }>();
    for (const adapter of vault.adapters.items ?? []) {
      if (adapter.__typename !== "MorphoMarketV1Adapter") continue;
      warnIfTruncated("vault V2 adapter positions", adapter.positions.pageInfo);
      const state = (adapter.positions.items ?? []).find((entry) => entry.market.marketId === marketId)?.state;
      if (state) positionByAdapter.set(adapter.address.toLowerCase(), state);
    }

    const priceUsd = loanPriceUsd;
    let supplyAssets = 0n;
    let supplyAssetsUsd: number | null = 0;
    let absoluteCap = 0n;
    for (const cap of capsForMarket) {
      const adapterAddress = cap.data?.__typename === "MarketV1CapData" ? cap.data.adapterAddress : null;
      const position = adapterAddress ? positionByAdapter.get(adapterAddress.toLowerCase()) : undefined;
      const assets = position?.supplyAssets ?? cap.allocation;
      supplyAssets += toBigInt(assets);
      const entryUsd =
        position?.supplyAssetsUsd ?? (priceUsd == null ? null : descale(assets, loanDecimals) * priceUsd);
      supplyAssetsUsd = supplyAssetsUsd == null || entryUsd == null ? null : supplyAssetsUsd + entryUsd;
      absoluteCap += toBigInt(cap.absoluteCap);
    }

    // A curator can leave a cap configured on a market the vault holds nothing in; drop those
    // rather than rendering a $0 supplier row (same rule as the vault-side allocation breakdown).
    if (supplyAssets === 0n) return [];

    return [
      {
        protocol: Erc4626VaultProtocol.MorphoV2,
        vault: {
          vaultAddress: getAddress(vault.address),
          name: vault.name,
          curatorAddress: getAddress(vault.curator.address),
          asset: toTokenInfo(vault.asset),
          chain: toChainInfo(vault.chain),
          metadata: { curator: toCuratorInfo(vault.curators.items?.[0]) },
        },
        enabled: absoluteCap > 0n,
        position: {
          supplyAmount: { ...toAmount(supplyAssets, loanDecimals), usd: supplyAssetsUsd },
          // Vault V2 allocations are not share-denominated.
          supplyShares: "0",
        },
        supplyCap: {
          ...toAmount(absoluteCap, loanDecimals),
          usd: priceUsd == null ? null : descale(absoluteCap, loanDecimals) * priceUsd,
        },
        marketSupplyShare: marketShare(supplyAssets, marketSupplyAssets, loanDecimals),
      },
    ];
  });

  return [...fromV1, ...fromV2];
}

/** Joins the market chart series into the bucket rows the chart expects. */
export function toMarketHistoricalEntries(
  series: {
    supplyAssets: readonly { x: number; y: BigIntish | null }[];
    supplyAssetsUsd: readonly DataPoint[];
    borrowAssets: readonly { x: number; y: BigIntish | null }[];
    borrowAssetsUsd: readonly DataPoint[];
    collateralAssets: readonly { x: number; y: BigIntish | null }[];
    collateralAssetsUsd: readonly DataPoint[];
    borrowApy1d: readonly DataPoint[];
    netBorrowApy1d: readonly DataPoint[];
    borrowApy7d: readonly DataPoint[];
    netBorrowApy7d: readonly DataPoint[];
    borrowApy30d: readonly DataPoint[];
    netBorrowApy30d: readonly DataPoint[];
  },
  loanDecimals: number,
  collateralDecimals: number,
): MarketHistoricalEntry[] {
  return zipTimeseries(
    {
      supply: descaleSeries(series.supplyAssets, loanDecimals),
      supplyUsd: series.supplyAssetsUsd,
      borrow: descaleSeries(series.borrowAssets, loanDecimals),
      borrowUsd: series.borrowAssetsUsd,
      collateral: descaleSeries(series.collateralAssets, collateralDecimals),
      collateralUsd: series.collateralAssetsUsd,
      base1d: series.borrowApy1d,
      total1d: series.netBorrowApy1d,
      base7d: series.borrowApy7d,
      total7d: series.netBorrowApy7d,
      base30d: series.borrowApy30d,
      total30d: series.netBorrowApy30d,
    },
    (bucketTimestamp, values) => ({
      bucketTimestamp,
      totalSupplied: { formatted: numberToString(values.supply ?? 0), usd: values.supplyUsd },
      totalBorrowed: { formatted: numberToString(values.borrow ?? 0), usd: values.borrowUsd },
      totalCollateral: { formatted: numberToString(values.collateral ?? 0), usd: values.collateralUsd },
      // Kept null where the upstream series has no sample (a market younger than the window),
      // so the chart shows a gap instead of a spurious 0% line — same rule as the vault chart.
      borrowApy1d: { base: values.base1d ?? null, total: values.total1d ?? null },
      borrowApy7d: { base: values.base7d ?? null, total: values.total7d ?? null },
      borrowApy30d: { base: values.base30d ?? null, total: values.total30d ?? null },
    }),
  );
}
