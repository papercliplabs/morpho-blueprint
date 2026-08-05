import type { Address } from "viem";

/**
 * App-owned data-layer types.
 *
 * The server data functions map Morpho API responses into these shapes, so components, hooks and
 * the transaction layer never see a generated GraphQL type. Keeping these stable is what makes the
 * backend swappable: only the data-function bodies change when the upstream does.
 */

export interface TokenInfo {
  address: Address;
  symbol: string;
  name: string;
  decimals: number;
  /** `Asset.logoURI`. Null until the token is curated in morpho-blue-api-metadata. */
  icon: string | null;
  /** Derived from `Asset.tags`, used to group assets in the filter dropdowns. */
  category: string | null;
}

export interface ChainInfo {
  id: number;
  name: string;
  /** From the Morpho CDN, which does not cover every chain. See `getChainIconUrl`. */
  icon: string | null;
}

export interface CuratorInfo {
  name: string;
  image: string | null;
  url: string | null;
}

/**
 * A token amount in the three denominations the UI needs.
 * `raw` is the on-chain integer, `formatted` the decimal string, `usd` the display value.
 */
export interface Amount {
  raw: string;
  formatted: string;
  usd: number | null;
}

/** A unitless WAD-scaled ratio (LLTV, LTV, relative caps). `formatted` is the [0, 1] fraction. */
export interface Ratio {
  raw: string;
  formatted: string;
}

export interface RewardApy {
  asset: TokenInfo;
  apr: number;
}

/**
 * Both figures are net of fees and served directly by the API over the configured window; no gross
 * rate is reconstructed anywhere (see `assembleApy`).
 *
 * `rewards` itemises the *current* per-token APRs — the API serves no windowed breakdown — so the
 * rows are on a shorter clock than `afterFees`/`total` and are not guaranteed to close the gap
 * between them exactly.
 */
export interface Apy {
  /** Yield after performance and management fees, excluding external rewards. */
  afterFees: number;
  /** `afterFees` plus the windowed rewards contribution. */
  total: number;
  rewards: RewardApy[];
}

/**
 * Realized net APY over each fixed lookback the API serves, one per chart range.
 *
 * These come from share-price evolution over the whole window, which is what a depositor actually
 * earned. Averaging the plotted points instead would estimate the same thing from a handful of
 * samples of a 6h rate, and inherit every sampling artefact in the series.
 *
 * Null when the vault is younger than the lookback.
 */
export interface ApyAverages {
  sevenDays: number | null;
  thirtyDays: number | null;
  ninetyDays: number | null;
  inception: number | null;
}
