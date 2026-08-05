import { formatUnits, getAddress, zeroAddress } from "viem";
import { descale, toAmount, toBigInt, toRatio } from "@/common/data/adapters/amount";
import { assembleApy, toApyAverages, toRewardApys } from "@/common/data/adapters/apy";
import { toChainInfo, toCuratorInfo, toTokenInfo } from "@/common/data/adapters/entity";
import { warnIfTruncated } from "@/common/data/adapters/pagination";
import { type DataPoint, descaleSeries, zipTimeseries } from "@/common/data/adapters/timeseries";
import type { ChainInfo } from "@/common/data/types";
import { numberToString } from "@/common/utils/format";
import { APP_CONFIG } from "@/config";
import type {
  MorphoVaultV1CollateralFragmentFragment,
  MorphoVaultV1DetailsFragmentFragment,
  MorphoVaultV1SummaryFragmentFragment,
  MorphoVaultV2CollateralFragmentFragment,
  MorphoVaultV2DetailsFragmentFragment,
  MorphoVaultV2SummaryFragmentFragment,
  UnderlyingMorphoVaultV1FragmentFragment,
  VaultAllocationFragmentFragment,
  VaultCollateralAllocationFragmentFragment,
} from "@/generated/gql/morpho/graphql";
import { toMarketInfo } from "@/modules/market/data/adapters";
import type {
  MorphoVaultV1,
  MorphoVaultV1Summary,
  MorphoVaultV2,
  MorphoVaultV2Summary,
  UnderlyingMorphoVaultV1,
  VaultCollateralAllocation,
  VaultHistoricalEntry,
  VaultMarketAllocation,
  VaultV2AdapterCap,
  VaultV2Allocation,
  VaultV2CollateralAllocation,
  VaultV2MarketCap,
} from "@/modules/vault/vault.types";
import type { BigIntish } from "@/morpho-types";
import { matchVaultV2Adapter } from "./matchVaultV2Adapter";

/**
 * The shape an adapter produces, before `normalizeVault` applies the vault config: `isHidden` is
 * not known yet and the chain id has not been narrowed to a configured chain.
 */
type Adapted<T> = Omit<T, "isHidden" | "chain"> & { chain: ChainInfo };

function priceOf(asset: { price?: { usd: number } | null }): number | null {
  return asset.price?.usd ?? null;
}

function usdOf(raw: BigIntish | null | undefined, decimals: number, priceUsd: number | null): number | null {
  return priceUsd == null ? null : descale(raw, decimals) * priceUsd;
}

function share(part: BigIntish | null | undefined, whole: BigIntish | null | undefined, decimals: number): number {
  const total = descale(whole, decimals);
  return total > 0 ? descale(part, decimals) / total : 0;
}

/* -------------------------------------------------------------------------------------------- */
/* Vault V1 allocations                                                                           */
/* -------------------------------------------------------------------------------------------- */

export function toVaultMarketAllocations(
  allocations: readonly VaultAllocationFragmentFragment[],
  vaultTotalAssets: BigIntish | null | undefined,
  assetDecimals: number,
): VaultMarketAllocation[] {
  return allocations.map((allocation) => ({
    // Whisk exposed `enabled` directly; a non-zero supply cap is the equivalent condition.
    enabled: toBigInt(allocation.supplyCap) > 0n,
    vaultSupplyShare: share(allocation.supplyAssets, vaultTotalAssets, assetDecimals),
    position: {
      supplyAmount: toAmount(allocation.supplyAssets, assetDecimals, allocation.supplyAssetsUsd),
      supplyShares: toBigInt(allocation.supplyShares).toString(),
    },
    supplyCap: toAmount(allocation.supplyCap, assetDecimals, allocation.supplyCapUsd),
    market: toMarketInfo(allocation.market),
  }));
}

function toVaultCollateralAllocations(
  allocations: readonly VaultCollateralAllocationFragmentFragment[],
  vaultTotalAssets: BigIntish | null | undefined,
  assetDecimals: number,
): VaultCollateralAllocation[] {
  return allocations.map((allocation) => ({
    enabled: toBigInt(allocation.supplyCap) > 0n,
    vaultSupplyShare: share(allocation.supplyAssets, vaultTotalAssets, assetDecimals),
    position: { supplyAmount: { usd: allocation.supplyAssetsUsd ?? null } },
    market: {
      collateralAsset: allocation.market.collateralAsset
        ? {
            icon: allocation.market.collateralAsset.logoURI ?? null,
            name: allocation.market.collateralAsset.name,
            symbol: allocation.market.collateralAsset.symbol,
          }
        : null,
    },
  }));
}

/* -------------------------------------------------------------------------------------------- */
/* Vault V1                                                                                       */
/* -------------------------------------------------------------------------------------------- */

type MorphoVaultV1Base = Omit<Adapted<MorphoVaultV1Summary>, "marketAllocations">;

function toMorphoVaultV1Base(vault: MorphoVaultV1SummaryFragmentFragment): MorphoVaultV1Base {
  const asset = toTokenInfo(vault.asset);
  const state = vault.state;
  const curator = state?.curators?.[0];

  return {
    __typename: "MorphoVault",
    chain: toChainInfo(vault.chain),
    vaultAddress: getAddress(vault.address),
    name: vault.name,
    asset: { ...asset, priceUsd: priceOf(vault.asset) },
    totalAssets: toAmount(state?.totalAssets, asset.decimals, state?.totalAssetsUsd),
    apy: assembleApy({
      netApy: state?.avgNetApy,
      apyExcludingRewards: state?.avgNetApyExcludingRewards,
      rewards: toRewardApys(state?.allRewards, "supply"),
    }),
    metadata: {
      description: vault.metadata?.description ?? null,
      curator: toCuratorInfo(curator),
    },
    // Native `Curator.state.aum`, replacing the previous name-matched join against a second query.
    curatorAum: curator?.state?.aum,
  };
}

export function toMorphoVaultV1Summary(
  vault: MorphoVaultV1SummaryFragmentFragment & MorphoVaultV1CollateralFragmentFragment,
): Adapted<MorphoVaultV1Summary> {
  const decimals = Math.round(vault.asset.decimals);
  return {
    ...toMorphoVaultV1Base(vault),
    marketAllocations: toVaultCollateralAllocations(vault.state?.allocation ?? [], vault.state?.totalAssets, decimals),
  };
}

export function toMorphoVaultV1Details(
  vault: MorphoVaultV1SummaryFragmentFragment & MorphoVaultV1DetailsFragmentFragment,
): Adapted<Omit<MorphoVaultV1, "historical">> {
  const decimals = Math.round(vault.asset.decimals);
  const state = vault.state;

  return {
    ...toMorphoVaultV1Base(vault),
    marketAllocations: toVaultMarketAllocations(state?.allocation ?? [], state?.totalAssets, decimals),
    totalLiquidity: { usd: vault.liquidity?.usd ?? null },
    apyAverages: toApyAverages(state),
    performanceFeeRaw: state?.fee ?? 0,
    feeRecipientAddress: state?.feeRecipient ? getAddress(state.feeRecipient) : null,
    ownerAddress: getAddress(state?.owner ?? zeroAddress),
    curatorAddress: getAddress(state?.curator ?? zeroAddress),
    guardianAddress: getAddress(state?.guardian ?? zeroAddress),
  };
}

export function toUnderlyingMorphoVaultV1(vault: UnderlyingMorphoVaultV1FragmentFragment): UnderlyingMorphoVaultV1 {
  const asset = toTokenInfo(vault.asset);
  const state = vault.state;

  return {
    __typename: "MorphoVault",
    vaultAddress: getAddress(vault.address),
    name: vault.name,
    chain: toChainInfo(vault.chain),
    asset,
    apy: assembleApy({
      netApy: state?.avgNetApy,
      apyExcludingRewards: state?.avgNetApyExcludingRewards,
      rewards: toRewardApys(state?.allRewards, "supply"),
    }),
    totalAssets: toAmount(state?.totalAssets, asset.decimals, state?.totalAssetsUsd),
    marketAllocations: toVaultMarketAllocations(state?.allocation ?? [], state?.totalAssets, asset.decimals),
  };
}

/* -------------------------------------------------------------------------------------------- */
/* Vault V2                                                                                       */
/* -------------------------------------------------------------------------------------------- */

type RawV2Cap = NonNullable<MorphoVaultV2DetailsFragmentFragment["caps"]["items"]>[number];

function toAdapterCap(
  cap: RawV2Cap | undefined,
  adapter: { assets: BigIntish; assetsUsd?: number | null },
  decimals: number,
  priceUsd: number | null,
): VaultV2AdapterCap {
  if (!cap) {
    // Defensive: every adapter should carry an `Adapter` cap. Fall back to the adapter's own
    // assets so the allocation column still renders, with no cap information.
    return {
      allocation: toAmount(adapter.assets, decimals, adapter.assetsUsd ?? null),
      relativeCap: toRatio(0),
      absoluteCap: toAmount(0, decimals, null),
    };
  }
  return {
    // `cap.allocation` is only refreshed on (de)allocation while `adapter.assets` includes
    // virtually accrued interest, so the adapter is the current value; the cap only supplies limits.
    allocation: toAmount(adapter.assets, decimals, adapter.assetsUsd ?? usdOf(adapter.assets, decimals, priceUsd)),
    // `relativeCap` is WAD-scaled, so `formatted` is the [0, 1] fraction the UI renders as a percent.
    relativeCap: toRatio(cap.relativeCap),
    absoluteCap: toAmount(cap.absoluteCap, decimals, usdOf(cap.absoluteCap, decimals, priceUsd)),
  };
}

type RawV2MarketPosition = NonNullable<
  Extract<
    NonNullable<MorphoVaultV2DetailsFragmentFragment["adapters"]["items"]>[number],
    { __typename: "MorphoMarketV1Adapter" }
  >["positions"]["items"]
>[number];

function toMarketCaps(
  caps: readonly RawV2Cap[],
  positionByMarketId: ReadonlyMap<string, RawV2MarketPosition>,
  decimals: number,
  priceUsd: number | null,
): VaultV2MarketCap[] {
  return caps.flatMap((cap): VaultV2MarketCap[] => {
    const market = cap.data?.__typename === "MarketV1CapData" ? cap.data.market : null;
    if (!market) return [];
    // `cap.allocation` is only refreshed on (de)allocation, while the adapter's position on the
    // market accrues interest and losses — prefer the position for the current amount and keep the
    // cap only for limits (and as a fallback while the position is not indexed yet).
    const position = positionByMarketId.get(market.marketId)?.state;
    const allocation = position?.supplyAssets ?? cap.allocation;
    // A curator can leave a cap configured on a market the vault has not allocated to. Whisk
    // omitted those, and the allocation breakdown table renders every row it is given, so drop
    // them here to keep the table showing only markets the vault is actually in.
    if (toBigInt(allocation) === 0n) return [];
    return [
      {
        allocation: toAmount(allocation, decimals, position?.supplyAssetsUsd ?? usdOf(allocation, decimals, priceUsd)),
        absoluteCap: toAmount(cap.absoluteCap, decimals, usdOf(cap.absoluteCap, decimals, priceUsd)),
        relativeCap: toRatio(cap.relativeCap),
        market: toMarketInfo(market),
      },
    ];
  });
}

/**
 * Whisk served one `allocations[]` list with an inline `adapterCap`; Morpho splits it into an
 * `adapters` list and a `caps` list. This joins them back on the cap's `adapterAddress`, filtering
 * cap types client-side (the paginated `caps` field takes no type argument).
 */
function joinVaultV2Allocations(
  vault: MorphoVaultV2DetailsFragmentFragment,
  decimals: number,
  priceUsd: number | null,
): VaultV2Allocation[] {
  const caps = vault.caps.items ?? [];
  warnIfTruncated("vault V2 caps", vault.caps.pageInfo);
  warnIfTruncated("vault V2 adapters", vault.adapters.pageInfo);

  const adapterCapByAddress = new Map<string, RawV2Cap>();
  const marketCapsByAdapter = new Map<string, RawV2Cap[]>();

  for (const cap of caps) {
    const data = cap.data;
    if (cap.type === "Adapter" && data?.__typename === "AdapterCapData") {
      adapterCapByAddress.set(data.adapterAddress.toLowerCase(), cap);
    } else if (cap.type === "MarketV1" && data?.__typename === "MarketV1CapData") {
      const key = data.adapterAddress.toLowerCase();
      marketCapsByAdapter.set(key, [...(marketCapsByAdapter.get(key) ?? []), cap]);
    }
  }

  return (vault.adapters.items ?? []).map((adapter): VaultV2Allocation => {
    const key = adapter.address.toLowerCase();
    const base = {
      adapterAddress: getAddress(adapter.address),
      adapterCap: toAdapterCap(adapterCapByAddress.get(key), adapter, decimals, priceUsd),
    };

    return matchVaultV2Adapter<typeof adapter, VaultV2Allocation>(adapter, {
      metaMorpho: (metaMorphoAdapter) => {
        const underlying = toUnderlyingMorphoVaultV1(metaMorphoAdapter.metaMorpho);
        return { ...base, __typename: "Erc4626VaultAdapter", name: underlying.name, vault: underlying };
      },
      marketV1: (marketAdapter) => {
        warnIfTruncated("vault V2 adapter positions", marketAdapter.positions.pageInfo);
        const positionByMarketId = new Map(
          (marketAdapter.positions.items ?? []).map((position) => [position.market.marketId, position]),
        );
        return {
          ...base,
          __typename: "MarketV1Adapter",
          name: "Morpho Market Adapter",
          marketCaps: toMarketCaps(marketCapsByAdapter.get(key) ?? [], positionByMarketId, decimals, priceUsd),
        };
      },
      // The API exposes no handle on the underlying vault V2, so there is no breakdown to expand.
      // Rendered as an adapter row with no nested allocations.
      vaultV2: () => ({ ...base, __typename: "Erc4626VaultAdapter", name: "Morpho Vault V2 Adapter", vault: null }),
      // Same shape as the vault V2 row: an adapter the app cannot expand still holds assets, so it
      // belongs in the breakdown rather than vanishing from a table whose shares should total 100%.
      unknown: () => ({ ...base, __typename: "Erc4626VaultAdapter", name: "Vault Adapter", vault: null }),
    });
  });
}

function toVaultV2CollateralAllocations(
  vault: MorphoVaultV2CollateralFragmentFragment,
  decimals: number,
): VaultV2CollateralAllocation[] {
  warnIfTruncated("vault V2 adapters", vault.adapters.pageInfo);

  return (vault.adapters.items ?? []).map((adapter): VaultV2CollateralAllocation => {
    const adapterCap = { allocation: { formatted: formatUnits(toBigInt(adapter.assets), decimals) } };

    return matchVaultV2Adapter<typeof adapter, VaultV2CollateralAllocation>(adapter, {
      metaMorpho: (metaMorphoAdapter) => {
        const state = metaMorphoAdapter.metaMorpho.state;
        const underlyingDecimals = Math.round(metaMorphoAdapter.metaMorpho.asset.decimals);

        return {
          __typename: "Erc4626VaultAdapter",
          adapterCap,
          vault: {
            __typename: "MorphoVault",
            totalAssets: { formatted: formatUnits(toBigInt(state?.totalAssets), underlyingDecimals) },
            marketAllocations: toVaultCollateralAllocations(
              state?.allocation ?? [],
              state?.totalAssets,
              underlyingDecimals,
            ),
          },
        };
      },
      marketV1: () => ({ __typename: "MarketV1Adapter", adapterCap }),
      // Same classification as the detail path: no handle on the underlying vault V2, so the row
      // carries no nested allocations.
      vaultV2: () => ({ __typename: "Erc4626VaultAdapter", adapterCap, vault: null }),
      unknown: () => ({ __typename: "Erc4626VaultAdapter", adapterCap, vault: null }),
    });
  });
}

type MorphoVaultV2Base = Omit<Adapted<MorphoVaultV2Summary>, "allocations">;

function toMorphoVaultV2Base(vault: MorphoVaultV2SummaryFragmentFragment): MorphoVaultV2Base {
  const asset = toTokenInfo(vault.asset);
  const curator = vault.curators.items?.[0];

  return {
    __typename: "MorphoVaultV2",
    chain: toChainInfo(vault.chain),
    vaultAddress: getAddress(vault.address),
    name: vault.name,
    asset: { ...asset, priceUsd: priceOf(vault.asset) },
    totalAssets: toAmount(vault.totalAssets, asset.decimals, vault.totalAssetsUsd),
    apy: assembleApy({
      netApy: vault.avgNetApy,
      apyExcludingRewards: vault.avgNetApyExcludingRewards,
      rewards: toRewardApys(vault.rewards, "supply"),
    }),
    metadata: {
      description: vault.metadata?.description ?? null,
      curator: toCuratorInfo(curator),
    },
    curatorAum: curator?.state?.aum,
  };
}

export function toMorphoVaultV2Summary(
  vault: MorphoVaultV2SummaryFragmentFragment & MorphoVaultV2CollateralFragmentFragment,
): Adapted<MorphoVaultV2Summary> {
  const decimals = Math.round(vault.asset.decimals);
  return {
    ...toMorphoVaultV2Base(vault),
    totalAssets: currentV2TotalAssets(vault, decimals, priceOf(vault.asset)),
    allocations: toVaultV2CollateralAllocations(vault, decimals),
  };
}

/**
 * `VaultV2.totalAssets` is not virtually accrued, while the adapter assets are — dividing one by
 * the other makes the breakdown percentages drift after accrual. When the adapter page is complete
 * the current total is the accrued adapter assets plus the vault's idle assets; on a truncated
 * page the sum would undercount, so the API total is kept instead.
 */
function currentV2TotalAssets(
  vault: {
    adapters: {
      pageInfo?: { count: number; countTotal: number } | null;
      items?: readonly { assets: BigIntish }[] | null;
    };
    idleAssets: BigIntish;
    totalAssets?: BigIntish | null;
    totalAssetsUsd?: number | null;
  },
  decimals: number,
  priceUsd: number | null,
) {
  const pageInfo = vault.adapters.pageInfo;
  if (!pageInfo || pageInfo.countTotal > pageInfo.count) {
    return toAmount(vault.totalAssets, decimals, vault.totalAssetsUsd);
  }
  const raw = (vault.adapters.items ?? []).reduce(
    (acc, adapter) => acc + toBigInt(adapter.assets),
    toBigInt(vault.idleAssets),
  );
  return toAmount(raw, decimals, usdOf(raw, decimals, priceUsd) ?? vault.totalAssetsUsd);
}

export function toMorphoVaultV2Details(
  vault: MorphoVaultV2SummaryFragmentFragment & MorphoVaultV2DetailsFragmentFragment,
): Adapted<Omit<MorphoVaultV2, "historical">> {
  const decimals = Math.round(vault.asset.decimals);
  const priceUsd = priceOf(vault.asset);

  return {
    ...toMorphoVaultV2Base(vault),
    totalAssets: currentV2TotalAssets(vault, decimals, priceUsd),
    apyAverages: toApyAverages(vault),
    allocations: joinVaultV2Allocations(vault, decimals, priceUsd),
    curatorAddress: getAddress(vault.curator.address),
    sentinelAddresses: vault.sentinels.map((entry) => getAddress(entry.sentinel.address)),
    // Unitless fractions; the UI formats them as percentages.
    performanceFee: { formatted: String(vault.performanceFee) },
    managementFee: { formatted: String(vault.managementFee) },
  };
}

/* -------------------------------------------------------------------------------------------- */
/* Charts                                                                                         */
/* -------------------------------------------------------------------------------------------- */

interface VaultHistorySeries {
  totalAssets: readonly { x: number; y: BigIntish | null }[];
  totalAssetsUsd: readonly DataPoint[];
  /**
   * Net (post-fee, rewards-inclusive) APY series, keyed by the window it was requested for. A
   * protocol that serves every window natively fills all four; one that fetches only the configured
   * window fills that key alone.
   */
  netApy: Partial<Record<"6h" | "1d" | "7d" | "30d", readonly DataPoint[]>>;
}

/**
 * Morpho returns one `[{x, y}]` series per metric; the chart wants bucket rows. Only the configured
 * `apyWindow` is plotted, so exactly that series is carried through — previously one series was
 * fanned across four window-named fields, which labelled a 24h-smoothed vault V2 series as 30d and
 * quadrupled the payload. Each protocol files its series under the window it was requested for, so
 * this is a direct lookup; a window the upstream served nothing for plots as an empty series.
 *
 * A null sample stays null: the chart connects across gaps, whereas coercing to 0 would draw a
 * spurious drop to 0%.
 */
export function toVaultHistoricalEntries(series: VaultHistorySeries, decimals: number): VaultHistoricalEntry[] {
  const netApy = series.netApy[APP_CONFIG.apyWindow] ?? [];

  return zipTimeseries(
    {
      assets: descaleSeries(series.totalAssets, decimals),
      assetsUsd: series.totalAssetsUsd,
      netApy,
    },
    (bucketTimestamp, values) => ({
      bucketTimestamp,
      totalSupplied: { formatted: numberToString(values.assets ?? 0), usd: values.assetsUsd },
      netApy: { total: values.netApy },
    }),
  );
}
