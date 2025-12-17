"use client";
import type { ColumnDef } from "@tanstack/react-table";
import { ApyTooltip } from "@/common/components/ApyToolip";
import NumberFlow, { NumberFlowWithLoading } from "@/common/components/ui/number-flow";
import { Skeleton } from "@/common/components/ui/skeleton";
import { Table } from "@/common/components/ui/table";
import { sortTableAssetAmount } from "@/common/utils/sort";
import type { MarketSummary } from "@/modules/market/data/getMarketSummaries";
import { type MarketTableDataEntry, useMarketTableData } from "@/modules/market/hooks/useMarketTableData";
import { extractMarketBorrowApy } from "@/modules/market/utils/extractMarketBorrowApy";
import { TableAssetAmount } from "@/modules/token/components/TableAssetAmount";
import { TokenIcon } from "@/modules/token/components/TokenIcon";

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
          <div className="flex min-w-0 items-center gap-3">
            <TokenIcon
              token={marketSummary.collateralAsset}
              chain={marketSummary.chain}
              size="md"
              chainClassName="border-[var(--row-color)]"
            />
            <span className="body-medium-plus truncate">{marketSummary.collateralAsset.symbol}</span>
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
          <div className="flex min-w-0 items-center gap-3">
            <TokenIcon
              token={marketSummary.loanAsset}
              chain={marketSummary.chain}
              size="md"
              chainClassName="border-[var(--row-color)]"
            />
            <span className="body-medium-plus truncate">{marketSummary.loanAsset.symbol}</span>
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
      accessorFn: (row) => extractMarketBorrowApy(row.marketSummary).total,
      header: "Borrow APY",
      cell: ({ row }) => {
        const { marketSummary } = row.original;
        const apy = extractMarketBorrowApy(marketSummary);
        return (
          <ApyTooltip
            type="borrow"
            nativeApy={apy.base}
            totalApy={apy.total}
            rewards={apy.rewards}
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
