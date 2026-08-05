"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { ApyTooltip } from "@/common/components/ApyToolip";
import NumberFlow from "@/common/components/ui/number-flow";
import { Table } from "@/common/components/ui/table";
import { rateLabel } from "@/common/utils/timeframe";
import { MarketName } from "@/modules/market/components/MarketName";
import { extractMarketSupplyApy } from "@/modules/market/utils/extractMarketSupplyApy";
import { TotalSupplyTooltip } from "@/modules/vault/components/TotalSupplyTooltip";
import type { VaultMarketAllocation } from "@/modules/vault/vault.types";

type MorphoV1MarketAllocation = VaultMarketAllocation;

interface Props {
  allocations: MorphoV1MarketAllocation[];
  chainId: number;
}

const columns: ColumnDef<MorphoV1MarketAllocation>[] = [
  {
    id: "market",
    accessorFn: (row) => row.market.name,
    header: "Market",
    cell: ({ row }) => {
      const { market } = row.original;
      return (
        <MarketName
          variant="sm"
          {...market}
          collateralAssetClassName="border-[var(--row-color)]"
          loanAssetClassName="border-[var(--row-color)]"
          loanAssetChainClassName="border-[var(--row-color)] bg-[var(--row-color)]"
          lltv={Number(market.lltv?.formatted ?? "0")}
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
    minSize: 100,
  },
  {
    id: "totalSupply",
    accessorKey: "position.supplyAmount.usd",
    header: "Total Supply",
    cell: ({ row }) => {
      const { position, supplyCap } = row.original;
      return (
        <TotalSupplyTooltip
          totalSupply={position.supplyAmount.usd ?? 0}
          supplyCap={supplyCap.usd ?? 0}
          iconPosition="left"
        />
      );
    },
    minSize: 130,
  },
  {
    id: "supplyApy",
    accessorFn: (row) => extractMarketSupplyApy(row.market).total,
    header: rateLabel("Net APY"),
    cell: ({ row }) => {
      const { market } = row.original;
      const supplyApy = extractMarketSupplyApy(market);
      return (
        <ApyTooltip
          type="marketSupply"
          apyAfterFees={supplyApy.afterFees}
          totalApy={supplyApy.total}
          rewards={supplyApy.rewards}
          triggerVariant="sm"
        />
      );
    },
    minSize: 130,
  },
];

export function MorphoV1MarketAllocationTable({ allocations, chainId }: Props) {
  return (
    <Table
      columns={columns}
      data={allocations.filter(({ enabled }) => enabled)}
      initialSort={[{ id: "allocation", desc: true }]}
      rowAction={(row) =>
        row.market.isIdle
          ? null
          : {
              type: "link",
              href: `/borrow/${chainId}/${row.market.marketId}`,
            }
      }
    />
  );
}
