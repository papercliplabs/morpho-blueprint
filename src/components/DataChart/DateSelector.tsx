import { ButtonSelector } from "../ui/button-selector/button-selector";
import type { DataEntry, HistoricalData } from "./types";

export type DataRange = "1W" | "1M" | "6M" | "All";

type Props = {
  range: DataRange;
  setRange: (range: DataRange) => void;
  availableRanges: DataRange[];
};

export const periods: Record<DataRange, keyof HistoricalData<DataEntry>> = {
  "1W": "hourly",
  "1M": "daily",
  "6M": "daily",
  All: "weekly",
} as const;

export function DateSelector(props: Props) {
  const { range, setRange, availableRanges } = props;

  const options: DataRange[] = availableRanges;

  if (options.length === 0) return null;

  return <ButtonSelector options={options} selected={range} setSelected={setRange} />;
}
