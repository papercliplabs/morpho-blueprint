"use client";

import { ComponentProps } from "react";
import { CartesianGrid, DotProps, Line, LineChart, ReferenceLine, Tooltip, XAxis } from "recharts";

import { ChartConfig, ChartContainer } from "@/components/ui/chart";
import { ChartTooltip } from "@/components/ui/chart";
import { formatNumber } from "@/utils/format";

interface IrmChartDataEntry {
  utilization: number;
  supplyApy: number;
  borrowApy: number;
}

const chartConfig = {
  utilization: {
    label: "Utilization",
    color: "var(--chart-3)",
  },
  supplyApy: {
    label: "Supply APY",
    color: "var(--chart-2)",
  },
  borrowApy: {
    label: "Borrow APY",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

interface IrmChartProps {
  data: IrmChartDataEntry[];
  currentUtilization: number;
}

function IrmChart({ data, currentUtilization }: IrmChartProps) {
  return (
    <ChartContainer config={chartConfig} className="h-[216px] w-full">
      <LineChart accessibilityLayer data={data}>
        <CartesianGrid vertical={false} className="stroke-border" />
        <XAxis
          dataKey="utilization"
          tickLine={false}
          tickMargin={14}
          axisLine={false}
          tickCount={2}
          type="number"
          tickFormatter={(value) => {
            return formatNumber(value, { style: "percent", minimumFractionDigits: 0, maximumFractionDigits: 0 });
          }}
          interval="preserveStartEnd"
          className="body-small"
          style={{ fill: "var(--muted-foreground)" }}
        />
        <ChartTooltip content={<CustomTooltip />} position={{ y: 0 }} cursor={{ strokeWidth: 2 }} />
        <ReferenceLine x={currentUtilization} className="stroke-border" strokeWidth={2} />

        <Line
          dataKey="borrowApy"
          stroke="var(--color-borrowApy)"
          dot={false}
          activeDot={<CustomActiveDot color="var(--color-borrowApy)" />}
          strokeWidth={3}
          animationDuration={800}
        />
        <Line
          dataKey="supplyApy"
          stroke="var(--color-supplyApy)"
          dot={false}
          activeDot={<CustomActiveDot color="var(--color-supplyApy)" />}
          strokeWidth={3}
          animationDuration={800}
        />
      </LineChart>
    </ChartContainer>
  );
}

function CustomActiveDot({ cx, cy, color }: DotProps) {
  const r = 9;
  return (
    <svg x={cx! - r} y={cy! - r} width={r * 2} height={r * 2} viewBox={`0 0 ${r * 2} ${r * 2}`} className="z-[100]">
      <circle cx={r} cy={r} r={r} fill={color} />
      <circle cx={r} cy={r} r={r - 3} fill={color} />
    </svg>
  );
}

function CustomTooltip({ active, payload }: ComponentProps<typeof Tooltip>) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card body-small flex flex-col gap-4 rounded-lg px-5 py-4 shadow-md">
        <div className="flex items-center justify-between gap-6">
          <span>Utilization:</span>
          {formatNumber(payload[0]?.payload?.utilization ?? 0, { style: "percent" })}
        </div>
        <div className="flex items-center justify-between gap-6">
          <div className="text-muted-foreground flex items-center gap-2">
            <div className="bg-chart-2 h-4 w-4 rounded-sm" />
            Supply APY
          </div>
          {formatNumber(payload[0]?.payload?.supplyApy ?? 0, { style: "percent" })}
        </div>
        <div className="flex items-center justify-between gap-6">
          <div className="text-muted-foreground flex items-center gap-2">
            <div className="bg-chart-1 h-4 w-4 rounded-sm" />
            Borrow APY
          </div>
          {formatNumber(payload[0]?.payload?.borrowApy ?? 0, { style: "percent" })}
        </div>
      </div>
    );
  }

  return null;
}

export { IrmChart, type IrmChartProps };
