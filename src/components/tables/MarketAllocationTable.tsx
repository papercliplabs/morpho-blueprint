"use client";
import { ColumnDef } from "@tanstack/react-table";
import { useMemo } from "react";

import { Table } from "@/components/ui/table";
import { Vault } from "@/data/whisk/getVault";

import { MarketName } from "../market/MarketName";
import { ApyTooltip } from "../Tooltips/ApyToolip";
import { TotalSupplyTooltip } from "../Tooltips/TotalSupplyTooltip";
import NumberFlow from "../ui/number-flow";

interface MarketAllocationTableProps {
  vault: Vault;
}

const columns: ColumnDef<Vault["marketAllocations"][number]>[] = [
  {
    id: "market",
    accessorFn: (row) => row.market.name,
    header: "Market Name",
    cell: ({ row }) => {
      const { market } = row.original;
      return (
        <MarketName
          variant="sm"
          {...market}
          collateralAssetClassName="border-[var(--row-color)]"
          loanAssetClassName="border-[var(--row-color)]"
          loanAssetChainClassName="border-[var(--row-color)]"
        />
      );
    },
    minSize: 260,
  },
  {
    id: "allocation",
    accessorKey: "vaultSupplyShare",
    header: "Allocation",
    cell: ({ row }) => {
      const { vaultSupplyShare } = row.original;
      return <NumberFlow value={vaultSupplyShare} format={{ style: "percent" }} />;
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
  {
    id: "supplyApy",
    accessorKey: "market.supplyApy.total",
    header: "Total Supply",
    cell: ({ row }) => {
      const { market } = row.original;
      return (
        <ApyTooltip
          type="earn"
          nativeApy={market.supplyApy.base}
          totalApy={market.supplyApy.total}
          rewards={market.supplyApy.rewards}
          triggerVariant="sm"
        />
      );
    },
    minSize: 160,
  },
];

export function MarketAllocationTable({ vault }: MarketAllocationTableProps) {
  const data = useMemo(() => {
    return vault.marketAllocations.filter((market) => market.enabled);
  }, [vault]);

  return (
    <Table
      columns={columns}
      data={data}
      initialSort={[{ id: "allocation", desc: true }]}
      rowAction={(row) =>
        row.market.isIdle
          ? null
          : {
              type: "link",
              href: `/borrow/${vault.chain.id}/${row.market.marketId}`,
            }
      }
    />
  );
}
