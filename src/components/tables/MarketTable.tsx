"use client";
import type { ColumnDef } from "@tanstack/react-table";

import { Table } from "@/components/ui/table";
import type { MarketSummary } from "@/data/whisk/getMarketSummaries";
import { type MarketTableDataEntry, useMarketTableData } from "@/hooks/useMarketTableData";
import { sortTableAssetAmount } from "@/utils/sort";

import { TokenIcon } from "../TokenIcon";
import { ApyTooltip } from "../Tooltips/ApyToolip";
import NumberFlow, { NumberFlowWithLoading } from "../ui/number-flow";
import { Skeleton } from "../ui/skeleton";

import { TableAssetAmount } from "./Elements/TableAssetAmount";

interface MarketTableProps {
  marketSummaries: MarketSummary[];
}

function getColumns(isPositionLoading: boolean): ColumnDef<MarketTableDataEntry>[] {
  return [
    {
      id: "collateralAsset",
      accessorFn: (row) => row.marketSummary.collateralAsset?.symbol ?? "N/A",
      header: "Collateral Asset",
      cell: ({ row }) => {
        const { marketSummary } = row.original;
        return marketSummary.collateralAsset ? (
          <div className="flex items-center gap-3">
            <TokenIcon
              token={marketSummary.collateralAsset}
              chain={marketSummary.chain}
              size="md"
              chainClassName="border-[var(--row-color)]"
            />
            <span className="body-medium-plus">{marketSummary.collateralAsset.symbol}</span>
          </div>
        ) : (
          "N/A"
        );
      },
      minSize: 220,
    },
    {
      id: "loanAsset",
      accessorFn: (row) => row.marketSummary.loanAsset.symbol,
      header: "Loan Asset",
      cell: ({ row }) => {
        const { marketSummary } = row.original;
        return (
          <div className="flex items-center gap-3">
            <TokenIcon
              token={marketSummary.loanAsset}
              chain={marketSummary.chain}
              size="md"
              chainClassName="border-[var(--row-color)]"
            />
            <span className="body-medium-plus">{marketSummary.loanAsset.symbol}</span>
          </div>
        );
      },
      minSize: 220,
    },
    {
      id: "yourBorrows",
      accessorFn: (row) => row.position?.borrowAmount.usd ?? 0,
      header: "Your Borrows",
      cell: ({ row }) => {
        const { marketSummary, position } = row.original;
        return (
          <TableAssetAmount
            asset={marketSummary.loanAsset}
            amount={position?.borrowAmount.raw}
            amountUsd={position?.borrowAmount.usd}
            isLoading={isPositionLoading}
          />
        );
      },
      sortingFn: (a, b) =>
        sortTableAssetAmount(
          Number(a.original.position?.borrowAmount.formatted ?? "0"),
          a.original.position?.borrowAmount.usd,
          Number(b.original.position?.borrowAmount.formatted ?? "0"),
          b.original.position?.borrowAmount.usd,
        ),
      minSize: 160,
    },
    {
      id: "inWallet",
      accessorFn: (row) => row.position?.walletCollateralAssetHolding?.balance.usd ?? 0,
      header: "Collateral In Wallet",
      cell: ({ row }) => {
        const { marketSummary, position } = row.original;
        return marketSummary.collateralAsset ? (
          <TableAssetAmount
            asset={marketSummary.collateralAsset}
            amount={position?.walletCollateralAssetHolding?.balance.raw}
            amountUsd={position?.walletCollateralAssetHolding?.balance.usd}
            isLoading={isPositionLoading}
          />
        ) : (
          "N/A"
        );
      },
      sortingFn: (a, b) =>
        sortTableAssetAmount(
          Number(a.original.position?.walletCollateralAssetHolding?.balance.formatted ?? "0"),
          a.original.position?.walletCollateralAssetHolding?.balance.usd,
          Number(b.original.position?.walletCollateralAssetHolding?.balance.formatted ?? "0"),
          b.original.position?.walletCollateralAssetHolding?.balance.usd,
        ),
      minSize: 160,
    },
    {
      id: "ltv",
      accessorFn: (row) => row.position?.ltv ?? 0,
      header: "Your LTV / LLTV",
      cell: ({ row }) => {
        const { marketSummary, position } = row.original;
        return (
          <div className="inline-flex gap-1">
            <NumberFlowWithLoading
              value={Number(position?.ltv?.formatted ?? "0")}
              isLoading={isPositionLoading}
              loadingContent={<Skeleton className="h-full w-[40px]" />}
              format={{ style: "percent", minimumFractionDigits: 1, maximumFractionDigits: 1 }}
            />
            <span>/</span>
            <NumberFlow
              value={Number(marketSummary.lltv?.formatted ?? "0")}
              format={{ style: "percent", minimumFractionDigits: 1, maximumFractionDigits: 1 }}
            />
          </div>
        );
      },
      minSize: 160,
    },
    {
      id: "borrowApy",
      accessorFn: (row) => row.marketSummary.borrowApy.total,
      header: "Borrow APY",
      cell: ({ row }) => {
        const { marketSummary } = row.original;
        return (
          <ApyTooltip
            type="borrow"
            nativeApy={marketSummary.borrowApy.base}
            totalApy={marketSummary.borrowApy.total}
            rewards={marketSummary.borrowApy.rewards}
            triggerVariant="sm"
          />
        );
      },
      minSize: 160,
    },
  ];
}

export function MarketTable({ marketSummaries }: MarketTableProps) {
  const { data, isPositionsLoading } = useMarketTableData({ marketSummaries });
  return (
    <Table
      columns={getColumns(isPositionsLoading)}
      data={data}
      initialSort={[{ id: "yourBorrows", desc: true }]}
      rowAction={(row) => ({
        type: "link",
        href: `/borrow/${row.marketSummary.chain.id}/${row.marketSummary.marketId}`,
      })}
    />
  );
}
