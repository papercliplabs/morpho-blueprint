import type { DataRange } from "@/common/utils/chart-ranges";
import { ButtonSelector } from "../ui/button-selector/button-selector";

// Re-exported so the chart components keep importing the range type from the chart layer, while
// `chart-ranges.ts` stays the single place a range is declared.
export type { DataRange };

type Props = {
  range: DataRange;
  setRange: (range: DataRange) => void;
  availableRanges: DataRange[];
};

export function DateSelector(props: Props) {
  const { range, setRange, availableRanges } = props;

  const options: DataRange[] = availableRanges;

  if (options.length === 0) return null;

  return <ButtonSelector options={options} selected={range} setSelected={setRange} />;
}
