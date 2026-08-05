import type { ApyAverages } from "@/common/data/types";

export const HOUR = 60 * 60;
export const DAY = 24 * HOUR;
export const WEEK = 7 * DAY;

/** The three resolutions history is fetched at; also the keys of `HistoricalData`. */
export type ChartResolution = "hourly" | "daily" | "weekly";

/** The ranges the chart's date selector offers. */
export type DataRange = "1W" | "1M" | "3M" | "All";

interface ChartRange {
  /** Which fetched series serves this range. */
  resolution: ChartResolution;
  /** Plotted window in seconds. `All` plots the full domain, so it fixes no window. */
  durationSeconds: number;
  /** `ApyAverages` field holding the API-computed realized average for this range. */
  apyAverageKey: keyof ApyAverages;
}

/**
 * Single source of truth for everything a chart range implies. It used to be spread across three
 * layers with nothing linking them — the server lookbacks in `data/adapters/timeseries.ts`, the
 * client domain in `DataChart/data-domain.ts` and the APY-average mapping in the vault chart — so
 * widening a range in one place silently truncated the chart in another.
 *
 * Adding a range here is a compile error everywhere it has to be accounted for.
 */
export const CHART_RANGES: Record<DataRange, ChartRange> = {
  "1W": { resolution: "hourly", durationSeconds: WEEK, apyAverageKey: "sevenDays" },
  "1M": { resolution: "daily", durationSeconds: 30 * DAY, apyAverageKey: "thirtyDays" },
  "3M": { resolution: "daily", durationSeconds: 90 * DAY, apyAverageKey: "ninetyDays" },
  All: { resolution: "weekly", durationSeconds: 0, apyAverageKey: "inception" },
};

export const DATA_RANGES = Object.keys(CHART_RANGES) as DataRange[];

/**
 * Widest window any range served by `resolution` plots, in seconds. Returns 0 when the resolution
 * only serves `All`, which has no fixed window and is therefore fetched from inception.
 */
export function maxDurationSeconds(resolution: ChartResolution): number {
  const durations = DATA_RANGES.filter((range) => CHART_RANGES[range].resolution === resolution).map(
    (range) => CHART_RANGES[range].durationSeconds,
  );
  return Math.max(0, ...durations);
}
