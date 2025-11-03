"use client";
import type { ColumnDef } from "@tanstack/react-table";
import { useMemo } from "react";
import { getAddress } from "viem";

import { Table } from "@/components/ui/table";
import { APP_CONFIG } from "@/config";
import type { Market } from "@/data/whisk/getMarket";

import { TotalSupplyTooltip } from "../Tooltips/TotalSupplyTooltip";
import { Avatar } from "../ui/avatar";
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
  ...(!APP_CONFIG.featureFlags.hideCurator
    ? [
        {
          id: "curator",
          accessorFn: (row) => row.vault.metadata?.curator?.name ?? "",
          header: "Curator",
          cell: ({ row }) => {
            const { vault } = row.original;
            const curator = vault.metadata?.curator;
            return curator ? (
              <Avatar src={curator.image} alt={curator.name} size="sm" className="rounded-full border" />
            ) : (
              "Unknown"
            );
          },
          minSize: 130,
        } as Column,
      ]
    : []),
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
      vaults.map((vault) => `${chainId}:${getAddress(vault.address)}`),
    );
    return market.vaultAllocations.filter((allocation) => {
      const identifier = `${allocation.vault.chain.id}:${allocation.vault.vaultAddress}`;
      const isSupported = supportedVaultIdentifiers.some((identifiers) => identifiers.includes(identifier));
      return allocation.enabled && isSupported;
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
