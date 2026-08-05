import { type ChartResolution, DAY, maxDurationSeconds } from "@/common/utils/chart-ranges";
import type { BigIntish } from "@/morpho-types";

export interface DataPoint {
  x: number;
  y: number | null;
}

export interface BigIntDataPoint {
  x: number;
  y: BigIntish | null;
}

/**
 * Slack past the widest window a resolution serves, covering the chart's leading-edge padding.
 * Anything older is filtered out client-side, so over-fetching only inflates the RSC payload —
 * hence a tighter margin on the denser hourly series.
 */
const LOOKBACK_MARGIN_SECONDS: Record<ChartResolution, number> = {
  hourly: 2 * DAY,
  daily: 10 * DAY,
  weekly: 0,
};

/** `undefined` (fetch from inception) for a resolution serving a range with no fixed window. */
function lookbackSeconds(resolution: ChartResolution): number | undefined {
  const widest = maxDurationSeconds(resolution);
  return widest === 0 ? undefined : widest + LOOKBACK_MARGIN_SECONDS[resolution];
}

/**
 * The three chart resolutions the UI offers, and how far back each is fetched. Which ranges a
 * resolution serves — and therefore how far back it has to reach — comes from `CHART_RANGES`, so
 * widening a range in the component layer widens the fetch instead of silently truncating it.
 */
export const HISTORY_RANGES = {
  hourly: { interval: "HOUR", lookbackSeconds: lookbackSeconds("hourly") },
  daily: { interval: "DAY", lookbackSeconds: lookbackSeconds("daily") },
  weekly: { interval: "WEEK", lookbackSeconds: lookbackSeconds("weekly") },
} as const satisfies Record<ChartResolution, { interval: string; lookbackSeconds: number | undefined }>;

export type HistoryRange = ChartResolution;
export const HISTORY_RANGE_KEYS = ["hourly", "daily", "weekly"] as const satisfies readonly HistoryRange[];

export interface HistoryOptions {
  interval: (typeof HISTORY_RANGES)[HistoryRange]["interval"];
  startTimestamp?: number;
}

/**
 * The `options` argument for one chart resolution.
 *
 * History is fetched one request per resolution with the interval passed as a variable, rather than
 * three aliased blocks in a single operation: the API caps an operation at 30 aliases, and the
 * market chart alone needs 12 series per resolution.
 */
export function historyOptions(range: HistoryRange, now = Date.now()): HistoryOptions {
  const { interval, lookbackSeconds } = HISTORY_RANGES[range];
  return lookbackSeconds === undefined
    ? { interval }
    : { interval, startTimestamp: Math.floor(now / 1000) - lookbackSeconds };
}

type SeriesMap = Record<string, readonly DataPoint[]>;
type ZippedValues<S extends SeriesMap> = { [K in keyof S]: number | null };

/**
 * Morpho returns one `[{x, y}]` series per metric; Whisk returned bucket rows with every metric
 * inline. This joins the series back into rows keyed on `x`.
 *
 * Series are not guaranteed to share timestamps (a metric can carry an extra "now" point, or start
 * later), and come back newest-first. Rows are emitted oldest-first over the union of timestamps,
 * carrying each series' last known value forward; leading rows where a series has no value yet are
 * dropped so no row is invented from nothing.
 */
export function zipTimeseries<S extends SeriesMap, T>(
  series: S,
  buildEntry: (bucketTimestamp: number, values: ZippedValues<S>) => T,
): T[] {
  const keys = Object.keys(series) as (keyof S)[];
  if (keys.length === 0) return [];

  const timestamps = new Set<number>();
  const byTimestamp = new Map<keyof S, Map<number, number | null>>();

  for (const key of keys) {
    const points = new Map<number, number | null>();
    for (const point of series[key] ?? []) {
      timestamps.add(point.x);
      points.set(point.x, point.y);
    }
    byTimestamp.set(key, points);
  }

  // A series the upstream returns entirely empty must not gate emission. Its key would never enter
  // `lastKnown`, so the leading-row trim below would fire on every timestamp and this would return
  // `[]` — no chart at all, rather than a chart missing one metric. Only series that actually carry
  // points participate in the trim; an empty one contributes `null` to every row, which the chart
  // renders as a gap. This is reachable: an idle market serves no `collateralAssetsUsd`, and a vault
  // younger than the window serves no `monthlyNetApy`.
  const gatingKeys = keys.filter((key) => (byTimestamp.get(key)?.size ?? 0) > 0);
  if (gatingKeys.length === 0) return [];

  const sortedTimestamps = Array.from(timestamps).sort((a, b) => a - b);
  const lastKnown = new Map<keyof S, number | null>();
  const entries: T[] = [];

  for (const timestamp of sortedTimestamps) {
    for (const key of keys) {
      const value = byTimestamp.get(key)?.get(timestamp);
      if (value !== undefined) lastKnown.set(key, value);
    }

    // Skip leading rows: a series that has points has not reached its first one yet.
    if (gatingKeys.some((key) => !lastKnown.has(key))) continue;

    const values = {} as ZippedValues<S>;
    for (const key of keys) {
      values[key] = lastKnown.get(key) ?? null;
    }
    entries.push(buildEntry(timestamp, values));
  }

  return entries;
}

/** `BigIntDataPoint` series carry BigInt strings; descale them to plain numbers up front. */
export function descaleSeries(points: readonly BigIntDataPoint[], decimals: number): DataPoint[] {
  const scale = 10 ** Math.round(decimals);
  return points.map(({ x, y }) => ({ x, y: y == null ? null : Number(y) / scale }));
}
