"use client";
import Image from "next/image";
import { Hex } from "viem";
import { useAccount } from "wagmi";

import { MetricWithTooltip } from "@/components/Metric";
import { NumberFlowWithLoading } from "@/components/ui/number-flow";
import { Skeleton } from "@/components/ui/skeleton";
import { Market } from "@/data/whisk/getMarket";
import { useMarketPosition } from "@/hooks/useMarketPositions";
import { descaleBigIntToNumber } from "@/utils/format";

interface MarketPositionHighlightProps {
  market: Market;
}

export function MarketPositionHighlight({ market }: MarketPositionHighlightProps) {
  const { data, isLoading } = useMarketPosition(market.chain.id, market.marketId as Hex);
  const { address } = useAccount();

  if (!address) {
    // Hide when not connected
    return null;
  }

  return (
    <MetricWithTooltip label="Borrowing" className="md:items-end" tooltip="Your borrow balance in this market.">
      <div className="flex flex-col md:items-end">
        <NumberFlowWithLoading
          value={data?.borrowAssetsUsd ?? undefined}
          loadingContent={<Skeleton className="mb-1 h-[25px] w-[60px]" />}
          isLoading={isLoading}
          format={{ currency: "USD" }}
          className="heading-5"
        />
        <div className="flex items-center gap-1">
          <Image
            src={market.loanAsset.icon}
            alt={market.loanAsset.symbol}
            width={12}
            height={12}
            className="size-3 shrink-0"
          />
          <NumberFlowWithLoading
            value={data?.borrowAssets ? descaleBigIntToNumber(data.borrowAssets, market.loanAsset.decimals) : undefined}
            loadingContent={<Skeleton className="h-[15px] w-[40px]" />}
            isLoading={isLoading}
            className="body-small-plus text-muted-foreground"
          />
        </div>
      </div>
    </MetricWithTooltip>
  );
}
