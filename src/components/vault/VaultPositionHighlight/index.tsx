"use client";
import Image from "next/image";
import { getAddress } from "viem";
import { useAccount } from "wagmi";

import { Metric } from "@/components/Metric";
import { NumberFlowWithLoading } from "@/components/ui/number-flow";
import { Skeleton } from "@/components/ui/skeleton";
import { Vault } from "@/data/whisk/getVault";
import { useVaultPosition } from "@/hooks/useVaultPositions";
import { descaleBigIntToNumber } from "@/utils/format";

interface VaultPositionHighlightProps {
  vault: Vault;
}

export function VaultPositionHighlight({ vault }: VaultPositionHighlightProps) {
  const { data, isLoading } = useVaultPosition(vault.chain.id, getAddress(vault.vaultAddress));
  const { address } = useAccount();

  if (!address) {
    // Hide when not connected
    return null;
  }

  return (
    <Metric label="Supplying" className="md:items-end">
      <div className="flex flex-col md:items-end">
        <NumberFlowWithLoading
          value={data?.supplyAssetsUsd ?? undefined}
          loadingContent={<Skeleton className="mb-1 h-[25px] w-[60px]" />}
          isLoading={isLoading}
          format={{ currency: "USD" }}
          className="heading-5"
        />
        <div className="flex items-center gap-1">
          <Image src={vault.asset.icon} alt={vault.asset.symbol} width={12} height={12} className="size-3 shrink-0" />
          <NumberFlowWithLoading
            value={data?.supplyAssets ? descaleBigIntToNumber(data.supplyAssets, vault.asset.decimals) : undefined}
            loadingContent={<Skeleton className="h-[15px] w-[40px]" />}
            isLoading={isLoading}
            className="body-small-plus text-muted-foreground"
          />
        </div>
      </div>
    </Metric>
  );
}
