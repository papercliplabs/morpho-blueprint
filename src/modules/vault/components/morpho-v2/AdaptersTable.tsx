"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { use } from "react";
import { ApyTooltip } from "@/common/components/ApyToolip";
import NumberFlow from "@/common/components/ui/number-flow";
import { Table } from "@/common/components/ui/table";
import { TokenIcon } from "@/modules/token/components/TokenIcon";
import type { MorphoVaultV2 } from "@/modules/vault/vault.types";
import { CapFilledTooltip } from "./CapFilledTooltip";

interface Props {
  vaultPromise: Promise<MorphoVaultV2>;
}

type Adapter = MorphoVaultV2["adapters"][number];

const TYPE_LABELS: Partial<Record<NonNullable<Adapter["__typename"]>, string>> = {
  VaultV1Adapter: "Vaults v1",
  MarketV1Adapter: "Markets v1",
};

const columns: ColumnDef<Adapter & { percentage: number }>[] = [
  { accessorKey: "__typename", enableSorting: false },
  {
    id: "name",
    accessorKey: "name",
    header: "Vaults / Markets",
    cell: ({ row }) => {
      const { __typename, name } = row.original;
      return (
        <div className="body-medium-plus flex min-w-0 items-center gap-2">
          {__typename === "VaultV1Adapter" && row.original.vault && (
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
    accessorFn: (row) => (row.__typename === "VaultV1Adapter" ? row.vault?.apy?.total : null) ?? 0,
    header: "APY",
    cell: ({ row }) => {
      const adapter = row.original;

      if (adapter.__typename !== "VaultV1Adapter" || !adapter.vault?.apy) {
        return <span className="text-muted-foreground">-</span>;
      }

      const { base, total, rewards } = adapter.vault.apy;
      return <ApyTooltip type="earn" nativeApy={base} totalApy={total} rewards={rewards} triggerVariant="sm" />;
    },
    minSize: 120,
  },
];

export function AdaptersTable({ vaultPromise }: Props) {
  const vault = use(vaultPromise);
  if (!vault) return null;

  const totalSupply = Number(vault.totalAssets?.formatted ?? "0");

  const adapters = vault.adapters
    .filter(({ isEnabled }) => isEnabled)
    .map((adapter) => {
      const allocation = Number(adapter.adapterCap?.allocation?.formatted ?? "0");
      return { ...adapter, percentage: totalSupply > 0 ? allocation / totalSupply : 0 };
    })
    .sort((a, b) => b.percentage - a.percentage);

  return (
    <Table
      columns={columns}
      data={adapters}
      groupBy="__typename"
      groupLabels={TYPE_LABELS}
      initialSort={[{ id: "percentage", desc: true }]}
      rowAction={(adapter) =>
        adapter.__typename === "VaultV1Adapter" && adapter.vault
          ? { type: "link", href: `/earn/${adapter.vault.chain.id}/${adapter.vault.vaultAddress}` }
          : null
      }
    />
  );
}
