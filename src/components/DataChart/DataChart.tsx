"use client";

import { useId, useMemo, useState } from "react";
import { CartesianGrid, ComposedChart, Line, ReferenceLine, XAxis, YAxis } from "recharts";
import { Card } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { formatNumber } from "@/utils/format";
import { Sparkles } from "../ui/icons/Sparkles";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";
import { ChartHeader } from "./ChartHeader";
import { CurrencySelector } from "./CurrencySelector";
import { type DataRange, DateSelector, periods } from "./DateSelector";
import { getMinX, prepareChartDataWithDomain } from "./data-domain";
import { type TabOptions, TabSelector } from "./TabSelector";
import type { DataEntry, HistoricalData } from "./types";
import { useIntervalX } from "./useIntervalX";

const NO_DATA_POINT_THRESHOLD = 10; // Need at least this many data points to show a nice chart

interface Props<D extends DataEntry> {
  title: string;
  data: HistoricalData<D>;
  defaultTab: Exclude<keyof D, "bucketTimestamp">;
  tabOptions?: Array<TabOptions<D>>;
}

export function DataChart<D extends DataEntry>(props: Props<D>) {
  const { data: allData, title, defaultTab, tabOptions } = props;
  const [range, setRange] = useState<DataRange>("1M");
  const [tab, setTab] = useState<Exclude<keyof D, "bucketTimestamp">>(defaultTab);
  const [withRewards, setWithRewards] = useState(false);

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
      return (withRewards ? "total" : "base") as keyof D[Exclude<keyof D, "bucketTimestamp">];
    }
    throw new Error(`Invalid data ${tab.toString()}`);
  }, [tab, withRewards, isTokenAmount, isApy, isUsd]);

  const data = prepareChartDataWithDomain(allData[periods[range]], range, field);
  const hasData = data.length > NO_DATA_POINT_THRESHOLD;

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

  const value = isTokenAmount
    ? tabOption?.[isUsd ? "usdValue" : "underlyingAssetValue"]
    : tabOption?.[withRewards ? "totalApy" : "baseApy"];

  const hasUsdData = isTokenAmount && data.some((d) => (d[tab] as { usd: number | null }).usd !== null);
  const hasRewardsData = isApy && data.some((d) => (d[tab] as { totalApy: number | null }).totalApy !== null);

  const minX = getMinX(allData[periods[range]], range);
  const average = calculateAverage(
    allData[periods[range]].filter((d) => d.bucketTimestamp >= minX).map((d) => Number(d[tab][field])),
  );

  const rewardsId = useId();

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
        {/* Note: Disabled rewards toggle for now as our historical APY data does not currently include rewards */}
        {hasRewardsData && false && (
          <div className="flex items-center space-x-2">
            <Switch id={rewardsId} checked={withRewards} onCheckedChange={setWithRewards} />
            <Label htmlFor={rewardsId} className="flex items-center gap-1">
              With Rewards <Sparkles className="size-4 text-accent-foreground" />
            </Label>
          </div>
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
                {isApy && (
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
          <DateSelector range={range} setRange={setRange} fullDomain={getFullDomain(allData.weekly)} />
        </div>
      </div>
    </Card>
  );
}

function formatXAxis(timestamp: number, range: DataRange) {
  return new Intl.DateTimeFormat("en-US", {
    day: range === "All" || range === "6M" ? undefined : "numeric",
    month: "short",
    year: range === "All" ? "numeric" : undefined,
  }).format(new Date(timestamp * 1000));
}

function getFullDomain(data: DataEntry[]) {
  if (data.length === 0) return 0;
  return data[data.length - 1]!.bucketTimestamp - data[0]!.bucketTimestamp;
}

function calculateAverage(data: number[]): number {
  if (data.length === 0) return 0;
  return data.reduce((acc, d) => acc + Number(d), 0) / data.length;
}
