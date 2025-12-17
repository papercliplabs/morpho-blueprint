"use client";
import Image from "next/image";
import type { Hex } from "viem";
import { useAccount } from "wagmi";

import { MetricWithTooltip } from "@/common/components/Metric";
import { NumberFlowWithLoading } from "@/common/components/ui/number-flow";
import { Skeleton } from "@/common/components/ui/skeleton";
import type { SupportedChainId } from "@/config/types";
import type { Market } from "@/modules/market/data/getMarket";
import { useMarketPosition } from "@/modules/market/hooks/useMarketPositions";

interface MarketPositionHighlightProps {
  market: Market;
}

export function MarketPositionHighlight({ market }: MarketPositionHighlightProps) {
  const { data, isLoading } = useMarketPosition(market.chain.id as SupportedChainId, market.marketId as Hex);
  const { address } = useAccount();

  if (!address) {
    // Hide when not connected
    return null;
  }

  return (
    <MetricWithTooltip label="Borrowing" className="md:items-end" tooltip="Your borrow balance in this market.">
      <div className="flex flex-col md:items-end">
        <NumberFlowWithLoading
          value={data?.borrowAmount.usd ?? undefined}
          loadingContent={<Skeleton className="mb-1 h-[25px] w-[60px]" />}
          isLoading={isLoading}
          format={{ currency: "USD" }}
          className="heading-5"
        />
        <div className="flex items-center gap-1">
          {/* TODO: make AssetIcon component... */}
          <Image
            src={market.loanAsset.icon ?? ""}
            alt={market.loanAsset.symbol}
            width={12}
            height={12}
            className="size-3 shrink-0 rounded-full border border-border"
          />
          <NumberFlowWithLoading
            value={data ? Number(data.borrowAmount.formatted) : undefined}
            loadingContent={<Skeleton className="h-[15px] w-[40px]" />}
            isLoading={isLoading}
            className="body-small-plus text-muted-foreground"
          />
        </div>
      </div>
    </MetricWithTooltip>
  );
}
