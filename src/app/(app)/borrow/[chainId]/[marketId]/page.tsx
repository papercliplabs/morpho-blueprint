import { notFound } from "next/navigation";
import { Suspense } from "react";
import { isHex } from "viem";

import MarketActions from "@/components/market/MarketActions";
import { MarketIdentifier as MarketIdentifierComponent } from "@/components/market/MarketIdentifier";
import { MarketPositionHighlight } from "@/components/market/MarketPositionHighlight";
import { BreakcrumbBack } from "@/components/ui/breakcrumb-back";
import { Card, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { WHITELISTED_MARKETS } from "@/config";
import { getMarket, isNonIdleMarket } from "@/data/whisk/getMarket";
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

  if (!WHITELISTED_MARKETS[chainId].includes(marketId)) {
    return <UnsupportedMarket />;
  }

  return (
    <div className="flex w-full min-w-0 flex-col gap-6">
      <section className="flex flex-col gap-4">
        <BreakcrumbBack label="Borrow" href="/borrow" />
        <Suspense
          fallback={
            <div className="flex flex-col">
              <div className="flex h-[64px] items-center gap-3">
                <Skeleton className="size-8 rounded-full" />
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
        <div className="flex grow flex-col gap-6">
          <Card>
            <CardHeader>Key Metrics</CardHeader>
            {/* <Suspense fallback={<VaultKeyMetricsSkeleton />}>
              <KeyMetricsWrapper chainId={chainId} vaultAddress={vaultAddress} />
            </Suspense> */}
          </Card>

          <Card>
            <CardHeader>Vault Allocation</CardHeader>
            <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
              TODO
              {/* <MarketAllocationTableWrapper chainId={chainId} vaultAddress={vaultAddress} /> */}
            </Suspense>
          </Card>

          <Card>
            <CardHeader>Interest Rate Model</CardHeader>
            <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
              TODO
              {/* <MarketAllocationTableWrapper chainId={chainId} vaultAddress={vaultAddress} /> */}
            </Suspense>
          </Card>

          <Card>
            <CardHeader>Market Info</CardHeader>
            {/* <Suspense fallback={<VaultInfoSkeleton />}>
              <VaultInfoWrapper chainId={chainId} vaultAddress={vaultAddress} />
            </Suspense> */}
          </Card>
        </div>

        <Suspense
          fallback={
            <Card className="hidden h-[415px] w-full shrink-0 md:w-[364px] lg:block">
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

function UnsupportedMarket() {
  return (
    <div className="flex w-full grow flex-col items-center justify-center gap-6 text-center">
      <h1>Unsupported Market</h1>
      <p className="text-content-secondary">This market is not currently supported on this interface.</p>
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
          <MarketIdentifierComponent variant="default" {...market} />
        </div>
        <div className="text-muted-foreground">{market.chain.name}</div>
      </div>

      <MarketPositionHighlight market={market} />
    </div>
  );
}

async function MarketActionsWrapper({ chainId, marketId }: MarketIdentifier) {
  const market = await getMarket(chainId, marketId);

  if (!market || !isNonIdleMarket(market)) {
    return null;
  }

  return <MarketActions market={market} />;
}
