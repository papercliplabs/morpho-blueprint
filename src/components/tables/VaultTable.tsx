"use client";
import type { ColumnDef } from "@tanstack/react-table";
import { getAddress } from "viem";

import { Table } from "@/components/ui/table";
import { APP_CONFIG } from "@/config";
import type { SupportedChainId, VaultConfig } from "@/config/types";
import type { VaultSummary } from "@/data/whisk/getVaultSummaries";
import { useVaultTableData, type VaultTableDataEntry } from "@/hooks/useVaultTableData";
import { sortTableAssetAmount } from "@/utils/sort";
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
  const includeTypeColumn = Object.values(APP_CONFIG.vaultConfigs ?? {}).some((configs) =>
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
      minSize: 240,
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
      minSize: 140,
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
      minSize: 140,
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
      minSize: 140,
    },
    ...(includeTypeColumn
      ? ([
          {
            id: "type",
            accessorFn: (row) => {
              const configForChain: VaultConfig[] =
                APP_CONFIG.vaultConfigs?.[row.vaultSummary.chain.id as SupportedChainId] ?? [];
              const tag = configForChain.find(
                (vc: VaultConfig) => getAddress(vc.address) === getAddress(row.vaultSummary.vaultAddress),
              )?.tag;
              return tag ?? "";
            },
            header: "Type",
            cell: ({ row }) => {
              const { vaultSummary } = row.original;
              const configForChain: VaultConfig[] =
                APP_CONFIG.vaultConfigs?.[vaultSummary.chain.id as SupportedChainId] ?? [];
              const tag = configForChain.find(
                (vc: VaultConfig) => getAddress(vc.address) === getAddress(vaultSummary.vaultAddress),
              )?.tag;
              return tag ? <Badge variant="small">{tag}</Badge> : "—";
            },
            minSize: 110,
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
            performanceFee={vaultSummary.supplyApy.fee}
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
