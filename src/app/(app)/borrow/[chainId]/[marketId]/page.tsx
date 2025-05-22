import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { isHex } from "viem";

import { IrmChart } from "@/components/IrmChart";
import { IrmMetrics, IrmMetricsSkeleton } from "@/components/market/IrmMetrics";
import MarketActions from "@/components/market/MarketActions";
import { MarketInfo, MarketInfoSkeleton } from "@/components/market/MarketInfo";
import { MarketKeyMetrics, MarketKeyMetricsSkeleton } from "@/components/market/MarketKeyMetrics";
import { MarketName } from "@/components/market/MarketName";
import { MarketPositionHighlight } from "@/components/market/MarketPositionHighlight";
import { VaultAllocationTable } from "@/components/tables/VaultAllocationTable";
import { BreakcrumbBack } from "@/components/ui/breakcrumb-back";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { SupportedChainId } from "@/config/types";
import { getMarket, isNonIdleMarket } from "@/data/whisk/getMarket";
import { getWhitelistedMarketIds } from "@/data/whisk/getWhitelistedMarketIds";
import { MarketIdentifier } from "@/utils/types";

export default async function MarketPage({ params }: { params: Promise<{ chainId: string; marketId: string }> }) {
  const { chainId: chainIdString, marketId } = await params;
  let chainId: number;
  try {
    chainId = parseInt(chainIdString);
  } catch {
    notFound();
  }

  if (!isHex(marketId)) {
    notFound();
  }

  return (
    <div className="relative flex w-full min-w-0 flex-col gap-6">
      <Suspense fallback={null}>
        <WhitelistCheck chainId={chainId} marketId={marketId} />
      </Suspense>

      <section className="flex flex-col gap-4">
        <BreakcrumbBack label="Borrow" href="/borrow" />
        <Suspense
          fallback={
            <div className="flex flex-col">
              <div className="flex h-[64px] items-center gap-3">
                <div className="flex flex-row items-center">
                  <Skeleton className="size-8 rounded-full" />
                  <Skeleton className="-ml-3 size-8 rounded-full" />
                </div>
                <Skeleton className="h-[32px] w-[280px]" />
              </div>
              <Skeleton className="h-[20px] w-[140px]" />
            </div>
          }
        >
          <MarketHeader chainId={chainId} marketId={marketId} />
        </Suspense>
      </section>

      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="flex min-w-0 grow flex-col gap-6">
          <Card>
            <CardHeader>Key Metrics</CardHeader>
            <Suspense fallback={<MarketKeyMetricsSkeleton />}>
              <KeyMetricsWrapper chainId={chainId} marketId={marketId} />
            </Suspense>
          </Card>

          <Card>
            <CardHeader>Vault Allocation</CardHeader>
            <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
              <VaultAllocationTableWrapper chainId={chainId} marketId={marketId} />
            </Suspense>
          </Card>

          <Card>
            <CardHeader>Interest Rate Model</CardHeader>
            <div className="flex flex-col gap-8">
              <Suspense fallback={<IrmMetricsSkeleton />}>
                <IrmMetricsWrapper chainId={chainId} marketId={marketId} />
              </Suspense>
              <Suspense fallback={<Skeleton className="h-[216px] w-full" />}>
                <IrmChartWrapper chainId={chainId} marketId={marketId} />
              </Suspense>
            </div>
          </Card>

          <Card>
            <CardHeader>Market Info</CardHeader>
            <Suspense fallback={<MarketInfoSkeleton />}>
              <MarketInfoWrapper chainId={chainId} marketId={marketId} />
            </Suspense>
          </Card>
        </div>

        <Suspense
          fallback={
            <Card className="hidden h-[624px] w-full shrink-0 md:w-[364px] lg:block">
              <Skeleton className="h-full w-full" />
            </Card>
          }
        >
          <MarketActionsWrapper chainId={chainId} marketId={marketId} />
        </Suspense>
      </div>
    </div>
  );
}

async function WhitelistCheck({ chainId, marketId }: MarketIdentifier) {
  const market = await getMarket(chainId, marketId);
  const whitelistedMarketIds = await getWhitelistedMarketIds();

  if (!market) {
    notFound();
  }

  if (whitelistedMarketIds[chainId as SupportedChainId].includes(marketId)) {
    return null;
  }

  return (
    <div className="bg-background absolute -inset-1 z-10 flex grow flex-col items-center justify-center gap-6 text-center">
      <h1>Unsupported Market</h1>
      <p className="text-content-secondary">This market is not currently supported on this interface.</p>
      <Link href="/earn">
        <Button>Return Home</Button>
      </Link>
    </div>
  );
}

async function MarketHeader({ chainId, marketId }: MarketIdentifier) {
  const market = await getMarket(chainId, marketId);

  if (!market) {
    return null;
  }

  return (
    <div className="flex flex-col justify-between gap-4 md:flex-row">
      <div className="flex flex-col">
        <div className="flex h-[64px] items-center gap-3">
          <MarketName variant="default" {...market} />
        </div>
        <div className="text-muted-foreground">{market.chain.name}</div>
      </div>

      <MarketPositionHighlight market={market} />
    </div>
  );
}

async function KeyMetricsWrapper({ chainId, marketId }: MarketIdentifier) {
  const market = await getMarket(chainId, marketId);

  if (!market) {
    return null;
  }

  return <MarketKeyMetrics market={market} />;
}

async function VaultAllocationTableWrapper({ chainId, marketId }: MarketIdentifier) {
  const market = await getMarket(chainId, marketId);

  if (!market) {
    return null;
  }

  return <VaultAllocationTable market={market} />;
}

async function IrmMetricsWrapper({ chainId, marketId }: MarketIdentifier) {
  const market = await getMarket(chainId, marketId);
  if (!market) {
    return null;
  }

  return <IrmMetrics market={market} />;
}

async function IrmChartWrapper({ chainId, marketId }: MarketIdentifier) {
  const market = await getMarket(chainId, marketId);
  if (!market) {
    return null;
  }
  return <IrmChart data={market.irm.curve ?? []} currentUtilization={market.utilization} />;
}

async function MarketInfoWrapper({ chainId, marketId }: MarketIdentifier) {
  const market = await getMarket(chainId, marketId);
  if (!market) {
    return null;
  }
  return <MarketInfo market={market} />;
}

async function MarketActionsWrapper({ chainId, marketId }: MarketIdentifier) {
  const market = await getMarket(chainId, marketId);

  if (!market || !isNonIdleMarket(market)) {
    return null;
  }

  return <MarketActions market={market} />;
}
