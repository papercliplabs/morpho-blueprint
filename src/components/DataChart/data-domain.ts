import type { DataRange } from "./DateSelector";
import type { DataEntry } from "./types";

const HOUR = 60 * 60;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;

const RANGE_DURATION: Record<DataRange, number> = {
  "1W": WEEK,
  "1M": 30 * DAY,
  "6M": 26 * WEEK,
  All: 0,
} as const;

export function prepareChartDataWithDomain<D extends DataEntry>(
  data: D[],
  range: DataRange,
  field: keyof D[Exclude<keyof D, "bucketTimestamp">],
): D[] {
  const now = Math.floor(Date.now() / 1000);

  if (!data.length || !data[0]) return [];
  if (range === "All") return data;

  const minX = now - RANGE_DURATION[range];
  const maxX = data[data.length - 1]!.bucketTimestamp;

  if (maxX < minX) return [];

  return createPaddedData(
    data.filter((d) => d.bucketTimestamp >= minX),
    minX,
    field,
  );
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
