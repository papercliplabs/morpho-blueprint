"use client";

import { type ReactNode, useMemo, useState } from "react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import { ButtonSelector } from "@/components/ui/button-selector/button-selector";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { formatNumber } from "@/utils/format";
import { Card } from "../ui/card";
import type { DataEntry, HistoricalData } from "./types";

interface Props {
  title: string;
  data: HistoricalData;
  type: DataType;
  currencies?: string[];
  value?: ReactNode;
}

export type DataRange = "1W" | "1M" | "6M" | "All";
export type DataType = Exclude<keyof DataEntry, "bucketTimestamp">;

const periods: Record<DataRange, keyof HistoricalData> = {
  "1W": "hourly",
  "1M": "daily",
  "6M": "daily",
  All: "weekly",
} as const;

const labels: Record<DataType, string> = {
  totalSupplied: "Total Supplied",
  totalBorrowed: "Total Borrowed",
  supplyApy: "Supply APY",
} as const;

export function VaultChart(props: Props) {
  const { data, type, currencies = [], title, value } = props;
  const [range, setRange] = useState<DataRange>("1W");
  const [currency, setCurrency] = useState<string | undefined>(currencies[0]);
  const [withRewards, _] = useState(false); // ToDo: Rewards Toggle

  const isCurrency = type === "totalSupplied" || type === "totalBorrowed";
  const isPercent = type === "supplyApy";

  const field = useMemo(() => {
    if (isCurrency) return currency?.toLowerCase() === "usd" ? "usd" : "formatted";
    return withRewards ? "total" : "base";
  }, [isCurrency, currency, withRewards]);

  const label = labels[type];
  const period = periods[range];
  const lastItem = data[period][data[period].length - 1];

  function formatValue(value: number, options: Intl.NumberFormatOptions = {}) {
    return formatNumber(value, {
      ...options,
      style: isPercent ? "percent" : "decimal",
      currency: isCurrency && currency === "USD" ? "USD" : undefined,
    });
  }

  return (
    <Card>
      <header className="flex items-center justify-between pb-4">
        <h6>{title}</h6>
        {currencies.length > 1 && (
          <div className="flex justify-end">
            <ButtonSelector options={currencies} selected={currency} setSelected={setCurrency} />
          </div>
        )}
      </header>

      <div className="rounded-lg border p-4">
        <dl>
          <dt className="body-small-plus text-muted-foreground">
            {label} {currency}
          </dt>
          <dd className="heading-4 mt-1">{value || formatValue(getFieldValue(lastItem, type, field))}</dd>
        </dl>

        <ChartContainer config={{ [`${type}.${field}`]: { label } }} className="mt-4 h-[160px] w-full">
          <LineChart accessibilityLayer data={data[periods[range]]}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey={(e) => (e as DataEntry).bucketTimestamp.toString()}
              tickLine={false}
              axisLine={false}
              tickMargin={20}
              tickFormatter={(value) => formatXAxis(value, range)}
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

            <Line dataKey={`${type}.${field}`} stroke="var(--chart-1)" strokeWidth={2} dot={false} />
          </LineChart>
        </ChartContainer>
        <div className="mt-8 flex justify-end">
          <ButtonSelector options={Object.keys(periods) as DataRange[]} selected={range} setSelected={setRange} />
        </div>
      </div>
    </Card>
  );
}

function formatXAxis(timestamp: number, range: DataRange) {
  return new Intl.DateTimeFormat("en-US", {
    day: range === "All" ? undefined : "numeric",
    month: "short",
    year: range === "All" ? "numeric" : undefined,
  }).format(new Date(timestamp * 1000));
}

function getFieldValue<T extends DataType>(item: DataEntry | undefined, type: T, field: string) {
  if (!item) return 0;
  return Number(item[type][field as keyof DataEntry[T]]);
}
