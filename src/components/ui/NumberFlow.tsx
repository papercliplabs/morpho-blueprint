import NumberFlowReact from "@number-flow/react";
import { ComponentProps } from "react";

import { cn } from "@/utils/shadcn";

const MAX_USD_VALUE = 1e12;

export default function NumberFlow({
  value,
  format,
  className,
  ...props
}: { value: number } & ComponentProps<typeof NumberFlowReact>) {
  const currency = format?.currency;
  const isPercent = format?.style === "percent";
  const {
    notation = "compact",
    minimumFractionDigits = isPercent ? 0 : 2,
    maximumFractionDigits = value < 1 && currency !== "USD" && !isPercent ? 3 : 2,
    ...restOptions
  } = format ?? {};

  const displayValue = format?.style == "percent" ? value * 100 : value;
  const formatOptions: typeof format = {
    notation: notation == "compact" && (displayValue > 9999 || displayValue < -9999) ? "compact" : "standard",
    minimumFractionDigits,
    maximumFractionDigits,
    ...restOptions,
  };
  let prefix = currency === "USD" ? "$" : currency === "ETH" ? "Ξ" : "";

  // Clamp to max USD value
  if (currency === "USD" && value > MAX_USD_VALUE) {
    value = MAX_USD_VALUE;
    prefix = ">" + prefix;
  }

  const minValue = Math.pow(10, -maximumFractionDigits);
  if (value !== 0 && Math.abs(displayValue) < minValue) {
    const neg = value < 0;
    prefix = neg ? ">" : "<" + prefix;
    value = minValue * Math.pow(10, format?.style === "percent" ? -2 : 0) * (neg ? -1 : 1);
  }

  return (
    <span className={cn("inline-flex items-center", className)}>
      {prefix}
      <NumberFlowReact value={value} format={formatOptions} {...props} className="inline-flex items-center" />
    </span>
  );
}
