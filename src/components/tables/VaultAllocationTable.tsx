"use client";
import { ColumnDef } from "@tanstack/react-table";
import { getAddress } from "viem";

import { Table } from "@/components/ui/table";
import { Market } from "@/data/whisk/getMarket";

import AvatarGroup from "../AvatarGroup";
import { TotalSupplyTooltip } from "../Tooltips/TotalSupplyTooltip";
import NumberFlow from "../ui/number-flow";
import { VaultName } from "../vault/VaultName";

interface VaultAllocationTableProps {
  market: Market;
}

const columns: ColumnDef<Market["vaultAllocations"][number]>[] = [
  {
    id: "vault",
    accessorFn: (row) => row.vault.name,
    header: "Vault Name",
    cell: ({ row }) => {
      const { vault } = row.original;
      return <VaultName {...vault} />;
    },
    minSize: 260,
  },
  {
    id: "curator",
    accessorFn: (row) => row.vault.metadata?.curators[0]?.name ?? "",
    header: "Curator",
    cell: ({ row }) => {
      const { vault } = row.original;
      const curators = vault.metadata?.curators ?? [];
      return curators.length > 0 ? (
        <AvatarGroup
          avatars={curators.map((curator) => ({
            src: curator.image,
            fallback: curator.name,
          }))}
          max={2}
          size="sm"
          className="rounded-full border"
        />
      ) : (
        "None"
      );
    },
    minSize: 130,
  },
  {
    id: "supplyShare",
    accessorKey: "marketSupplyShare",
    header: "Supply Share",
    cell: ({ row }) => {
      const { marketSupplyShare } = row.original;
      return <NumberFlow value={marketSupplyShare} format={{ style: "percent" }} />;
    },
    minSize: 160,
  },
  {
    id: "totalSupply",
    accessorKey: "position.supplyAssetsUsd",
    header: "Total Supply",
    cell: ({ row }) => {
      const { position, supplyCapUsd } = row.original;
      return <TotalSupplyTooltip totalSupply={position.supplyAssetsUsd} supplyCap={supplyCapUsd} iconPosition="left" />;
    },
    minSize: 160,
  },
];

export function VaultAllocationTable({ market }: VaultAllocationTableProps) {
  return (
    <Table
      columns={columns}
      data={market.vaultAllocations}
      initialSort={[{ id: "totalSupply", desc: true }]}
      rowAction={(row) => ({
        type: "link",
        href: `/earn/${market.chain.id}/${getAddress(row.vault.vaultAddress)}`,
      })}
    />
  );
}
