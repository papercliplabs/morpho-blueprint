import type { Market } from "@/data/whisk/getMarket";
import type { DataRange } from "./DateSelector";
import type { DataEntry } from "./types";

const HOUR = 60 * 60;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;

export const NO_DATA_POINT_THRESHOLD = 10; // Need at least this many data points to show a nice chart

const RANGE_DURATION: Record<DataRange, number> = {
  "1W": WEEK,
  "1M": 30 * DAY,
  "6M": 26 * WEEK,
  All: 0,
} as const;

export function parseInitialRange(data: Market["historical"]): DataRange | undefined {
  if (!data) return;

  // Determine which ranges are even selectable (mirrors DateSelector)
  const weekly = data.weekly ?? [];
  const fullDomain = weekly.length > 1 ? weekly[weekly.length - 1]!.bucketTimestamp - weekly[0]!.bucketTimestamp : 0;

  const selectableRanges: DataRange[] = [];
  if (fullDomain >= WEEK) selectableRanges.push("1W");
  if (fullDomain >= WEEK) selectableRanges.push("1M");
  if (fullDomain >= 30 * DAY) selectableRanges.push("6M");
  if (fullDomain >= 6 * 30 * DAY) selectableRanges.push("All");

  // Try ranges from smallest to largest and pick the first with enough points
  for (const range of selectableRanges) {
    const series = range === "All" ? data.weekly : range === "6M" || range === "1M" ? data.daily : data.hourly;

    const length = estimatePreparedLength(series, range);
    if (length > NO_DATA_POINT_THRESHOLD) return range;
  }
}

export function prepareChartDataWithDomain<D extends DataEntry>(
  data: D[],
  range: DataRange,
  field: keyof D[Exclude<keyof D, "bucketTimestamp">],
): D[] {
  if (!data.length || !data[0]) return [];
  if (range === "All") return data;

  const minX = getMinX(data, range);
  const maxX = data[data.length - 1]!.bucketTimestamp;

  if (maxX < minX) return [];

  const paddedData = createPaddedData(
    data.filter((d) => d.bucketTimestamp >= minX),
    minX,
    field,
  );

  return paddedData.slice(1); // Always drop the first point to avoid injecting 0 where time is close (delta between fetch and now)
}

function createPaddedData<D extends DataEntry>(
  data: D[],
  minX: number,
  field: keyof D[Exclude<keyof D, "bucketTimestamp">],
): D[] {
  if (!data.length || !data[0] || data[0].bucketTimestamp <= minX) return data;

  const interval = calculateDataInterval(data) || DAY;

  const padding: D[] = [];
  for (let time = minX; time < data[0].bucketTimestamp; time += interval) {
    padding.push(createEmptyPoint(data[0], time, field));
  }

  return [...padding, ...data];
}

function calculateDataInterval<D extends DataEntry>(data: D[]): number | null {
  if (data.length < 2) return null;

  const intervals = data
    .slice(0, Math.min(10, data.length - 1))
    .map((point, i) => data[i + 1]!.bucketTimestamp - point.bucketTimestamp)
    .filter((interval) => interval > 0)
    .sort((a, b) => a - b);

  return intervals[Math.floor(intervals.length / 2)] || null;
}

function createEmptyPoint<D extends DataEntry>(
  template: D,
  timestamp: number,
  field: keyof D[Exclude<keyof D, "bucketTimestamp">],
): D {
  const point = structuredClone(template);
  point.bucketTimestamp = timestamp;

  for (const key in point) {
    if (key !== "bucketTimestamp" && typeof point[key] === "object" && point[key] !== null) {
      const obj = point[key] as Record<string, unknown>;
      if (field in obj) {
        obj[field as string] = 0;
      }
    }
  }

  return point;
}

export function getMinX<D extends DataEntry>(data: D[], range: DataRange) {
  if (!data.length || !data[0]) return 0;

  if (range === "All") return data[0].bucketTimestamp;

  const now = Math.floor(Date.now() / 1000);
  const minX = now - RANGE_DURATION[range];
  return minX;
}

// Estimate the number of points produced by prepareChartDataWithDomain for the given range.
function estimatePreparedLength<D extends DataEntry>(data: D[] | undefined, range: DataRange): number {
  if (!data || !data.length || !data[0]) return 0;
  if (range === "All") return data.length;

  const minX = getMinX(data, range);
  const maxX = data[data.length - 1]!.bucketTimestamp;
  if (maxX < minX) return 0;

  const filtered = data.filter((d) => d.bucketTimestamp >= minX);
  if (!filtered.length) return 0;

  const interval = calculateDataInterval(filtered) || DAY;
  const delta = Math.max(0, filtered[0]!.bucketTimestamp - minX);
  const paddingCount = Math.ceil(delta / interval);

  // prepareChartDataWithDomain pads then slices off the first point
  return Math.max(0, paddingCount + filtered.length - 1);
}
