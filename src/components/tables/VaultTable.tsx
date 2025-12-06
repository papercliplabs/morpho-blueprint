"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Table } from "@/components/ui/table";
import { APP_CONFIG } from "@/config";
import type { SupportedChainId } from "@/config/types";
import type { VaultSummary } from "@/data/whisk/getVaultSummaries";
import { useVaultTableData, type VaultTableDataEntry } from "@/hooks/useVaultTableData";
import { sortTableAssetAmount } from "@/utils/sort";
import { getVaultCurator, getVaultTagData } from "@/utils/vault";
import { ApyTooltip } from "../Tooltips/ApyToolip";
import { VaultCollateralTooltip } from "../Tooltips/VaultCollateralTooltip";
import { Avatar } from "../ui/avatar";
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
      accessorFn: (row) => row.position?.assets.usd ?? 0,
      header: "Your Deposits",
      cell: ({ row }) => {
        const { vaultSummary, position } = row.original;
        return (
          <TableAssetAmount
            asset={vaultSummary.asset}
            amount={position?.assets.raw}
            amountUsd={position?.assets.usd}
            isLoading={isPositionLoading}
          />
        );
      },
      sortingFn: (a, b) =>
        sortTableAssetAmount(
          Number(a.original.position?.assets.formatted ?? "0"),
          a.original.position?.assets.usd,
          Number(b.original.position?.assets.formatted ?? "0"),
          b.original.position?.assets.usd,
        ),
      minSize: 130,
    },
    {
      id: "inWallet",
      accessorFn: (row) => row.position?.walletAssetHolding?.balance.usd ?? 0,
      header: "In Wallet",
      cell: ({ row }) => {
        const { vaultSummary, position } = row.original;
        return (
          <TableAssetAmount
            asset={vaultSummary.asset}
            amount={position?.walletAssetHolding?.balance.raw}
            amountUsd={position?.walletAssetHolding?.balance.usd}
            isLoading={isPositionLoading}
          />
        );
      },
      sortingFn: (a, b) =>
        sortTableAssetAmount(
          Number(a.original.position?.walletAssetHolding?.balance.formatted ?? "0"),
          a.original.position?.walletAssetHolding?.balance.usd,
          Number(b.original.position?.walletAssetHolding?.balance.formatted ?? "0"),
          b.original.position?.walletAssetHolding?.balance.usd,
        ),
      minSize: 130,
    },
    {
      id: "totalDeposits",
      accessorFn: (row) => row.vaultSummary.totalAssets.usd ?? 0,
      header: "Total Deposits",
      cell: ({ row }) => {
        const { vaultSummary } = row.original;
        return (
          <TableAssetAmount
            asset={vaultSummary.asset}
            amount={vaultSummary.totalAssets.raw}
            amountUsd={vaultSummary.totalAssets.usd}
            isLoading={false}
          />
        );
      },
      sortingFn: (a, b) =>
        sortTableAssetAmount(
          Number(a.original.vaultSummary.totalAssets.formatted ?? "0"),
          a.original.vaultSummary.totalAssets.usd,
          Number(b.original.vaultSummary.totalAssets.formatted ?? "0"),
          b.original.vaultSummary.totalAssets.usd,
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
            header: "Curator",
            cell: ({ row }) => {
              const curator = getVaultCurator(row.original.vaultSummary);
              return (
                curator && <Avatar src={curator.image} alt={curator.name} size="sm" className="rounded-full border" />
              );
            },
            minSize: 120,
          } as Column,
        ]
      : []),
    {
      id: "exposure",
      header: "Exposure",
      cell: ({ row }) => <VaultCollateralTooltip vaultSummary={row.original.vaultSummary} />,
      minSize: 140,
    },
    {
      id: "supplyApy",
      accessorFn: (row) => row.vaultSummary.apy.total,
      header: "Supply APY",
      cell: ({ row }) => {
        const { apy } = row.original.vaultSummary;
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
