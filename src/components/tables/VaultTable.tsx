"use client";
import type { ColumnDef } from "@tanstack/react-table";

import { Table } from "@/components/ui/table";
import { APP_CONFIG } from "@/config";
import type { SupportedChainId } from "@/config/types";
import type { VaultSummary } from "@/data/whisk/getVaultSummaries";
import { useVaultTableData, type VaultTableDataEntry } from "@/hooks/useVaultTableData";
import { sortTableAssetAmount } from "@/utils/sort";
import { extractVaultSupplyApy, getVaultTagData } from "@/utils/vault";
import AvatarGroup from "../AvatarGroup";
import { ApyTooltip } from "../Tooltips/ApyToolip";
import { Badge } from "../ui/badge";
import { VaultName } from "../vault/VaultName";
import { TableAssetAmount } from "./Elements/TableAssetAmount";

interface VaultTableProps {
  vaultSummaries: VaultSummary[];
}

type Column = ColumnDef<VaultTableDataEntry>;
function getColumns(isPositionLoading: boolean): Column[] {
  const includeTypeColumn = Object.values(APP_CONFIG.supportedVaults ?? {}).some((configs) =>
    (configs ?? []).some((c) => c.tag !== undefined),
  );

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
      minSize: 220,
    },
    {
      id: "yourDeposits",
      accessorFn: (row) => row.position?.supplyAmount.usd ?? 0,
      header: "Your Deposits",
      cell: ({ row }) => {
        const { vaultSummary, position } = row.original;
        return (
          <TableAssetAmount
            asset={vaultSummary.asset}
            amount={position?.supplyAmount.raw}
            amountUsd={position?.supplyAmount.usd}
            isLoading={isPositionLoading}
          />
        );
      },
      sortingFn: (a, b) =>
        sortTableAssetAmount(
          Number(a.original.position?.supplyAmount.formatted ?? "0"),
          a.original.position?.supplyAmount.usd,
          Number(b.original.position?.supplyAmount.formatted ?? "0"),
          b.original.position?.supplyAmount.usd,
        ),
      minSize: 130,
    },
    {
      id: "inWallet",
      accessorFn: (row) => row.position?.walletUnderlyingAssetHolding?.balance.usd ?? 0,
      header: "In Wallet",
      cell: ({ row }) => {
        const { vaultSummary, position } = row.original;
        return (
          <TableAssetAmount
            asset={vaultSummary.asset}
            amount={position?.walletUnderlyingAssetHolding?.balance.raw}
            amountUsd={position?.walletUnderlyingAssetHolding?.balance.usd}
            isLoading={isPositionLoading}
          />
        );
      },
      sortingFn: (a, b) =>
        sortTableAssetAmount(
          Number(a.original.position?.walletUnderlyingAssetHolding?.balance.formatted ?? "0"),
          a.original.position?.walletUnderlyingAssetHolding?.balance.usd,
          Number(b.original.position?.walletUnderlyingAssetHolding?.balance.formatted ?? "0"),
          b.original.position?.walletUnderlyingAssetHolding?.balance.usd,
        ),
      minSize: 130,
    },
    {
      id: "totalDeposits",
      accessorFn: (row) => row.vaultSummary.totalSupplied.usd ?? 0,
      header: "Total Deposits",
      cell: ({ row }) => {
        const { vaultSummary } = row.original;
        return (
          <TableAssetAmount
            asset={vaultSummary.asset}
            amount={vaultSummary.totalSupplied.raw}
            amountUsd={vaultSummary.totalSupplied.usd}
            isLoading={false}
          />
        );
      },
      sortingFn: (a, b) =>
        sortTableAssetAmount(
          Number(a.original.vaultSummary.totalSupplied.formatted ?? "0"),
          a.original.vaultSummary.totalSupplied.usd,
          Number(b.original.vaultSummary.totalSupplied.formatted ?? "0"),
          b.original.vaultSummary.totalSupplied.usd,
        ),
      minSize: 130,
    },
    ...(includeTypeColumn
      ? ([
          {
            id: "type",
            accessorFn: (row) =>
              getVaultTagData(row.vaultSummary.chain.id as SupportedChainId, row.vaultSummary.vaultAddress)?.tag ?? "",
            header: "Type",
            cell: ({ row }) => {
              const { vaultSummary } = row.original;
              const tagData = getVaultTagData(vaultSummary.chain.id as SupportedChainId, vaultSummary.vaultAddress);
              return tagData ? (
                <Badge variant="small" style={{ backgroundColor: tagData.color }}>
                  {tagData.tag}
                </Badge>
              ) : (
                "—"
              );
            },
            minSize: 100,
          } as Column,
        ] as Column[])
      : ([] as Column[])),
    ...(!APP_CONFIG.featureFlags.hideCurator
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
            minSize: 120,
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
                    unique.push({ src: icon ?? "" });
                  }
                  return unique;
                },
                [] as { src: string }[],
              )}
            max={4}
            size="sm"
            avatarClassName="border-[var(--row-color)]"
          />
        );
      },
      minSize: 140,
    },
    {
      id: "supplyApy",
      accessorFn: (row) => extractVaultSupplyApy(row.vaultSummary).total,
      header: "Supply APY",
      cell: ({ row }) => {
        const { vaultSummary } = row.original;
        const apy = extractVaultSupplyApy(vaultSummary);
        return (
          <ApyTooltip
            type="earn"
            nativeApy={apy.base}
            totalApy={apy.total}
            performanceFee={apy.fee}
            rewards={apy.rewards}
            triggerVariant="sm"
          />
        );
      },
      minSize: 130,
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
