"use client";

import { useMemo, useState } from "react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import { ButtonSelector } from "@/components/ui/button-selector/button-selector";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { formatNumber } from "@/utils/format";
import { Card } from "../ui/card";
import { type DataRange, DateSelector, periods } from "./DateSelector";
import { type TabOptions, TabSelector } from "./TabSelector";
import type { DataEntry, HistoricalData } from "./types";

interface Props<D extends DataEntry> {
  title: string;
  data: HistoricalData<D>;
  defaultTab: Exclude<keyof D, "bucketTimestamp">;
  tabOptions?: Array<TabOptions<D>>;
}
export function DataChart<D extends DataEntry>(props: Props<D>) {
  const { data: allData, title, defaultTab, tabOptions } = props;
  const [range, setRange] = useState<DataRange>("1W");

  const data = allData[periods[range]];

  const [currency, setCurrency] = useState<string | undefined>("USD");
  const [tab, setTab] = useState<Exclude<keyof D, "bucketTimestamp">>(defaultTab);
  const [withRewards] = useState(false); // ToDo: Rewards Toggle

  const tabOption = tabOptions?.find((t) => t.key === tab);
  const isTokenAmount = tabOption?.type === "tokenAmount";
  const isApy = tabOption?.type === "apy";
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

  function formatValue(value: number, options: Intl.NumberFormatOptions = {}) {
    return formatNumber(value, {
      ...options,
      style: isApy ? "percent" : "decimal",
      currency: isUsd ? "USD" : undefined,
    });
  }

  const label = tabOption?.title;
  const lastItem = data[data.length - 1];

  const value = isTokenAmount
    ? tabOption?.[isUsd ? "usdValue" : "underlyingAssetValue"]
    : tabOption?.[withRewards ? "totalApy" : "baseApy"];

  return (
    <Card>
      <header className="flex items-center justify-between">
        <h6>{title}</h6>
        {isTokenAmount && (
          <div className="flex justify-end">
            <ButtonSelector
              options={[tabOption.underylingAssetSymbol, "USD"]}
              selected={currency}
              setSelected={setCurrency}
            />
          </div>
        )}
      </header>

      {tabOptions && tabOptions.length > 1 && (
        <TabSelector tabs={tabOptions} selected={tab} setSelected={setTab} className="mt-4" />
      )}

      <div className="mt-4 rounded-lg border p-4">
        <dl>
          <dt className="body-small-plus text-muted-foreground">
            {label} {isTokenAmount ? `(${currency})` : ""}
          </dt>
          <dd className="heading-4 mt-1">{formatValue(value || (lastItem?.[tab][field] as number))}</dd>
        </dl>

        <ChartContainer
          config={{ [`${tab.toString()}.${field.toString()}`]: { label } }}
          className="mt-4 h-[160px] w-full"
        >
          <LineChart accessibilityLayer data={data} margin={{ left: 25 }}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey={(e) => (e as DataEntry).bucketTimestamp.toString()}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => formatXAxis(value, range)}
              interval={Math.ceil(data.length / 6.5)}
              tickMargin={10}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickCount={3}
              orientation="right"
              tick={{ textAnchor: "end", fontSize: 12, dx: 48 }}
              tickFormatter={(value) => formatValue(value, { maximumFractionDigits: 0, minimumFractionDigits: 0 })}
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
                />
              }
            />

            <Line
              dataKey={`${tab.toString()}.${field.toString()}`}
              stroke="var(--chart-1)"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ChartContainer>
        <div className="mt-8 flex justify-end">
          <DateSelector range={range} setRange={setRange} />
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
