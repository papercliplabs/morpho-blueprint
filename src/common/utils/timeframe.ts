import { APP_CONFIG } from "@/config";
import type { ApyWindow } from "@/config/types";

/**
 * App-owned mapping from the configured APY window onto the API's lookback vocabulary.
 * The `VaultV1LookbackPeriod` and `VaultV2LookbackPeriod` enums share these members.
 */
const APY_LOOKBACK_PERIOD = {
  "1d": "ONE_DAY",
  "7d": "SEVEN_DAYS",
  "30d": "THIRTY_DAYS",
} as const satisfies Record<ApyWindow, string>;

export type ApyLookbackPeriod = (typeof APY_LOOKBACK_PERIOD)[ApyWindow];

/** Lookback for current-state vault APYs (`avgNetApy`, `avgNetApyExcludingRewards`). */
export const apyLookbackPeriod: ApyLookbackPeriod = APY_LOOKBACK_PERIOD[APP_CONFIG.apyWindow];

/**
 * Stamps the configured averaging window onto a rate label, so a quoted number is never ambiguous
 * about its timeframe — e.g. `Net APY (7d)`.
 *
 * Only for rates actually averaged over `APP_CONFIG.apyWindow`. Rates that are instantaneous by
 * construction (the IRM curve, per-token reward APRs) must not use this.
 */
export function rateLabel(base: string): string {
  return `${base} (${APP_CONFIG.apyWindow})`;
}

const APY_WINDOW_HOURS = {
  "1d": 24,
  "7d": 24 * 7,
  "30d": 24 * 30,
} as const satisfies Record<ApyWindow, number>;

/**
 * `VaultV2History.avgApy/avgNetApy` cap each plotted point's smoothing window at 24h, so a vault V2
 * chart configured with a 7d or 30d `apyWindow` is smoothed over 24h instead. Headline (current
 * state) numbers are unaffected: all windows are served natively there. Vault V1 charts have
 * native daily/weekly/monthly series and are unaffected.
 */
export const VAULT_V2_HISTORY_MAX_LOOKBACK_HOURS = 24;

export const vaultV2HistoryLookbackHours = Math.min(
  APY_WINDOW_HOURS[APP_CONFIG.apyWindow],
  VAULT_V2_HISTORY_MAX_LOOKBACK_HOURS,
);

/**
 * The window a plotted vault V2 series is *actually* smoothed over: the configured one, capped at
 * 24h by the API. Labelling that series with `APP_CONFIG.apyWindow` would claim a 7d/30d smoothing
 * the points do not have, while the headline number next to it genuinely uses the configured
 * window — two differently smoothed figures under one label.
 *
 * 24h is exactly the `1d` window, so the cap is expressible in the same vocabulary. Vault V1 serves
 * every window natively and is unaffected.
 */
export const vaultV2HistoryApyWindow: ApyWindow =
  APY_WINDOW_HOURS[APP_CONFIG.apyWindow] > VAULT_V2_HISTORY_MAX_LOOKBACK_HOURS ? "1d" : APP_CONFIG.apyWindow;
