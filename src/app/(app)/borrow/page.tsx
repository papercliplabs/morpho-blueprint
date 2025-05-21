import Image from "next/image";
import { Suspense } from "react";

import { AccountFilters } from "@/components/filters/AccountFilters";
import { MarketFilters } from "@/components/filters/MarketFilters";
import { BorrowSummaryMetrics, BorrowSummaryMetricsSkeleton } from "@/components/market/BorrowSummaryMetrics";
import { MultiSelectOption } from "@/components/MultiSelect";
import { MarketTable } from "@/components/tables/MarketTable";
import { Avatar } from "@/components/ui/avatar";
import { Card, CardHeader } from "@/components/ui/card";
import { Skeleton, Skeletons } from "@/components/ui/skeleton";
import { getMarketSummaries } from "@/data/whisk/getMarketSummaries";

export default function BorrowPage() {
  return (
    <div className="flex w-full min-w-0 flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1>Borrow</h1>
        <p className="text-muted-foreground">Borrow assets against your collateral.</p>
      </div>

      <Suspense fallback={<BorrowSummaryMetricsSkeleton />}>
        <BorrowSummaryMetricsWrapper />
      </Suspense>

      <section className="flex flex-col gap-4">
        <div className="flex flex-col justify-between gap-4 md:flex-row">
          <Suspense
            fallback={
              <div className="flex gap-4 pb-0.5">
                <Skeletons count={3} className="h-[40px] w-[116px] flex-1" />
              </div>
            }
          >
            <MarketFiltersWrapper />
          </Suspense>
          <AccountFilters />
        </div>

        <Card className="min-w-0">
          <CardHeader>Markets</CardHeader>
          <Suspense fallback={<Skeleton className="h-[500px] w-full" />}>
            <MarketTableWrapper />
          </Suspense>
        </Card>
      </section>
    </div>
  );
}

async function BorrowSummaryMetricsWrapper() {
  const marketSummaries = await getMarketSummaries();
  return <BorrowSummaryMetrics marketSummaries={marketSummaries} />;
}

async function MarketFiltersWrapper() {
  const marketSummaries = await getMarketSummaries();

  const chainOptionsMap: Record<string, MultiSelectOption> = {};
  const collateralAssetOptionsMap: Record<string, MultiSelectOption> = {};
  const loanAssetOptionsMap: Record<string, MultiSelectOption> = {};
  for (const marketSummary of marketSummaries) {
    chainOptionsMap[marketSummary.chain.id.toString()] = {
      value: marketSummary.chain.name,
      component: (
        <>
          <Image
            src={marketSummary.chain.icon}
            alt={marketSummary.chain.name}
            width={24}
            height={24}
            className="size-6 rounded-[4px]"
          />
          {marketSummary.chain.name}
        </>
      ),
    };

    if (marketSummary.collateralAsset) {
      collateralAssetOptionsMap[marketSummary.collateralAsset.symbol.toString()] = {
        value: marketSummary.collateralAsset.symbol,
        component: (
          <>
            <Avatar src={marketSummary.collateralAsset.icon} size="sm" alt={marketSummary.collateralAsset.symbol} />
            {marketSummary.collateralAsset.symbol}
          </>
        ),
      };
    }

    loanAssetOptionsMap[marketSummary.loanAsset.symbol.toString()] = {
      value: marketSummary.loanAsset.symbol,
      component: (
        <>
          <Avatar src={marketSummary.loanAsset.icon} size="sm" alt={marketSummary.loanAsset.symbol} />
          {marketSummary.loanAsset.symbol}
        </>
      ),
    };
  }

  return (
    <MarketFilters
      chainOptions={Object.values(chainOptionsMap)}
      collateralAssetOptions={Object.values(collateralAssetOptionsMap)}
      loanAssetOptions={Object.values(loanAssetOptionsMap)}
    />
  );
}

async function MarketTableWrapper() {
  const marketSummaries = await getMarketSummaries();
  return <MarketTable marketSummaries={marketSummaries} />;
}
