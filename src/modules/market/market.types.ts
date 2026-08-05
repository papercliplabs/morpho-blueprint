import type { Address, Hex } from "viem";
import type { Amount, Apy, ChainInfo, CuratorInfo, Ratio, TokenInfo } from "@/common/data/types";
import type { SupportedChainId } from "@/config/types";
import type { Erc4626VaultProtocol } from "@/config/vault-protocol";

export interface MarketIdentifier {
  chainId: SupportedChainId;
  marketId: Hex;
}

/**
 * The four APY windows the UI can be configured to display. Morpho serves market APYs as distinct
 * fields per window (unlike vaults, where the window is a query argument), so all four are fetched
 * and `extractMarketSupplyApy` / `extractMarketBorrowApy` pick the configured one.
 */
export interface MarketSupplyApyWindows {
  supplyApy6h: Apy;
  supplyApy1d: Apy;
  supplyApy7d: Apy;
  supplyApy30d: Apy;
}

export interface MarketBorrowApyWindows {
  borrowApy6h: Apy;
  borrowApy1d: Apy;
  borrowApy7d: Apy;
  borrowApy30d: Apy;
}

/** Market metadata as embedded in vault allocation rows. */
export interface MarketInfo extends MarketSupplyApyWindows {
  marketId: Hex;
  chain: ChainInfo;
  /** Composed from the asset symbols: the API exposes no market name. */
  name: string;
  isIdle: boolean;
  lltv: Ratio;
  collateralAsset: TokenInfo | null;
  loanAsset: TokenInfo;
  totalSupplied: { usd: number | null };
}

export interface MarketSummary extends MarketBorrowApyWindows {
  chain: ChainInfo;
  name: string;
  marketId: Hex;
  totalBorrowed: Amount;
  collateralAsset: TokenInfo | null;
  loanAsset: TokenInfo;
  lltv: Ratio;
  /** Instantaneous borrow APY, kept alongside the windowed variants. */
  borrowApy: Apy;
}

export interface MarketVaultAllocation {
  /**
   * Which vault protocol supplies through this allocation. Action flows must only hand MorphoV1
   * (MetaMorpho) addresses to the public-allocator simulation — vault V2s do not implement the
   * MetaMorpho queue interface and are display-only here.
   */
  protocol: Erc4626VaultProtocol;
  vault: {
    vaultAddress: Address;
    name: string;
    curatorAddress: Address | null;
    asset: TokenInfo;
    chain: ChainInfo;
    metadata: { curator: CuratorInfo | null } | null;
  };
  enabled: boolean;
  position: { supplyAmount: Amount; supplyShares: string };
  supplyCap: Amount;
  marketSupplyShare: number;
}

export interface IrmCurvePoint {
  utilization: number;
  supplyApy: number;
  borrowApy: number;
}

export interface MarketHistoricalEntry {
  bucketTimestamp: number;
  totalSupplied: { formatted: string; usd: number | null };
  totalBorrowed: { formatted: string; usd: number | null };
  totalCollateral: { formatted: string; usd: number | null };
  /** Null where the series has no sample at the bucket (market younger than the window). */
  borrowApy1d: { base: number | null; total: number | null };
  borrowApy7d: { base: number | null; total: number | null };
  borrowApy30d: { base: number | null; total: number | null };
}

export interface Market extends MarketSummary {
  isIdle: boolean;
  totalSupplied: Amount;
  liquidityInMarket: Amount;
  /** Summed from `Market.publicAllocatorSharedLiquidity[].assets`. */
  publicAllocatorSharedLiquidity: Amount;
  collateralAsset: (TokenInfo & { priceUsd: number | null }) | null;
  loanAsset: TokenInfo & { priceUsd: number | null };
  vaultAllocations: MarketVaultAllocation[];
  utilization: number;
  irm: {
    address: Address;
    targetUtilization: number;
    curve: IrmCurvePoint[];
  };
  liquidationPenalty: number;
  oracleAddress: Address | null;
  /** Raw is the oracle price scaled by `36 + loanDecimals - collateralDecimals`. */
  collateralPriceInLoanAsset: { raw: string; formatted: string } | null;
  historical: {
    hourly: MarketHistoricalEntry[];
    daily: MarketHistoricalEntry[];
    weekly: MarketHistoricalEntry[];
  } | null;
}

export type MarketNonIdle = Market & { isIdle: false; collateralAsset: NonNullable<Market["collateralAsset"]> };

export interface MarketPosition {
  market: { chain: { id: number }; marketId: Hex };
  collateralAmount: Amount;
  borrowAmount: Amount;
  ltv: Ratio;
  walletLoanAssetHolding: { balance: Amount } | null;
  walletCollateralAssetHolding: { balance: Amount } | null;
}
