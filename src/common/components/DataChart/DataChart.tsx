"use client";

import { useMemo, useState } from "react";
import { CartesianGrid, ComposedChart, Line, ReferenceLine, XAxis, YAxis } from "recharts";
import { Card } from "@/common/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/common/components/ui/chart";
import { CHART_RANGES, DAY, type DataRange, WEEK } from "@/common/utils/chart-ranges";
import { formatNumber } from "@/common/utils/format";
import { ChartHeader } from "./ChartHeader";
import { CurrencySelector } from "./CurrencySelector";
import { DateSelector } from "./DateSelector";
import { calculateDataInterval, getMinX, NO_DATA_POINT_THRESHOLD, prepareChartDataWithDomain } from "./data-domain";
import { type TabOptions, TabSelector } from "./TabSelector";
import type { DataEntry, HistoricalData } from "./types";
import { useIntervalX } from "./useIntervalX";

interface Props<D extends DataEntry> {
  title: string;
  data: HistoricalData<D>;
  defaultTab: Exclude<keyof D, "bucketTimestamp">;
  tabOptions?: Array<TabOptions<D>>;
}

export function DataChart<D extends DataEntry>(props: Props<D>) {
  const { data: allData, title, defaultTab, tabOptions } = props;

  const { initialRange, availableRanges } = parseDataRanges(allData);

  const [range, setRange] = useState<DataRange>(initialRange ?? "1W");
  const [tab, setTab] = useState<Exclude<keyof D, "bucketTimestamp">>(defaultTab);

  const tabOption = tabOptions?.find((t) => t.key === tab);
  const isTokenAmount = tabOption?.type === "tokenAmount";
  const isApy = tabOption?.type === "apy";

  const [currency, setCurrency] = useState<string | undefined>(
    isTokenAmount ? tabOption.underlyingAssetSymbol : undefined,
  );
  const isUsd = isTokenAmount && currency?.toLowerCase() === "usd";

  const field: keyof D[Exclude<keyof D, "bucketTimestamp">] = useMemo(() => {
    if (isTokenAmount) {
      return (isUsd ? "usd" : "formatted") as keyof D[Exclude<keyof D, "bucketTimestamp">];
    }
    if (isApy) {
      return "total" as keyof D[Exclude<keyof D, "bucketTimestamp">];
    }
    throw new Error(`Invalid data ${tab.toString()}`);
  }, [tab, isTokenAmount, isApy, isUsd]);

  const data = prepareChartDataWithDomain(allData[CHART_RANGES[range].resolution], range, field);
  // Count rows where the selected metric actually has a sample: an all-null series (e.g. an APY
  // window on a market younger than it) must show the insufficient-data state, not a blank chart.
  const hasData =
    data.filter((d) => (d[tab] as Record<string, unknown> | undefined)?.[field as string] != null).length >
    NO_DATA_POINT_THRESHOLD;

  function formatValue(value: number, options: Intl.NumberFormatOptions = {}) {
    return formatNumber(value, {
      ...options,
      style: isApy ? "percent" : "decimal",
      currency: isUsd ? "USD" : undefined,
    });
  }

  const { intervalX } = useIntervalX(data.length);

  const label = tabOption?.title;
  const lastItem = data[data.length - 1];

  const value = isTokenAmount ? tabOption?.[isUsd ? "usdValue" : "underlyingAssetValue"] : tabOption?.totalApy;

  const hasUsdData = isTokenAmount && data.some((d) => (d[tab] as { usd: number | null }).usd !== null);

  const average = isApy ? tabOption.averageApy[range] : null;

  if (!initialRange) {
    return null;
  }

  return (
    <Card>
      <header className="flex min-h-8 items-center justify-between">
        <h6>{title}</h6>
        {hasUsdData && (
          <CurrencySelector
            underlyingAssetSymbol={tabOption.underlyingAssetSymbol}
            currency={currency!}
            setCurrency={setCurrency}
          />
        )}
      </header>

      {tabOptions && tabOptions.length > 1 && (
        <TabSelector tabs={tabOptions} selected={tab} setSelected={setTab} className="mt-4" />
      )}

      <div className="mt-4 rounded-lg border p-4">
        {label && (
          <ChartHeader
            label={label}
            currency={isTokenAmount ? currency : undefined}
            description={tabOption?.description}
            value={formatValue(value || (lastItem?.[tab][field] as number))}
          />
        )}

        <div className="mt-4 h-[160px] w-full">
          {hasData && (
            <ChartContainer config={{ [`${tab.toString()}.${field.toString()}`]: { label } }} className="size-full">
              <ComposedChart data={data} accessibilityLayer margin={{ left: 25 }}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey={(e) => (e as DataEntry).bucketTimestamp.toString()}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => formatXAxis(value, range)}
                  interval={intervalX}
                  tickMargin={10}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickCount={3}
                  orientation="right"
                  tick={{ textAnchor: "end", fontSize: 12, dx: 48 }}
                  tickFormatter={(value) =>
                    formatValue(Number(value), { maximumFractionDigits: 0, minimumFractionDigits: 0 })
                  }
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      labelFormatter={(value) =>
                        new Date(value * 1000).toLocaleDateString("en-US", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })
                      }
                      valueFormatter={(value) => formatValue(Number(value))}
                      nameKey={`${tab.toString()}.${field.toString()}`}
                    />
                  }
                />

                <Line
                  // Make sure always numeric data here (tokenAmount.formatted is a string)
                  dataKey={(entry: DataEntry) => {
                    // biome-ignore lint/suspicious/noExplicitAny: Allow cast
                    const value = (entry as any)[tab][field];
                    return typeof value === "string" ? Number(value) : value;
                  }}
                  stroke="var(--chart-1)"
                  strokeWidth={2}
                  dot={false}
                  connectNulls={true}
                  type="monotone"
                />
                {average !== null && (
                  <ReferenceLine
                    y={average}
                    stroke="var(--input)"
                    strokeDasharray="4 4"
                    strokeWidth={1}
                    label={(props) => {
                      const { viewBox } = props;
                      if (!viewBox) return <g />;

                      return (
                        <foreignObject x={25} y={viewBox.y - 12} width={120} height={24} className="overflow-visible">
                          <div className="body-medium-plus flex h-full w-fit items-center justify-center whitespace-nowrap rounded-sm border bg-muted px-1 text-muted-foreground">
                            Avg {formatValue(average)}
                          </div>
                        </foreignObject>
                      );
                    }}
                  />
                )}
              </ComposedChart>
            </ChartContainer>
          )}
          {!hasData && (
            <div className="flex h-full items-center justify-center">
              <p className="body-small-plus text-center text-muted-foreground">
                Insufficient data available for selected timeframe.
              </p>
            </div>
          )}
        </div>
        <div className="mt-8 flex justify-end">
          <DateSelector range={range} setRange={setRange} availableRanges={availableRanges} />
        </div>
      </div>
    </Card>
  );
}

function formatXAxis(timestamp: number, range: DataRange) {
  return new Intl.DateTimeFormat("en-US", {
    // 3M spans ~3 months over ~7 ticks, so month-only labels would repeat; only All is coarse
    // enough to drop the day.
    day: range === "All" ? undefined : "numeric",
    month: "short",
    year: range === "All" ? "numeric" : undefined,
  }).format(new Date(timestamp * 1000));
}

function parseDataRanges<D extends DataEntry>(data: HistoricalData<D>) {
  if (!data) {
    return {
      initialRange: undefined,
      availableRanges: [],
    };
  }

  let initialRange: DataRange | undefined;
  const availableRanges: DataRange[] = [];

  // Determine which ranges are even selectable
  const weekly = data.weekly ?? [];
  const fullDomain = weekly.length > 1 ? weekly[weekly.length - 1]!.bucketTimestamp - weekly[0]!.bucketTimestamp : 0;

  const selectableRanges: DataRange[] = [];
  if (fullDomain >= WEEK) selectableRanges.push("1W");
  if (fullDomain >= WEEK) selectableRanges.push("1M");
  if (fullDomain >= 30 * DAY) selectableRanges.push("3M");
  if (fullDomain >= 90 * DAY) selectableRanges.push("All");

  // Pick the largest range with enough points
  for (const range of selectableRanges) {
    const length = estimatePreparedLength(data[CHART_RANGES[range].resolution], range);
    if (length > NO_DATA_POINT_THRESHOLD) {
      initialRange = range;
      availableRanges.push(range);
    }
  }

  return { initialRange, availableRanges };
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
