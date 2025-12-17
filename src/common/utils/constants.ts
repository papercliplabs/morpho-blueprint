export const SECONDS_PER_HOUR = 3600;
export const SECONDS_PER_DAY = 86400;
export const SECONDS_PER_WEEK = 604800;
export const SECONDS_PER_MONTH = 2592000;

export const DEBOUNCE_TIME_MS = 150;

// When using native assets will leave enough balance to cover this amount of gas
// Note the acutal amount of native assets left is NATIVE_ASSET_GAS_MARGIN * currentGasPrice
// This should be above the gas used by all actions which will use native assets.
export const NATIVE_ASSET_GAS_RESERVE_UNITS = 1_000_000n;

export enum FilterKey {
  Chains = "chains",
  SupplyAssets = "supply-assets",
  CollateralAssets = "collateral-assets",
  LoanAssets = "loan-assets",
  Curators = "curators",
  VaultTags = "vault-tags",
  Account = "account",
}

export const ALL_FILTER_KEYS = Object.values(FilterKey);
