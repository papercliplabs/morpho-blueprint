import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { type Address, getAddress } from "viem";
import { BreakcrumbBack } from "@/common/components/ui/breakcrumb-back";
import { Button } from "@/common/components/ui/button";
import { Card, CardHeader } from "@/common/components/ui/card";
import { Skeleton } from "@/common/components/ui/skeleton";
import { APP_CONFIG } from "@/config";
import type { SupportedChainId } from "@/config/types";
import { Erc4626VaultProtocol } from "@/generated/gql/whisk/graphql";
import { MorphoV1VaultPageContent } from "@/modules/vault/components/morpho-v1/MorphoV1VaultPageContent";
import { MorphoV2VaultPageContent } from "@/modules/vault/components/morpho-v2/MorphoV2VaultPageContent";
import { VaultAboutCard } from "@/modules/vault/components/VaultAboutCard";
import { VaultActions } from "@/modules/vault/components/VaultActions/VaultActions";
import { VaultHeader } from "@/modules/vault/components/VaultHeader";
import { VaultKeyMetrics, VaultKeyMetricsSkeleton } from "@/modules/vault/components/VaultKeyMetrics";
import { getVault, type Vault } from "@/modules/vault/data/getVault";
import { getVaultConfig } from "@/modules/vault/utils/getVaultConfig";
import type { MorphoVaultV1, MorphoVaultV2 } from "@/modules/vault/vault.types";

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

  const vaultConfig = getVaultConfig(chainId, vaultAddressString);

  if (!vaultConfig || vaultConfig.isHidden) {
    return <UnsupportedVault />;
  }

  const protocol = vaultConfig.protocol;

  const vaultPromise = getVault(chainId, vaultAddress, protocol);

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
          <VaultHeader vaultPromise={vaultPromise} />
        </Suspense>
      </section>

      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="flex min-w-0 grow flex-col gap-6">
          <Card>
            <CardHeader>Key Metrics</CardHeader>
            <Suspense fallback={<VaultKeyMetricsSkeleton />}>
              <VaultKeyMetrics vaultPromise={vaultPromise} />
            </Suspense>
          </Card>

          {/* Hide until loaded in as this is conditionally rendered */}
          <Suspense fallback={null}>
            <VaultAboutCard vaultPromise={vaultPromise} />
          </Suspense>

          <ProtocolSpecificPageContent vaultPromise={vaultPromise} protocol={protocol} />
        </div>

        <Suspense
          fallback={
            <Card className="hidden h-[415px] w-full shrink-0 md:w-[364px] lg:block">
              <Skeleton className="h-full w-full" />
            </Card>
          }
        >
          <VaultActions vaultPromise={vaultPromise} />
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

function ProtocolSpecificPageContent({
  vaultPromise,
  protocol,
}: {
  vaultPromise: Promise<Vault>;
  protocol: Erc4626VaultProtocol;
}) {
  switch (protocol) {
    case Erc4626VaultProtocol.MorphoV1:
      return <MorphoV1VaultPageContent vaultPromise={vaultPromise as Promise<MorphoVaultV1>} />;
    case Erc4626VaultProtocol.MorphoV2:
      return <MorphoV2VaultPageContent vaultPromise={vaultPromise as Promise<MorphoVaultV2>} />;
    default:
      return null;
  }
}
