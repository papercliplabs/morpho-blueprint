import { Suspense } from "react";
import { DataChart } from "@/components/DataChart/DataChart";
import { Card, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { MorphoVaultV2 } from "@/utils/types";
import { VaultHistoricalApyChart } from "../VaultHistoricalApyChart";
import { VaultInfoSkeleton } from "../VaultInfo";
import { AdaptersTable } from "./AdaptersTable";
import { MorphoV2VaultInfo, MorphoV2VaultMetrics } from "./MorphoV2VaultInfo";

interface Props {
  vaultPromise: Promise<MorphoVaultV2>;
}

export async function MorphoV2VaultPageContent({ vaultPromise }: Props) {
  return (
    <>
      <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
        <VaultHistoricalDepositsChart vaultPromise={vaultPromise} />
      </Suspense>

      <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
        <VaultHistoricalApyChart vaultPromise={vaultPromise} />
      </Suspense>

      <Card>
        <CardHeader>Allocation</CardHeader>
        <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
          <AdaptersTable vaultPromise={vaultPromise} />
        </Suspense>
      </Card>

      <Card>
        <CardHeader>Vault Info</CardHeader>
        <div className="grid grid-cols-1 gap-6 gap-y-6 md:grid-cols-3 md:gap-y-10">
          <Suspense fallback={<VaultInfoSkeleton metrics={MorphoV2VaultMetrics} />}>
            <MorphoV2VaultInfo vaultPromise={vaultPromise} />
          </Suspense>
        </div>
      </Card>
    </>
  );
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
