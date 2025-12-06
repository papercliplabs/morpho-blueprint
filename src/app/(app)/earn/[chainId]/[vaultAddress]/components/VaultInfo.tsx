import type { PropsWithChildren, ReactNode } from "react";
import { MetricWithTooltip } from "@/components/Metric";
import { Skeleton } from "@/components/ui/skeleton";

const metrics = [
  {
    id: "performance-fee",
    label: "Performance Fee",
    description: "The percentage of vault profits the fee recipient receives. (APY)",
  },
  { id: "fee-recipient", label: "Fee Recipient", description: "The recipient of the performance fee." },
  {
    id: "owner",
    label: "Owner",
    description: "The owner of the vault, which can manage all configurable vault parameters.",
  },
  { id: "vault-address", label: "Vault Address", description: "The address of the vault contract." },
  {
    id: "curator",
    label: "Curator",
    description: "The entity or protocol responsible for managing the vault's strategy.",
  },
  {
    id: "guardian-address",
    label: "Guardian Address",
    description: "A security role in the vault that can intervene to protect funds if needed.",
  },
  {
    id: "management-fee",
    label: "Management Fee",
    description: "A fee charged on the vault's total assets. (APY)",
  },
  {
    id: "underlying-asset",
    label: "Underlying asset address",
    description: "The contract address of underlying vault asset.",
  },
  {
    id: "sentinel",
    label: "Sentinel",
    description: "A security role in the vault that can intervene to protect funds if needed.",
  },
] as const;

export type VaultMetric = (typeof metrics)[number];

export function VaultInfoMetric(props: PropsWithChildren<{ id: VaultMetric["id"]; tooltip?: ReactNode }>) {
  const { id, children, tooltip } = props;
  const { description, label } = metrics.find((metric) => metric.id === id)!;

  return (
    <MetricWithTooltip
      key={id}
      label={label}
      tooltip={
        <>
          {description}
          {tooltip}
        </>
      }
      className="heading-6"
    >
      {children}
    </MetricWithTooltip>
  );
}

export function VaultInfoSkeleton({ metrics }: { metrics: VaultMetric["id"][] }) {
  return metrics.map((id) => (
    <VaultInfoMetric key={id} id={id}>
      <Skeleton className="mt-0.5 h-[28px] w-[140px]" />
    </VaultInfoMetric>
  ));
}
