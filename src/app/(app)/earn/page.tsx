import Image from "next/image";
import { Suspense } from "react";

import { AccountFilters } from "@/components/filters/AccountFilters";
import { VaultFilters } from "@/components/filters/VaultFilters";
import { MultiSelectOption } from "@/components/MultiSelect";
import { VaultTable } from "@/components/tables/VaultTable";
import { Card, CardHeader } from "@/components/ui/card";
import { Skeleton, Skeletons } from "@/components/ui/skeleton";
import { getVaultSummaries } from "@/data/whisk/getVaultSummaries";

export default function EarnPage() {
  return (
    <div className="flex w-full min-w-0 flex-col gap-4">
      <h1>Earn</h1>

      <div className="flex flex-col justify-between gap-4 md:flex-row">
        <Suspense
          fallback={
            <div className="flex gap-4">
              <Skeletons count={2} className="h-[40px] w-[200px]" />
            </div>
          }
        >
          <VaultFiltersWrapper />
        </Suspense>
        <AccountFilters />
      </div>

      <Card className="min-w-0">
        <CardHeader>Vaults</CardHeader>
        <Suspense fallback={<Skeleton className="h-[500px] w-full" />}>
          <VaultTableWrapper />
        </Suspense>
      </Card>
    </div>
  );
}

async function VaultFiltersWrapper() {
  const vaultSummaries = await getVaultSummaries();

  const chainOptionsMap: Record<string, MultiSelectOption> = {};
  const assetOptionsMap: Record<string, MultiSelectOption> = {};
  const curatorOptionsMap: Record<string, MultiSelectOption> = {};
  for (const vault of vaultSummaries) {
    chainOptionsMap[vault.chain.id.toString()] = {
      value: vault.chain.name,
      component: (
        <>
          <Image src={vault.chain.icon} width={24} height={24} className="size-6" alt={vault.chain.name} />
          {vault.chain.name}
        </>
      ),
    };
    assetOptionsMap[vault.asset.symbol.toString()] = {
      value: vault.asset.symbol,
      component: (
        <>
          <Image src={vault.asset.icon} width={24} height={24} className="size-6" alt={vault.asset.symbol} />
          {vault.asset.symbol}
        </>
      ),
    };
    // TODO: add curators to Whisk
  }

  return (
    <VaultFilters
      chainOptions={Object.values(chainOptionsMap)}
      assetOptions={Object.values(assetOptionsMap)}
      curatorOptions={Object.values(curatorOptionsMap)}
    />
  );
}

async function VaultTableWrapper() {
  const vaultSummaries = await getVaultSummaries();
  return <VaultTable vaultSummaries={vaultSummaries} />;
}
