"use client";
import { ColumnDef } from "@tanstack/react-table";

import { Table } from "@/components/ui/table";
import { APP_CONFIG } from "@/config";
import { VaultSummary } from "@/data/whisk/getVaultSummaries";
import { VaultTableDataEntry, useVaultTableData } from "@/hooks/useVaultTableData";
import { descaleBigIntToNumber } from "@/utils/format";
import { sortTableAssetAmount } from "@/utils/sort";

import AvatarGroup from "../AvatarGroup";
import { ApyTooltip } from "../Tooltips/ApyToolip";
import { VaultName } from "../vault/VaultName";

import { TableAssetAmount } from "./Elements/TableAssetAmount";

interface VaultTableProps {
  vaultSummaries: VaultSummary[];
}

type Column = ColumnDef<VaultTableDataEntry>;
function getColumns(isPositionLoading: boolean): Column[] {
  return [
    {
      accessorKey: "vaultSummary.name",
      header: "Vault Name",
      cell: ({ row }) => {
        const { vaultSummary } = row.original;
        return (
          <VaultName
            chain={vaultSummary.chain}
            name={vaultSummary.name}
            asset={vaultSummary.asset}
            chainClassName="border-[var(--row-color)]"
          />
        );
      },
      minSize: 240,
    },
    {
      id: "yourDeposits",
      accessorFn: (row) => row.position?.supplyAssetsUsd ?? 0,
      header: "Your Deposits",
      cell: ({ row }) => {
        const { vaultSummary, position } = row.original;
        return (
          <TableAssetAmount
            asset={vaultSummary.asset}
            amount={position?.supplyAssets}
            amountUsd={position?.supplyAssetsUsd}
            isLoading={isPositionLoading}
          />
        );
      },
      sortingFn: (a, b) =>
        sortTableAssetAmount(
          descaleBigIntToNumber(a.original.position?.supplyAssets ?? "0", a.original.vaultSummary.asset.decimals),
          a.original.position?.supplyAssetsUsd,
          descaleBigIntToNumber(b.original.position?.supplyAssets ?? "0", b.original.vaultSummary.asset.decimals),
          b.original.position?.supplyAssetsUsd
        ),
      minSize: 140,
    },
    {
      id: "inWallet",
      accessorFn: (row) => row.position?.walletUnderlyingAssetHolding?.balanceUsd ?? 0,
      header: "In Wallet",
      cell: ({ row }) => {
        const { vaultSummary, position } = row.original;
        return (
          <TableAssetAmount
            asset={vaultSummary.asset}
            amount={position?.walletUnderlyingAssetHolding?.balance}
            amountUsd={position?.walletUnderlyingAssetHolding?.balanceUsd}
            isLoading={isPositionLoading}
          />
        );
      },
      sortingFn: (a, b) =>
        sortTableAssetAmount(
          descaleBigIntToNumber(
            a.original.position?.walletUnderlyingAssetHolding?.balance ?? "0",
            a.original.vaultSummary.asset.decimals
          ),
          a.original.position?.walletUnderlyingAssetHolding?.balanceUsd,
          descaleBigIntToNumber(
            b.original.position?.walletUnderlyingAssetHolding?.balance ?? "0",
            b.original.vaultSummary.asset.decimals
          ),
          b.original.position?.walletUnderlyingAssetHolding?.balanceUsd
        ),
      minSize: 140,
    },
    {
      id: "totalDeposits",
      accessorFn: (row) => row.vaultSummary.supplyAssetsUsd,
      header: "Total Deposits",
      cell: ({ row }) => {
        const { vaultSummary } = row.original;
        return (
          <TableAssetAmount
            asset={vaultSummary.asset}
            amount={vaultSummary.supplyAssets}
            amountUsd={vaultSummary.supplyAssetsUsd}
            isLoading={false}
          />
        );
      },
      sortingFn: (a, b) =>
        sortTableAssetAmount(
          descaleBigIntToNumber(a.original.vaultSummary.supplyAssets ?? "0", a.original.vaultSummary.asset.decimals),
          a.original.vaultSummary.supplyAssetsUsd,
          descaleBigIntToNumber(b.original.vaultSummary.supplyAssets ?? "0", b.original.vaultSummary.asset.decimals),
          b.original.vaultSummary.supplyAssetsUsd
        ),
      minSize: 140,
    },
    ...(APP_CONFIG.featureFlags.curatorColumn
      ? [
          {
            id: "curator",
            accessorFn: (row) => row.vaultSummary.metadata?.curators[0]?.name ?? "",
            header: "Curator",
            cell: ({ row }) => {
              const { vaultSummary } = row.original;
              const curators = vaultSummary.metadata?.curators ?? [];
              return curators.length > 0 ? (
                <AvatarGroup
                  avatars={curators.map((curator) => ({
                    src: curator.image,
                    fallback: curator.name,
                  }))}
                  max={2}
                  size="sm"
                  className="rounded-full border"
                  avatarClassName="border-[var(--row-color)]"
                />
              ) : (
                "None"
              );
            },
            minSize: 130,
          } as Column,
        ]
      : []),
    {
      id: "collateral",
      accessorFn: (row) => row.vaultSummary.marketAllocations.length,
      header: "Collateral",
      cell: ({ row }) => {
        const { vaultSummary } = row.original;
        return (
          <AvatarGroup
            avatars={vaultSummary.marketAllocations
              .filter((allocation) => allocation.market.collateralAsset)
              .reduce(
                (unique, allocation) => {
                  const icon = allocation.market.collateralAsset!.icon;
                  if (!unique.some((item) => item.src === icon)) {
                    unique.push({ src: icon });
                  }
                  return unique;
                },
                [] as { src: string }[]
              )}
            max={4}
            size="sm"
            avatarClassName="border-[var(--row-color)]"
          />
        );
      },
      minSize: 150,
    },
    {
      id: "supplyApy",
      accessorFn: (row) => row.vaultSummary.supplyApy.total,
      header: "Supply APY",
      cell: ({ row }) => {
        const { vaultSummary } = row.original;
        return (
          <ApyTooltip
            type="earn"
            nativeApy={vaultSummary.supplyApy.base}
            totalApy={vaultSummary.supplyApy.total}
            performanceFee={vaultSummary.supplyApy.performanceFee}
            rewards={vaultSummary.supplyApy.rewards}
            triggerVariant="sm"
          />
        );
      },
      minSize: 140,
    },
  ];
}

export function VaultTable({ vaultSummaries }: VaultTableProps) {
  const { data, isPositionsLoading } = useVaultTableData({ vaultSummaries });
  return (
    <Table
      columns={getColumns(isPositionsLoading)}
      data={data}
      initialSort={[
        { id: "yourDeposits", desc: true },
        { id: "totalDeposits", desc: true },
      ]}
      rowAction={(row) => ({
        type: "link",
        href: `/earn/${row.vaultSummary.chain.id}/${row.vaultSummary.vaultAddress}`,
      })}
    />
  );
}
