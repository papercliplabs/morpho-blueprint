"use client";
import type { ColumnDef } from "@tanstack/react-table";
import { useMemo } from "react";
import { getAddress } from "viem";

import { Table } from "@/components/ui/table";
import { APP_CONFIG } from "@/config";
import type { Market } from "@/data/whisk/getMarket";

import AvatarGroup from "../AvatarGroup";
import { TotalSupplyTooltip } from "../Tooltips/TotalSupplyTooltip";
import NumberFlow from "../ui/number-flow";
import { VaultName } from "../vault/VaultName";

interface VaultAllocationTableProps {
  market: Market;
}

type Column = ColumnDef<Market["vaultAllocations"][number]>;
const columns: Column[] = [
  {
    id: "vault",
    accessorFn: (row) => row.vault.name,
    header: "Vault Name",
    cell: ({ row }) => {
      const { vault } = row.original;
      return <VaultName {...vault} chainClassName="border-[var(--row-color)]" />;
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
          }))}
          max={2}
          size="sm"
          className="rounded-full"
          avatarClassName="border-[var(--row-color)]"
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
      const { position, supplyCap } = row.original;
      return (
        <TotalSupplyTooltip
          totalSupply={position.supplyAmount.usd ?? 0}
          supplyCap={supplyCap.usd}
          iconPosition="left"
        />
      );
    },
    minSize: 160,
  },
];

export function VaultAllocationTable({ market }: VaultAllocationTableProps) {
  const data = useMemo(() => {
    const supportedVaultIdentifiers = Object.entries(APP_CONFIG.supportedVaults).map(([chainId, vaults]) =>
      vaults.map((vault) => `${chainId}:${vault}`),
    );
    return market.vaultAllocations.filter((allocation) => {
      const identifier = `${allocation.vault.chain.id}:${allocation.vault.vaultAddress}`;
      const isWhitelisted = supportedVaultIdentifiers.some((identifiers) => identifiers.includes(identifier));
      return allocation.enabled && (APP_CONFIG.featureFlags.showUnsupportedVaults || isWhitelisted);
    });
  }, [market]);

  return (
    <Table
      columns={columns}
      data={data}
      initialSort={[{ id: "totalSupply", desc: true }]}
      rowAction={(row) => ({
        type: "link",
        href: `/earn/${market.chain.id}/${getAddress(row.vault.vaultAddress)}`,
      })}
    />
  );
}
