"use client";
import { ColumnDef } from "@tanstack/react-table";

import { Table } from "@/components/ui/table";
import { MarketSummary } from "@/data/whisk/getMarketSummaries";
import { MarketTableDataEntry, useMarketTableData } from "@/hooks/useMarketTableData";

import { ApyTooltip } from "../Tooltips/ApyToolip";
import { Avatar } from "../ui/avatar";
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
            <Avatar
              src={marketSummary.collateralAsset.icon}
              fallback={marketSummary.collateralAsset.symbol}
              size="sm"
              sub={
                <Avatar
                  src={marketSummary.chain.icon}
                  alt={marketSummary.chain.name}
                  fallback={marketSummary.chain.name}
                  size="xs"
                  className="border-background border-2"
                />
              }
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
            <Avatar
              src={marketSummary.loanAsset.icon}
              fallback={marketSummary.loanAsset.symbol}
              size="sm"
              sub={
                <Avatar
                  src={marketSummary.chain.icon}
                  alt={marketSummary.chain.name}
                  fallback={marketSummary.chain.name}
                  size="xs"
                  className="border-background border-2"
                />
              }
            />
            <span className="body-medium-plus">{marketSummary.loanAsset.symbol}</span>
          </div>
        );
      },
      minSize: 220,
    },
    {
      id: "yourBorrows",
      accessorFn: (row) => row.position?.borrowAssetsUsd ?? 0,
      header: "Your Borrows",
      cell: ({ row }) => {
        const { marketSummary, position } = row.original;
        return (
          <TableAssetAmount
            asset={marketSummary.loanAsset}
            amount={position?.borrowAssets}
            amountUsd={position?.borrowAssetsUsd}
            isLoading={isPositionLoading}
          />
        );
      },
      minSize: 160,
    },
    {
      id: "inWallet",
      accessorFn: (row) => row.position?.walletCollateralAssetHolding?.balanceUsd ?? 0,
      header: "Collateral In Wallet",
      cell: ({ row }) => {
        const { marketSummary, position } = row.original;
        return marketSummary.collateralAsset ? (
          <TableAssetAmount
            asset={marketSummary.collateralAsset}
            amount={position?.walletCollateralAssetHolding?.balance}
            amountUsd={position?.walletCollateralAssetHolding?.balanceUsd}
            isLoading={isPositionLoading}
          />
        ) : (
          "N/A"
        );
      },
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
              value={position?.ltv}
              isLoading={isPositionLoading}
              loadingContent={<Skeleton className="h-full w-[40px]" />}
              format={{ style: "percent", minimumFractionDigits: 1, maximumFractionDigits: 1 }}
            />
            <span>/</span>
            <NumberFlow
              value={marketSummary.lltv}
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
