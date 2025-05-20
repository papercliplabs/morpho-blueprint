import { ReactNode } from "react";
import { getAddress } from "viem";

import { LinkExternalBlockExplorer } from "@/components/LinkExternal";
import { MetricWithTooltip } from "@/components/Metric";
import NumberFlow from "@/components/ui/number-flow";
import { Skeleton } from "@/components/ui/skeleton";
import { Vault } from "@/data/whisk/getVault";

interface VaultInfoProps {
  vault: Vault;
}

export function VaultInfo({ vault }: VaultInfoProps) {
  return (
    <VaultInfoLayout
      performanceFee={<NumberFlow value={vault.performanceFee} format={{ style: "percent" }} className="heading-6" />}
      feeRecipient={
        <div className="heading-6">
          <LinkExternalBlockExplorer
            chainId={vault.chain.id}
            type="address"
            address={vault.feeRecipientAddress ? getAddress(vault.feeRecipientAddress) : undefined}
            className="heading-6"
          />
        </div>
      }
      owner={
        <LinkExternalBlockExplorer
          chainId={vault.chain.id}
          type="address"
          address={vault.ownerAddress ? getAddress(vault.ownerAddress) : undefined}
          className="heading-6"
        />
      }
      vaultAddress={
        <LinkExternalBlockExplorer
          chainId={vault.chain.id}
          type="address"
          address={getAddress(vault.vaultAddress)}
          className="heading-6"
        />
      }
      curator={
        <LinkExternalBlockExplorer
          chainId={vault.chain.id}
          type="address"
          address={vault.curatorAddress ? getAddress(vault.curatorAddress) : undefined}
          className="heading-6"
        />
      }
      guardianAddress={
        <LinkExternalBlockExplorer
          chainId={vault.chain.id}
          type="address"
          address={vault.guardianAddress ? getAddress(vault.guardianAddress) : undefined}
          className="heading-6"
        />
      }
    />
  );
}

export function VaultInfoSkeleton() {
  const metricSkeleton = <Skeleton className="mt-0.5 h-[25px] w-[140px]" />;
  return (
    <VaultInfoLayout
      performanceFee={metricSkeleton}
      feeRecipient={metricSkeleton}
      owner={metricSkeleton}
      vaultAddress={metricSkeleton}
      curator={metricSkeleton}
      guardianAddress={metricSkeleton}
    />
  );
}

interface VaultInfoLayoutProps {
  performanceFee: ReactNode;
  feeRecipient: ReactNode;
  owner: ReactNode;
  vaultAddress: ReactNode;
  curator: ReactNode;
  guardianAddress: ReactNode;
}

function VaultInfoLayout({
  performanceFee,
  feeRecipient,
  owner,
  vaultAddress,
  curator,
  guardianAddress,
}: VaultInfoLayoutProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <MetricWithTooltip label="Performance Fee" tooltip="The percentage of vault profits the fee recipient receives.">
        {performanceFee}
      </MetricWithTooltip>
      <MetricWithTooltip label="Fee Recipient" tooltip="The recipient of the performance fee.">
        {feeRecipient}
      </MetricWithTooltip>
      <MetricWithTooltip
        label="Owner"
        tooltip="The owner of the vault, which can manage all configurable vault parameters."
      >
        {owner}
      </MetricWithTooltip>
      <MetricWithTooltip label="Vault Address" tooltip="The address of the vault contract.">
        {vaultAddress}
      </MetricWithTooltip>
      <MetricWithTooltip
        label="Curator"
        tooltip="The entity or protocol responsible for managing the vault's strategy."
      >
        {curator}
      </MetricWithTooltip>
      <MetricWithTooltip
        label="Guardian Address"
        tooltip="A security role in the vault that can intervene to protect funds if needed."
      >
        {guardianAddress}
      </MetricWithTooltip>
    </div>
  );
}
