import { ReactNode } from "react";
import { getAddress } from "viem";

import { LinkExternalBlockExplorer } from "@/components/LinkExternal";
import { MetricWithTooltip } from "@/components/Metric";
import NumberFlow from "@/components/ui/number-flow";
import { Skeleton } from "@/components/ui/skeleton";
import { Market } from "@/data/whisk/getMarket";

interface IrmMetricsProps {
  market: Market;
}

export function IrmMetrics({ market }: IrmMetricsProps) {
  return (
    <IrmMetricsLayout
      targetUtilization={
        <NumberFlow value={market.irm.targetUtilization} format={{ style: "percent" }} className="heading-6" />
      }
      currentUtilization={<NumberFlow value={market.utilization} format={{ style: "percent" }} className="heading-6" />}
      irmAddress={
        <LinkExternalBlockExplorer
          type="address"
          chainId={market.chain.id}
          address={getAddress(market.irm.address)}
          className="heading-6"
        />
      }
    />
  );
}

export function IrmMetricsSkeleton() {
  const skeleton = <Skeleton className="h-[32px] w-[140px]" />;
  return <IrmMetricsLayout targetUtilization={skeleton} currentUtilization={skeleton} irmAddress={skeleton} />;
}

interface IrmMetricsLayoutProps {
  targetUtilization: ReactNode;
  currentUtilization: ReactNode;
  irmAddress: ReactNode;
}

function IrmMetricsLayout({ targetUtilization, currentUtilization, irmAddress }: IrmMetricsLayoutProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <MetricWithTooltip
        label="Target Utilization"
        tooltip="The target utilization of the market. Note utilization is borrowed / supplied."
      >
        {targetUtilization}
      </MetricWithTooltip>
      <MetricWithTooltip
        label="Current Utilization"
        tooltip="The current utilization of the market.  Note utilization is borrowed / supplied."
      >
        {currentUtilization}
      </MetricWithTooltip>
      <MetricWithTooltip
        label="Interest Rate Model"
        tooltip="The address of the contract that implements the interest rate model for this market."
      >
        {irmAddress}
      </MetricWithTooltip>
    </div>
  );
}
