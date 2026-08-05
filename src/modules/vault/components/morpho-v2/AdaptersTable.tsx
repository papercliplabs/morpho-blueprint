"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { use } from "react";
import { ApyTooltip } from "@/common/components/ApyToolip";
import NumberFlow from "@/common/components/ui/number-flow";
import { Table } from "@/common/components/ui/table";
import { rateLabel } from "@/common/utils/timeframe";
import { TokenIcon } from "@/modules/token/components/TokenIcon";
import type { MorphoVaultV2 } from "@/modules/vault/vault.types";
import { CapFilledTooltip } from "./CapFilledTooltip";

interface Props {
  vaultPromise: Promise<MorphoVaultV2>;
}

type Adapter = MorphoVaultV2["allocations"][number];

// `Erc4626VaultAdapter` rows without an underlying vault are vault V2 or unrecognized adapters
// (the API exposes no expandable breakdown for them), so they get their own group rather than
// sitting under "Vaults v1".
function adapterGroup(adapter: Adapter): string {
  if (adapter.__typename === "MarketV1Adapter") return "MarketV1Adapter";
  return adapter.vault ? "Erc4626VaultAdapter" : "OtherAdapter";
}

const GROUP_LABELS: Record<string, string> = {
  Erc4626VaultAdapter: "Vaults v1",
  MarketV1Adapter: "Markets v1",
  OtherAdapter: "Other",
};

const columns: ColumnDef<Adapter & { percentage: number; group: string }>[] = [
  { accessorKey: "group", enableSorting: false },
  {
    id: "name",
    accessorKey: "name",
    header: "Vaults / Markets",
    cell: ({ row }) => {
      const { __typename, name } = row.original;
      return (
        <div className="body-medium-plus flex min-w-0 items-center gap-2">
          {__typename === "Erc4626VaultAdapter" && row.original.vault && (
            <TokenIcon token={row.original.vault.asset} chain={row.original.vault.chain} size="md" />
          )}
          <span className="truncate">{name || __typename}</span>
        </div>
      );
    },
    minSize: 240,
  },
  {
    id: "allocation",
    accessorFn: (row) => row.adapterCap?.allocation?.usd ?? 0,
    header: "Allocation (USDC)",
    cell: ({ row }) => {
      const allocationUsd = Number(row.original.adapterCap?.allocation?.usd ?? 0);
      const absoluteCapUsd = Number(row.original.adapterCap?.absoluteCap?.usd ?? 0);
      return (
        <div className="flex items-center gap-1.5">
          <NumberFlow value={allocationUsd} format={{ currency: "USD" }} />
          <CapFilledTooltip capType="absolute" capValue={absoluteCapUsd} allocationValue={allocationUsd} />
        </div>
      );
    },
    minSize: 140,
  },
  {
    id: "percentage",
    accessorKey: "percentage",
    header: "Allocation %",
    cell: ({ row }) => {
      const allocationPercent = Number(row.original.percentage);
      const relativeCap = Number(row.original.adapterCap?.relativeCap?.formatted ?? 1);
      return (
        <div className="flex items-center gap-1.5">
          <NumberFlow value={row.original.percentage} format={{ style: "percent" }} />
          <CapFilledTooltip capType="relative" capValue={relativeCap} allocationValue={allocationPercent} />
        </div>
      );
    },
    minSize: 140,
  },
  {
    id: "apy",
    accessorFn: (row) => (row.__typename === "Erc4626VaultAdapter" ? row.vault?.apy?.total : null) ?? 0,
    header: rateLabel("Net APY"),
    cell: ({ row }) => {
      const adapter = row.original;

      if (adapter.__typename !== "Erc4626VaultAdapter" || !adapter.vault?.apy) {
        return <span className="text-muted-foreground">-</span>;
      }

      const { afterFees, total, rewards } = adapter.vault.apy;
      return <ApyTooltip type="earn" apyAfterFees={afterFees} totalApy={total} rewards={rewards} triggerVariant="sm" />;
    },
    minSize: 120,
  },
];

export function AdaptersTable({ vaultPromise }: Props) {
  const vault = use(vaultPromise);
  if (!vault) return null;

  const totalSupply = Number(vault.totalAssets?.formatted ?? "0");

  const adapters = vault.allocations
    .map((adapter) => {
      const allocation = Number(adapter.adapterCap?.allocation?.formatted ?? "0");
      return { ...adapter, percentage: totalSupply > 0 ? allocation / totalSupply : 0, group: adapterGroup(adapter) };
    })
    .sort((a, b) => b.percentage - a.percentage);

  return (
    <Table
      columns={columns}
      data={adapters}
      groupBy="group"
      groupLabels={GROUP_LABELS}
      initialSort={[{ id: "percentage", desc: true }]}
      rowAction={(adapter) =>
        adapter.__typename === "Erc4626VaultAdapter" && adapter.vault
          ? { type: "link", href: `/earn/${adapter.vault.chain.id}/${adapter.vault.vaultAddress}` }
          : null
      }
    />
  );
}
