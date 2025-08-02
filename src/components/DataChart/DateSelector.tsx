import { SECONDS_PER_MONTH, SECONDS_PER_WEEK } from "../../utils/contants";
import { ButtonSelector } from "../ui/button-selector/button-selector";
import type { DataEntry, HistoricalData } from "./types";

export type DataRange = "1W" | "1M" | "6M" | "All";

type Props = {
  range: DataRange;
  setRange: (range: DataRange) => void;
  fullDomain: number;
};

export const periods: Record<DataRange, keyof HistoricalData<DataEntry>> = {
  "1W": "hourly",
  "1M": "daily",
  "6M": "daily",
  All: "weekly",
} as const;

export function DateSelector(props: Props) {
  const { range, setRange, fullDomain } = props;

  const options: DataRange[] = [];

  if (fullDomain >= SECONDS_PER_WEEK) options.push("1W");
  if (fullDomain >= SECONDS_PER_WEEK) options.push("1M");
  if (fullDomain >= SECONDS_PER_MONTH) options.push("6M");
  if (fullDomain >= 6 * SECONDS_PER_MONTH) options.push("All");

  if (options.length === 0) return null;

  return <ButtonSelector options={options} selected={range} setSelected={setRange} />;
}
