import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { type Address, getAddress } from "viem";
import { DataChart } from "@/components/DataChart/DataChart";
import LinkExternal from "@/components/LinkExternal";
import { TokenIcon } from "@/components/TokenIcon";
import { MarketAllocationTable } from "@/components/tables/MarketAllocationTable";
import { Badge } from "@/components/ui/badge";
import { BreakcrumbBack } from "@/components/ui/breakcrumb-back";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { VaultActions } from "@/components/vault/VaultActions";
import { VaultInfo, VaultInfoSkeleton } from "@/components/vault/VaultInfo";
import { VaultKeyMetrics, VaultKeyMetricsSkeleton } from "@/components/vault/VaultKeyMetrics";
import { VaultPositionHighlight } from "@/components/vault/VaultPositionHighlight";
import { APP_CONFIG } from "@/config";
import type { SupportedChainId } from "@/config/types";
import { getVault } from "@/data/whisk/getVault";
import type { VaultIdentifier } from "@/utils/types";
import { getVaultTag } from "@/utils/vault";

export const metadata: Metadata = {
  title: `${APP_CONFIG.metadata.name} | Vault`,
};

export default async function VaultPage({ params }: { params: Promise<{ chainId: string; vaultAddress: string }> }) {
  const { chainId: chainIdString, vaultAddress: vaultAddressString } = await params;
  let vaultAddress: Address;
  let chainId: SupportedChainId;
  try {
    vaultAddress = getAddress(vaultAddressString);
    chainId = Number.parseInt(chainIdString) as SupportedChainId;
  } catch {
    notFound();
  }

  if (!APP_CONFIG.supportedVaults[chainId as SupportedChainId]?.some((v) => v.address === vaultAddress)) {
    return <UnsupportedVault />;
  }

  return (
    <div className="flex w-full min-w-0 flex-col gap-6">
      <section className="flex flex-col gap-4">
        <BreakcrumbBack label="Earn" href="/earn" />
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
          <VaultHeader chainId={chainId} vaultAddress={vaultAddress} />
        </Suspense>
      </section>

      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="flex min-w-0 grow flex-col gap-6">
          <Card>
            <CardHeader>Key Metrics</CardHeader>
            <Suspense fallback={<VaultKeyMetricsSkeleton />}>
              <KeyMetricsWrapper chainId={chainId} vaultAddress={vaultAddress} />
            </Suspense>
          </Card>

          {/* Hide until loaded in as this is conditionally rendered */}
          <Suspense fallback={null}>
            <VaultAboutCard chainId={chainId} vaultAddress={vaultAddress} />
          </Suspense>

          <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
            <VaultHistoricalDepositsChartWrapper chainId={chainId} vaultAddress={vaultAddress} />
          </Suspense>

          <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
            <VaultHistoricalApyChartWrapper chainId={chainId} vaultAddress={vaultAddress} />
          </Suspense>

          <Card>
            <CardHeader>Market Allocation</CardHeader>
            <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
              <MarketAllocationTableWrapper chainId={chainId} vaultAddress={vaultAddress} />
            </Suspense>
          </Card>

          <Card>
            <CardHeader>Vault Info</CardHeader>
            <Suspense fallback={<VaultInfoSkeleton />}>
              <VaultInfoWrapper chainId={chainId} vaultAddress={vaultAddress} />
            </Suspense>
          </Card>
        </div>

        <Suspense
          fallback={
            <Card className="hidden h-[415px] w-full shrink-0 md:w-[364px] lg:block">
              <Skeleton className="h-full w-full" />
            </Card>
          }
        >
          <VaultActionsWrapper chainId={chainId} vaultAddress={vaultAddress} />
        </Suspense>
      </div>
    </div>
  );
}

function UnsupportedVault() {
  return (
    <div className="flex w-full grow flex-col items-center justify-center gap-6 text-center">
      <h1>Unsupported Vault</h1>
      <p className="text-content-secondary">This selected vault is not currently supported on this interface.</p>
      <Link href="/earn">
        <Button>Return Home</Button>
      </Link>
    </div>
  );
}

async function VaultHeader({ chainId, vaultAddress }: VaultIdentifier) {
  const vault = await getVault(chainId, vaultAddress);

  if (!vault) {
    return null;
  }
  const curator = vault.metadata?.curators?.[0];
  const tag = getVaultTag(chainId, vaultAddress);

  return (
    <div className="flex flex-col justify-between gap-4 md:flex-row">
      <div className="flex flex-col">
        <div className="flex h-[64px] items-center gap-3">
          <TokenIcon token={vault.asset} chain={vault.chain} size="md" />
          <h1 className="heading-3 flex items-center gap-3">{vault.name}</h1>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <span>
            Chain: <span className="text-foreground">{vault.chain.name}</span>
          </span>
          {curator && !APP_CONFIG.featureFlags.hideCurator && (
            <>
              <span>&bull;</span>
              <div className="flex items-center gap-1">
                <span>Curator: </span>
                <LinkExternal href={curator.url} className="text-foreground">
                  {curator.name}
                  <Image
                    src={curator.image}
                    alt={curator.name}
                    width={24}
                    height={24}
                    className="inline size-6 shrink-0 rounded-full border"
                  />
                </LinkExternal>
              </div>
            </>
          )}
          {tag && (
            <>
              <span>&bull;</span>
              <Badge aria-label="Vault type">{tag}</Badge>
            </>
          )}
        </div>
      </div>

      <VaultPositionHighlight vault={vault} />
    </div>
  );
}

async function KeyMetricsWrapper({ chainId, vaultAddress }: VaultIdentifier) {
  const vault = await getVault(chainId, vaultAddress);

  if (!vault) {
    return null;
  }

  return <VaultKeyMetrics vault={vault} />;
}

async function VaultAboutCard({ chainId, vaultAddress }: VaultIdentifier) {
  const vault = await getVault(chainId, vaultAddress);
  if (!vault) {
    return null;
  }

  const overrideDescription = APP_CONFIG.supportedVaults[chainId as SupportedChainId]?.find(
    (v) => v.address === vaultAddress,
  )?.description;
  const description = overrideDescription ?? vault.metadata?.description;
  // Hide unless there is about content
  if (!description) return null;

  return (
    <Card>
      <CardHeader>About</CardHeader>
      <p className="body-large text-muted-foreground">{description}</p>
    </Card>
  );
}

async function VaultHistoricalDepositsChartWrapper({ chainId, vaultAddress }: VaultIdentifier) {
  const vault = await getVault(chainId, vaultAddress);

  // Null if the chain doesn't support historical data
  if (!vault || !vault.historical) {
    return null;
  }

  return (
    <DataChart
      data={vault.historical}
      title="Deposits"
      defaultTab="totalSupplied"
      tabOptions={[
        {
          type: "tokenAmount",
          key: "totalSupplied",
          title: "Total Deposits",
          description: "Total amount of assets deposited into the vault",
          underlyingAssetSymbol: vault.asset.symbol,
          underlyingAssetValue: Number(vault.totalSupplied.formatted),
          usdValue: vault.totalSupplied.usd ?? 0,
        },
      ]}
    />
  );
}

async function VaultHistoricalApyChartWrapper({ chainId, vaultAddress }: VaultIdentifier) {
  const vault = await getVault(chainId, vaultAddress);

  // Null if the chain doesn't support historical data
  if (!vault || !vault.historical) {
    return null;
  }

  return (
    <DataChart
      data={vault.historical}
      title="Native APY"
      defaultTab="supplyApy1d"
      tabOptions={[
        {
          type: "apy",
          key: "supplyApy1d",
          description: "Native supply APY (exluding rewards and fees) using a 1 day rolling average",
          title: "APY (1D)",
          baseApy: vault.historical.daily[vault.historical.daily.length - 1]?.supplyApy1d?.base ?? 0,
          totalApy: vault.historical.daily[vault.historical.daily.length - 1]?.supplyApy1d?.total ?? 0,
        },
        {
          type: "apy",
          key: "supplyApy7d",
          description: "Native supply APY (exluding rewards and fees) using a 7 day rolling average",
          title: "APY (7D)",
          baseApy: vault.historical.daily[vault.historical.daily.length - 1]?.supplyApy7d?.base ?? 0,
          totalApy: vault.historical.daily[vault.historical.daily.length - 1]?.supplyApy7d?.total ?? 0,
        },
        {
          type: "apy",
          key: "supplyApy30d",
          description: "Native supply APY (exluding rewards and fees) using a 30 day rolling average",
          title: "APY (30D)",
          baseApy: vault.historical.daily[vault.historical.daily.length - 1]?.supplyApy30d?.base ?? 0,
          totalApy: vault.historical.daily[vault.historical.daily.length - 1]?.supplyApy30d?.total ?? 0,
        },
      ]}
    />
  );
}

async function MarketAllocationTableWrapper({ chainId, vaultAddress }: VaultIdentifier) {
  const vault = await getVault(chainId, vaultAddress);

  if (!vault) {
    return null;
  }

  return <MarketAllocationTable vault={vault} />;
}

async function VaultInfoWrapper({ chainId, vaultAddress }: VaultIdentifier) {
  const vault = await getVault(chainId, vaultAddress);

  if (!vault) {
    return null;
  }

  return <VaultInfo vault={vault} />;
}

async function VaultActionsWrapper({ chainId, vaultAddress }: VaultIdentifier) {
  const vault = await getVault(chainId, vaultAddress);

  if (!vault) {
    return null;
  }

  return <VaultActions vault={vault} />;
}
