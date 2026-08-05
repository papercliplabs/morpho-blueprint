import type { Address, Hex } from "viem";
import type { Amount, Apy, ApyAverages, ChainInfo, CuratorInfo, Ratio, TokenInfo } from "@/common/data/types";
import type { SupportedChainId } from "@/config/types";
import type { Erc4626VaultProtocol } from "@/config/vault-protocol";
import type { MarketInfo } from "@/modules/market/market.types";

export interface VaultIdentifier {
  chainId: SupportedChainId;
  vaultAddress: Address;
  protocol: Erc4626VaultProtocol;
}

export interface VaultMetadata {
  description: string | null;
  curator: CuratorInfo | null;
}

/* -------------------------------------------------------------------------------------------- */
/* Vault V1 (MetaMorpho) market allocations                                                       */
/* -------------------------------------------------------------------------------------------- */

export interface VaultMarketAllocation {
  /** Derived: a market is enabled when its supply cap is non-zero. */
  enabled: boolean;
  /** This market's share of the vault's total assets, in [0, 1]. */
  vaultSupplyShare: number;
  position: { supplyAmount: Amount; supplyShares: string };
  supplyCap: Amount;
  market: MarketInfo;
}

/** The trimmed allocation shape the earn-table exposure tooltip needs. */
export interface VaultCollateralAllocation {
  enabled: boolean;
  vaultSupplyShare: number;
  position: { supplyAmount: { usd: number | null } };
  market: { collateralAsset: { icon: string | null; name: string; symbol: string } | null };
}

/* -------------------------------------------------------------------------------------------- */
/* Vault V2 adapters + caps                                                                       */
/* -------------------------------------------------------------------------------------------- */

export interface VaultV2AdapterCap {
  allocation: Amount;
  relativeCap: Ratio;
  absoluteCap: Amount;
}

export interface VaultV2MarketCap {
  allocation: Amount;
  absoluteCap: Amount;
  relativeCap: Ratio;
  market: MarketInfo;
}

/** A vault V1 held through a `MetaMorphoAdapter`, expanded under its adapter row. */
export interface UnderlyingMorphoVaultV1 {
  __typename: "MorphoVault";
  vaultAddress: Address;
  name: string;
  chain: ChainInfo;
  asset: TokenInfo;
  apy: Apy;
  totalAssets: Amount;
  marketAllocations: VaultMarketAllocation[];
}

interface VaultV2AllocationBase {
  /** Composed from the adapter type plus the underlying vault or market. */
  name: string;
  adapterAddress: Address;
  adapterCap: VaultV2AdapterCap | null;
}

export interface Erc4626VaultAdapter extends VaultV2AllocationBase {
  __typename: "Erc4626VaultAdapter";
  vault: UnderlyingMorphoVaultV1 | null;
}

export interface MarketV1Adapter extends VaultV2AllocationBase {
  __typename: "MarketV1Adapter";
  marketCaps: VaultV2MarketCap[];
}

export type VaultV2Allocation = Erc4626VaultAdapter | MarketV1Adapter;

/** Summary-only counterparts, carrying just what the exposure tooltip reads. */
export type VaultV2CollateralAllocation =
  | {
      __typename: "Erc4626VaultAdapter";
      adapterCap: { allocation: { formatted: string } } | null;
      vault: {
        __typename: "MorphoVault";
        totalAssets: { formatted: string };
        marketAllocations: VaultCollateralAllocation[];
      } | null;
    }
  | {
      __typename: "MarketV1Adapter";
      adapterCap: { allocation: { formatted: string } } | null;
    };

/* -------------------------------------------------------------------------------------------- */
/* Charts                                                                                         */
/* -------------------------------------------------------------------------------------------- */

/**
 * `netApy.total` is the net (post-fee, rewards-inclusive) APY over `APP_CONFIG.apyWindow`. The
 * window is a global config value rather than a per-entry dimension, so a single series is carried
 * and `rateLabel()` stamps the window on the chart label. Null where the upstream series has no
 * sample at the bucket — the chart connects across those gaps.
 */
export interface VaultHistoricalEntry {
  bucketTimestamp: number;
  totalSupplied: { formatted: string; usd: number | null };
  netApy: { total: number | null };
}

export interface VaultHistoricalData {
  hourly: VaultHistoricalEntry[];
  daily: VaultHistoricalEntry[];
  weekly: VaultHistoricalEntry[];
}

/* -------------------------------------------------------------------------------------------- */
/* Vault summaries (earn table + vault header)                                                    */
/* -------------------------------------------------------------------------------------------- */

interface VaultSummaryBase {
  chain: ChainInfo;
  vaultAddress: Address;
  name: string;
  asset: TokenInfo & { priceUsd: number | null };
  totalAssets: Amount;
  apy: Apy;
  metadata: VaultMetadata | null;
  /** Config-driven: hidden vaults still count towards TVL and stay reachable by URL. */
  isHidden: boolean;
  /** `Curator.state.aum` — assets under curation across all of the curator's vaults. */
  curatorAum?: number;
}

export interface MorphoVaultV1Summary extends VaultSummaryBase {
  __typename: "MorphoVault";
  marketAllocations: VaultCollateralAllocation[];
}

export interface MorphoVaultV2Summary extends VaultSummaryBase {
  __typename: "MorphoVaultV2";
  allocations: VaultV2CollateralAllocation[];
}

export type VaultSummary = MorphoVaultV1Summary | MorphoVaultV2Summary;

/* -------------------------------------------------------------------------------------------- */
/* Vault details (vault page)                                                                     */
/* -------------------------------------------------------------------------------------------- */

interface VaultDetailBase extends Omit<VaultSummaryBase, "chain"> {
  chain: ChainInfo & { id: SupportedChainId };
  historical: VaultHistoricalData | null;
  /** One realized average per chart range; the chart's reference line reads these. */
  apyAverages: ApyAverages;
}

export interface MorphoVaultV1 extends VaultDetailBase {
  __typename: "MorphoVault";
  totalLiquidity: { usd: number | null };
  /** Performance fee as a unitless fraction. */
  performanceFeeRaw: number;
  feeRecipientAddress: Address | null;
  ownerAddress: Address;
  curatorAddress: Address;
  guardianAddress: Address;
  marketAllocations: VaultMarketAllocation[];
}

export interface MorphoVaultV2 extends VaultDetailBase {
  __typename: "MorphoVaultV2";
  allocations: VaultV2Allocation[];
  curatorAddress: Address;
  sentinelAddresses: Address[];
  performanceFee: { formatted: string };
  managementFee: { formatted: string };
}

export type Vault = MorphoVaultV1 | MorphoVaultV2;

/* -------------------------------------------------------------------------------------------- */
/* Positions                                                                                      */
/* -------------------------------------------------------------------------------------------- */

export interface VaultPosition {
  vault: {
    chain: { id: SupportedChainId };
    asset: { priceUsd: number | null };
    vaultAddress: Address;
  };
  assets: Amount;
  /** Joined in from an RPC multicall: no Morpho API exposes wallet ERC-20 balances. */
  walletAssetHolding: { balance: Amount } | null;
}

/** ChainId -> VaultAddress -> VaultPosition */
export type VaultPositionMap = Record<SupportedChainId, Record<Hex, VaultPosition>>;
