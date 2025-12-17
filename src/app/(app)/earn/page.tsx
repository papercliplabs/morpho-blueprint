import type { Metadata } from "next";
import Image from "next/image";
import { Suspense } from "react";
import type { MultiSelectOption } from "@/common/components/MultiSelect/MultiSelect";
import { Avatar } from "@/common/components/ui/avatar";
import { Card, CardHeader } from "@/common/components/ui/card";
import { Skeleton, Skeletons } from "@/common/components/ui/skeleton";
import { APP_CONFIG } from "@/config";
import type { SupportedChainId } from "@/config/types";
import { TokenIcon } from "@/modules/token/components/TokenIcon";
import { EarnSummaryMetrics, EarnSummaryMetricsSkeleton } from "@/modules/vault/components/EarnSummaryMetrics";
import { VaultFilters } from "@/modules/vault/components/VaultFilters";
import { VaultTable } from "@/modules/vault/components/VaultTable";
import { getVaultSummaries } from "@/modules/vault/data/getVaultSummaries";
import { extractVaultCurator } from "@/modules/vault/utils/extractVaultCurator";
import { getVaultTagData } from "@/modules/vault/utils/getVaultTagData";
import { AccountFilters } from "@/modules/wallet/components/AccountFilters";

export const metadata: Metadata = {
  title: `${APP_CONFIG.metadata.name} | Earn`,
};

export default function EarnPage() {
  return (
    <div className="flex w-full min-w-0 flex-col gap-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="heading-2">Earn</h1>
          <p className="text-muted-foreground">Earn yield on assets by lending them out.</p>
        </div>

        <Suspense fallback={<EarnSummaryMetricsSkeleton />}>
          <EarnSummaryMetricsWrapper />
        </Suspense>
      </div>

      <section className="flex flex-col gap-4">
        <div className="flex flex-col justify-between gap-4 md:flex-row">
          <Suspense
            fallback={
              <div className="flex gap-4 pb-0.5">
                <Skeletons count={2} className="h-[40px] w-[116px] flex-1" />
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
      </section>
    </div>
  );
}

async function EarnSummaryMetricsWrapper() {
  const vaultSummaries = await getVaultSummaries();
  return <EarnSummaryMetrics vaultSummaries={vaultSummaries} />;
}

async function VaultFiltersWrapper() {
  const vaultSummaries = await getVaultSummaries();

  const chainOptionsMap: Record<string, MultiSelectOption> = {};
  const assetOptionsMap: Record<string, MultiSelectOption> = {};
  const curatorOptionsMap: Record<string, MultiSelectOption> = {};
  const tagOptionsMap: Record<string, MultiSelectOption> = {};
  for (const vault of vaultSummaries) {
    chainOptionsMap[vault.chain.id.toString()] = {
      value: vault.chain.name,
      component: (
        <>
          <Image
            src={vault.chain.icon}
            alt={vault.chain.name}
            width={24}
            height={24}
            className="size-6 rounded-[4px]"
          />
          {vault.chain.name}
        </>
      ),
    };
    assetOptionsMap[vault.asset.symbol.toString()] = {
      value: vault.asset.symbol,
      component: (
        <>
          <TokenIcon token={vault.asset} chain={vault.chain} size="sm" showChain={false} />
          {vault.asset.symbol}
        </>
      ),
      category: vault.asset.category ?? null,
    };

    const curator = extractVaultCurator(vault);
    if (curator) {
      curatorOptionsMap[curator.name] = {
        value: curator.name,
        component: (
          <>
            <Avatar src={curator.image} size="sm" alt={curator.name} />
            {curator.name}
          </>
        ),
      };
    }

    // Derive tag from optional config
    const chainId = vault.chain.id as SupportedChainId;
    const tagData = getVaultTagData(chainId, vault.vaultAddress);
    if (tagData) {
      tagOptionsMap[tagData.tag] = {
        value: tagData.tag,
        component: <>{tagData.tag}</>,
      };
    }
  }

  return (
    <VaultFilters
      chainOptions={Object.values(chainOptionsMap)}
      assetOptions={Object.values(assetOptionsMap)}
      curatorOptions={Object.values(curatorOptionsMap)}
      tagOptions={Object.values(tagOptionsMap)}
    />
  );
}

async function VaultTableWrapper() {
  const vaultSummaries = await getVaultSummaries();
  return <VaultTable vaultSummaries={vaultSummaries.filter((v) => !v.isHidden)} />;
}
