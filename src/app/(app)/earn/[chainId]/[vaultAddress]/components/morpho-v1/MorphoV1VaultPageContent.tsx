import { Suspense } from "react";
import { DataChart } from "@/components/DataChart/DataChart";
import { Card, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { MorphoVaultV1 } from "@/utils/types";
import { VaultHistoricalApyChart } from "../VaultHistoricalApyChart";
import { VaultInfoSkeleton } from "../VaultInfo";
import { MorphoV1MarketAllocationTable } from "./MorphoV1MarketAllocationTable";
import { MorphoV1VaultInfo, MorphoV1VaultMetrics } from "./MorphoV1VaultInfo";

interface Props {
  vaultPromise: Promise<MorphoVaultV1>;
}

export async function MorphoV1VaultPageContent({ vaultPromise }: Props) {
  return (
    <>
      <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
        <VaultHistoricalDepositsChart vaultPromise={vaultPromise} />
      </Suspense>

      <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
        <VaultHistoricalApyChart vaultPromise={vaultPromise} />
      </Suspense>

      <Card>
        <CardHeader>Exposure</CardHeader>
        <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
          <MorphoV1MarketAllocationTableWrapper vaultPromise={vaultPromise} />
        </Suspense>
      </Card>

      <Card>
        <CardHeader>Vault Info</CardHeader>
        <div className="grid grid-cols-1 gap-6 gap-y-6 md:grid-cols-3 md:gap-y-10">
          <Suspense fallback={<VaultInfoSkeleton metrics={MorphoV1VaultMetrics} />}>
            <MorphoV1VaultInfo vaultPromise={vaultPromise} />
          </Suspense>
        </div>
      </Card>
    </>
  );
}

async function MorphoV1MarketAllocationTableWrapper({ vaultPromise }: Props) {
  const vault = await vaultPromise;
  if (!vault) return null;

  return <MorphoV1MarketAllocationTable allocations={vault.marketAllocations} chainId={vault.chain.id} />;
}

async function VaultHistoricalDepositsChart({ vaultPromise }: Props) {
  const vault = await vaultPromise;
  if (!vault || !vault.historical) return null;

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
          underlyingAssetValue: Number(vault.totalAssets.formatted),
          usdValue: vault.totalAssets.usd ?? 0,
        },
      ]}
    />
  );
}
