import "server-only";

import { cache } from "react";
import type { Address } from "viem";
import { HISTORY_RANGE_KEYS, type HistoryRange, historyOptions } from "@/common/data/adapters/timeseries";
import { executeMorphoQuery } from "@/common/utils/executeMorphoQuery";
import { apyLookbackPeriod, vaultV2HistoryLookbackHours } from "@/common/utils/timeframe";
import { APP_CONFIG } from "@/config";
import type { SupportedChainId } from "@/config/types";
import { Erc4626VaultProtocol } from "@/config/vault-protocol";
import { graphql } from "@/generated/gql/morpho";
import { normalizeVault } from "@/modules/vault/utils/normalizeVault";
import type { Vault, VaultHistoricalData } from "@/modules/vault/vault.types";
import { toMorphoVaultV1Details, toMorphoVaultV2Details, toVaultHistoricalEntries } from "./adapters";
import { ADAPTERS_PAGE_SIZE, CAPS_PAGE_SIZE, POSITIONS_PAGE_SIZE } from "./pagination";

const vaultV2Query = graphql(`
  query VaultV2(
    $chainId: Int!
    $address: String!
    $lookbackV1: VaultV1LookbackPeriod!
    $lookbackV2: VaultV2LookbackPeriod!
    $capsFirst: Int!
    $adaptersFirst: Int!
    $positionsFirst: Int!
  ) {
    vaultV2s(first: 1, where: { chainId_in: [$chainId], address_in: [$address] }) {
      items {
        ...MorphoVaultV2SummaryFragment
        ...MorphoVaultV2DetailsFragment
      }
    }
  }
`);

const vaultV2HistoryQuery = graphql(`
  query VaultV2History($chainId: Int!, $address: String!, $lookbackHours: Int!, $options: TimeseriesOptions!) {
    vaultV2s(first: 1, where: { chainId_in: [$chainId], address_in: [$address] }) {
      items {
        historicalState {
          ...MorphoVaultV2HistoryFragment
        }
      }
    }
  }
`);

const vaultV1Query = graphql(`
  query VaultV1($chainId: Int!, $address: String!, $lookbackV1: VaultV1LookbackPeriod!) {
    vaults(first: 1, where: { chainId_in: [$chainId], address_in: [$address] }) {
      items {
        ...MorphoVaultV1SummaryFragment
        ...MorphoVaultV1DetailsFragment
      }
    }
  }
`);

const vaultV1HistoryQuery = graphql(`
  query VaultV1History($chainId: Int!, $address: String!, $options: TimeseriesOptions!) {
    vaults(first: 1, where: { chainId_in: [$chainId], address_in: [$address] }) {
      items {
        historicalState {
          ...MorphoVaultV1HistoryFragment
        }
      }
    }
  }
`);

export type { Vault };

/**
 * Fetches the three chart resolutions in parallel; each is its own request (see `historyOptions`).
 * Keyed by range rather than positional, so `HISTORY_RANGE_KEYS`' order is not load-bearing.
 */
async function fetchHistoryRanges<T>(
  fetchRange: (range: HistoryRange) => Promise<T | null>,
): Promise<Record<HistoryRange, T | null>> {
  const entries = await Promise.all(HISTORY_RANGE_KEYS.map(async (range) => [range, await fetchRange(range)] as const));
  return Object.fromEntries(entries) as Record<HistoryRange, T | null>;
}

export const getVault = cache(
  async (chainId: SupportedChainId, vaultAddress: Address, protocol: Erc4626VaultProtocol): Promise<Vault> => {
    if (protocol === Erc4626VaultProtocol.MorphoV1) {
      const [data, history] = await Promise.all([
        executeMorphoQuery(vaultV1Query, { chainId, address: vaultAddress, lookbackV1: apyLookbackPeriod }),
        fetchHistoryRanges(async (range) => {
          const response = await executeMorphoQuery(vaultV1HistoryQuery, {
            chainId,
            address: vaultAddress,
            options: historyOptions(range),
          });
          return response.vaults.items?.[0]?.historicalState ?? null;
        }),
      ]);

      const vault = data.vaults.items?.[0];
      if (!vault) throw new Error(`Vault not found: ${chainId}:${vaultAddress}`);

      const decimals = Math.round(vault.asset.decimals);
      // Vault V1 history serves every net APY window natively as its own series.
      const historical: VaultHistoricalData = buildHistoricalData(history, (series) =>
        toVaultHistoricalEntries(
          {
            totalAssets: series.totalAssets,
            totalAssetsUsd: series.totalAssetsUsd,
            netApy: {
              "6h": series.netApy,
              "1d": series.dailyNetApy,
              "7d": series.weeklyNetApy,
              "30d": series.monthlyNetApy,
            },
          },
          decimals,
        ),
      );

      return normalizeVault({ ...toMorphoVaultV1Details(vault), historical });
    }

    const [data, history] = await Promise.all([
      executeMorphoQuery(vaultV2Query, {
        chainId,
        address: vaultAddress,
        lookbackV1: apyLookbackPeriod,
        lookbackV2: apyLookbackPeriod,
        capsFirst: CAPS_PAGE_SIZE,
        adaptersFirst: ADAPTERS_PAGE_SIZE,
        positionsFirst: POSITIONS_PAGE_SIZE,
      }),
      fetchHistoryRanges(async (range) => {
        const response = await executeMorphoQuery(vaultV2HistoryQuery, {
          chainId,
          address: vaultAddress,
          lookbackHours: vaultV2HistoryLookbackHours,
          options: historyOptions(range),
        });
        return response.vaultV2s.items?.[0]?.historicalState ?? null;
      }),
    ]);

    const vault = data.vaultV2s.items?.[0];
    if (!vault) throw new Error(`Vault not found: ${chainId}:${vaultAddress}`);

    const decimals = Math.round(vault.asset.decimals);
    // Only the configured window is fetched, so it is filed under exactly that key — note the
    // series is smoothed over at most 24h whatever the window (see `vaultV2HistoryLookbackHours`).
    const historical: VaultHistoricalData = buildHistoricalData(history, (series) =>
      toVaultHistoricalEntries(
        {
          totalAssets: series.totalAssets,
          totalAssetsUsd: series.totalAssetsUsd,
          netApy: { [APP_CONFIG.apyWindow]: series.avgNetApy },
        },
        decimals,
      ),
    );

    return normalizeVault({ ...toMorphoVaultV2Details(vault), historical });
  },
);

/** Maps each fetched resolution onto its chart series; a range the API served nothing for is empty. */
function buildHistoricalData<T>(
  byRange: Record<HistoryRange, T | null>,
  toEntries: (series: T) => ReturnType<typeof toVaultHistoricalEntries>,
): VaultHistoricalData {
  const entriesFor = (range: HistoryRange) => {
    const series = byRange[range];
    return series ? toEntries(series) : [];
  };
  return { hourly: entriesFor("hourly"), daily: entriesFor("daily"), weekly: entriesFor("weekly") };
}
